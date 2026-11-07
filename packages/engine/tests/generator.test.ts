import { describe, it, expect } from "vitest";
import { checkMeetingConflict, checkClassConflict, generateRandomValidSchedules } from "../src/index";

describe("Conflict & Solver Engine", () => {
    it("detects overlapping meetings on the same day", () => {
        const m1 = { day: "Senin", start: "07:00", end: "09:30", room: "A" };
        const m2 = { day: "Senin", start: "09:00", end: "11:30", room: "B" };
        const m3 = { day: "Senin", start: "09:30", end: "12:00", room: "C" };
        const m4 = { day: "Selasa", start: "07:00", end: "09:30", room: "A" };

        expect(checkMeetingConflict(m1, m2)).toBe(true);
        expect(checkMeetingConflict(m1, m3)).toBe(false); // Adjacent is not conflicting
        expect(checkMeetingConflict(m1, m4)).toBe(false); // Different day
    });

    it("generates conflict-free schedule variants", () => {
        const courses = [
            {
                subjectId: "course-1",
                name: "Course 1",
                code: "C1",
                sks: 3,
                classes: [
                    {
                        classId: "c1-a",
                        className: "A",
                        meetings: [{ day: "Senin", start: "08:00", end: "10:00", room: "1" }],
                        lecturers: [],
                    },
                    {
                        classId: "c1-b",
                        className: "B",
                        meetings: [{ day: "Selasa", start: "08:00", end: "10:00", room: "1" }],
                        lecturers: [],
                    },
                ],
            },
            {
                subjectId: "course-2",
                name: "Course 2",
                code: "C2",
                sks: 3,
                classes: [
                    {
                        classId: "c2-a",
                        className: "A",
                        meetings: [{ day: "Senin", start: "09:00", end: "11:00", room: "2" }],
                        lecturers: [],
                    },
                    {
                        classId: "c2-b",
                        className: "B",
                        meetings: [{ day: "Rabu", start: "08:00", end: "10:00", room: "2" }],
                        lecturers: [],
                    },
                ],
            },
        ];

        const res = generateRandomValidSchedules(courses as any, [], { target: 1, maxAttempts: 50 }, {
            sectionsConflict: (s1: any, s2: any) => checkClassConflict(s1, s2),
        } as any);

        expect(res.variants.length).toBeGreaterThan(0);
        const variant = res.variants[0];
        // If course-1 picked section A (Senin 8-10), course-2 cannot pick section A (Senin 9-11)
        if (variant.picks["course-1"]?.classId === "c1-a") {
            expect(variant.picks["course-2"]?.classId).toBe("c2-b");
        }
    });
});
