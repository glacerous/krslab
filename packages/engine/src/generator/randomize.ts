import { Course, Section, Rule, ScheduleVariant } from "../rules/types";
import { evaluateAllRules } from "../rules/evaluate";

interface GeneratorOptions {
    target: number;
    maxAttempts: number;
    seed?: number;
}

export interface GeneratorResult {
    variants: ScheduleVariant[];
    failureSummary?: {
        ruleId: string;
        hits: number;
    }[];
    blockerSubjects?: {
        subjectId: string;
        hits?: number;
        reason?: string;
    }[];
    stats?: {
        totalRecursions: number;
        restarts: number;
        totalAttempts: number;
        maxAttempts: number;
        seed: number;
        timeMs: number;
        budgetExhausted: boolean;
    };
}

export function generateRandomValidSchedules(
    courses: Course[],
    rules: Rule[],
    opts: GeneratorOptions,
    engine: {
        sectionsConflict: (a: Section, b: Section) => boolean;
        initialPicks?: Record<string, Section>;
    }
): GeneratorResult {
    const { target, maxAttempts, seed = Date.now() } = opts;

    // Simple seeded RNG (LCG)
    let currentSeed = seed;
    function random(): number {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
        return currentSeed / 4294967296;
    }

    function shuffle<T>(array: T[]): T[] {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Sort courses by fewest sections first (hardest to satisfy)
    // Add random tie-break to avoid deterministic dead ends for subjects with same class count
    const frozenIds = new Set(Object.keys(engine.initialPicks ?? {}));
    const sortedCourses = courses
        .filter(c => !frozenIds.has(c.subjectId))
        .sort((a, b) => {
            if (a.classes.length === b.classes.length) return random() - 0.5;
            return a.classes.length - b.classes.length;
        });

    const validVariants: ScheduleVariant[] = [];
    const seenKeys = new Set<string>();
    let totalAttempts = 0;
    const failureCounts = new Map<string, number>();
    const deadEndCounts = new Map<string, number>();

    // Heuristic 2: Feasibility check (each subject vs frozen)
    const blockerSubjects: { subjectId: string; hits?: number; reason?: string }[] = [];
    if (engine.initialPicks) {
        for (const course of courses) {
            let feasibleCount = 0;
            for (const section of course.classes) {
                let sectionConflict = false;
                for (const frozenSection of Object.values(engine.initialPicks)) {
                    if (engine.sectionsConflict(section, frozenSection)) {
                        sectionConflict = true;
                        break;
                    }
                }
                if (!sectionConflict) feasibleCount++;
            }
            if (feasibleCount === 0) {
                blockerSubjects.push({ subjectId: course.subjectId, reason: "No compatible classes with frozen selection" });
            }
        }
    }

    function getVariantKey(picks: Record<string, Section>): string {
        return Object.entries(picks)
            .sort(([idA], [idB]) => idA.localeCompare(idB))
            .map(([courseId, section]) => `${courseId}:${section.classId}`)
            .join("|");
    }

    // Perform multiple restarts to improve hit rate and diversification
    const RESTARTS = 25;
    let currentRestartAttempts = 0;
    const attemptsPerRestart = Math.ceil(maxAttempts / RESTARTS);

    function backtrack(courseIdx: number, currentPicks: Record<string, Section>) {
        totalRecursions++;
        if (validVariants.length >= target || totalAttempts >= maxAttempts) return;
        if (currentRestartAttempts >= attemptsPerRestart) return;

        if (courseIdx === sortedCourses.length) {
            totalAttempts++;
            currentRestartAttempts++;
            const fullPicks = { ...currentPicks, ...(engine.initialPicks ?? {}) };
            const variant: ScheduleVariant = { picks: fullPicks };

            const evalRes = evaluateAllRules(rules, variant);
            if (evalRes.ok) {
                const key = getVariantKey(fullPicks);
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    validVariants.push(variant);
                }
            } else {
                // Track rule failures
                for (const ruleId of evalRes.fails) {
                    failureCounts.set(ruleId, (failureCounts.get(ruleId) || 0) + 1);
                }
            }
            return;
        }

        const course = sortedCourses[courseIdx];

        // If engine.initialPicks?.[course.subjectId] exists, force-pick it and recurse (safety fallback)
        if (engine.initialPicks?.[course.subjectId]) {
            currentPicks[course.subjectId] = engine.initialPicks[course.subjectId];
            backtrack(courseIdx + 1, currentPicks);
            delete currentPicks[course.subjectId];
            return;
        }

        const shuffledSections = shuffle(course.classes);

        let fitSections = 0;
        let attemptedInThisCourse = 0;

        for (const section of shuffledSections) {
            if (validVariants.length >= target || totalAttempts >= maxAttempts) break;
            if (currentRestartAttempts >= attemptsPerRestart) break;
            attemptedInThisCourse++;

            // Early conflict prune
            let hasConflict = false;
            // Check against current mutable picks
            for (const pickedSection of Object.values(currentPicks)) {
                if (engine.sectionsConflict(section, pickedSection)) {
                    hasConflict = true;
                    break;
                }
            }
            // Check against initial/frozen picks
            if (!hasConflict && engine.initialPicks) {
                for (const frozenSection of Object.values(engine.initialPicks)) {
                    if (engine.sectionsConflict(section, frozenSection)) {
                        hasConflict = true;
                        break;
                    }
                }
            }

            if (!hasConflict) {
                fitSections++;
                currentPicks[course.subjectId] = section;

                // Early rule pruning: Check only monotonic rules that can't be fixed by adding more courses
                const fullPicks = { ...currentPicks, ...(engine.initialPicks ?? {}) };
                const prunableRules = rules.filter(r =>
                    r.enabled && ["noDay", "timeWindow", "maxDaysPerWeek", "compactDays"].includes(r.type)
                );

                let rulesOk = true;
                if (prunableRules.length > 0) {
                    const evalRes = evaluateAllRules(prunableRules, { picks: fullPicks });
                    if (!evalRes.ok) {
                        rulesOk = false;
                        // Still track these as failures for the final summary if we find nothing
                        for (const ruleId of evalRes.fails) {
                            failureCounts.set(ruleId, (failureCounts.get(ruleId) || 0) + 1);
                        }
                    }
                }

                if (rulesOk) {
                    backtrack(courseIdx + 1, currentPicks);
                }

                delete currentPicks[course.subjectId];
            }
        }

        if (fitSections === 0 && attemptedInThisCourse > 0) {
            deadEndCounts.set(course.subjectId, (deadEndCounts.get(course.subjectId) || 0) + 1);
        }
    }

    const startTime = Date.now();
    let totalRecursions = 0;
    let restartCount = 0;

    for (let r = 0; r < RESTARTS; r++) {
        restartCount++;
        if (validVariants.length >= target || totalAttempts >= maxAttempts) break;

        currentRestartAttempts = 0;
        backtrack(0, {});

        // Advance RNG so next restart explores different region
        currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    }

    const result: GeneratorResult = {
        variants: validVariants,
        stats: {
            totalRecursions,
            restarts: restartCount,
            totalAttempts,
            maxAttempts,
            seed,
            timeMs: Date.now() - startTime,
            budgetExhausted: totalAttempts >= maxAttempts
        }
    };

    if (validVariants.length === 0) {
        // Collect failure info
        if (failureCounts.size > 0) {
            result.failureSummary = Array.from(failureCounts.entries())
                .map(([ruleId, hits]) => ({ ruleId, hits }))
                .sort((a, b) => b.hits - a.hits)
                .slice(0, 3);
        }

        // Combine heuristic blockers and dead-end tracking
        const results: { subjectId: string; hits?: number; reason?: string }[] = [...blockerSubjects];

        // Add dead-end leaders
        const deadEnds = Array.from(deadEndCounts.entries())
            .map(([subjectId, hits]) => ({ subjectId, hits }))
            .sort((a, b) => b.hits - a.hits);

        for (const de of deadEnds) {
            if (results.length >= 3) break;
            if (!results.some(r => r.subjectId === de.subjectId)) {
                results.push(de);
            }
        }

        if (results.length > 0) {
            result.blockerSubjects = results;
        }
    }

    return result;
}
