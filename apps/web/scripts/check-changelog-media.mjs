import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const WEB_ROOT = path.resolve(import.meta.dirname, "..");
const CHANGELOG_PATH = path.join(WEB_ROOT, "src", "lib", "changelog.ts");
const PUBLIC_DIR = path.join(WEB_ROOT, "public");

const MAX_VIDEO_BYTES = Math.round(1.5 * 1024 * 1024); // 1.5 MB
const MAX_POSTER_BYTES = 150 * 1024; // 150 KB
const MAX_IMAGE_BYTES = 250 * 1024; // 250 KB

const source = fs.readFileSync(CHANGELOG_PATH, "utf8");
const transpiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
    },
});

const moduleObj = { exports: {} };
vm.runInNewContext(transpiled.outputText, {
    module: moduleObj,
    exports: moduleObj.exports,
});

const entries = moduleObj.exports.CHANGELOG;
if (!Array.isArray(entries) || entries.length === 0) {
    console.error("FAIL: CHANGELOG array is missing or empty.");
    process.exit(1);
}

const errors = [];

function checkNoLongDash(value, label) {
    if (typeof value !== "string") return;
    if (/[\u2013\u2014]/.test(value)) {
        errors.push(`${label}: contains long dash (em/en dash)`);
    }
}

function checkFile(relSrc, maxBytes, label) {
    if (typeof relSrc !== "string" || !relSrc.startsWith("/")) {
        errors.push(`${label}: invalid asset path "${relSrc}"`);
        return;
    }
    const fullPath = path.join(PUBLIC_DIR, relSrc.slice(1));
    if (!fs.existsSync(fullPath)) {
        errors.push(`${label}: missing file ${fullPath}`);
        return;
    }
    const size = fs.statSync(fullPath).size;
    if (size > maxBytes) {
        errors.push(
            `${label}: file too large (${(size / 1024).toFixed(1)} KB > ${(maxBytes / 1024).toFixed(1)} KB)`
        );
    }
}

for (const entry of entries) {
    const prefix = `entry[${entry.version}]`;
    checkNoLongDash(entry.badge?.en, `${prefix}.badge.en`);
    checkNoLongDash(entry.badge?.id, `${prefix}.badge.id`);
    checkNoLongDash(entry.title?.en, `${prefix}.title.en`);
    checkNoLongDash(entry.title?.id, `${prefix}.title.id`);
    checkNoLongDash(entry.summary?.en, `${prefix}.summary.en`);
    checkNoLongDash(entry.summary?.id, `${prefix}.summary.id`);

    if (Array.isArray(entry.highlights)) {
        entry.highlights.forEach((h, i) => {
            checkNoLongDash(h.text?.en, `${prefix}.highlights[${i}].en`);
            checkNoLongDash(h.text?.id, `${prefix}.highlights[${i}].id`);
        });
    }

    if (entry.media) {
        const m = entry.media;
        if (!m.alt?.en?.trim()) errors.push(`${prefix}.media.alt.en: must be non-empty`);
        if (!m.alt?.id?.trim()) errors.push(`${prefix}.media.alt.id: must be non-empty`);
        checkNoLongDash(m.alt?.en, `${prefix}.media.alt.en`);
        checkNoLongDash(m.alt?.id, `${prefix}.media.alt.id`);

        if (m.type === "video") {
            checkFile(m.src, MAX_VIDEO_BYTES, `${prefix}.media.src`);
            if (!m.poster) {
                errors.push(`${prefix}.media.poster: video entries must define a poster`);
            } else {
                checkFile(m.poster, MAX_POSTER_BYTES, `${prefix}.media.poster`);
            }
        } else if (m.type === "image") {
            checkFile(m.src, MAX_IMAGE_BYTES, `${prefix}.media.src`);
        } else {
            errors.push(`${prefix}.media.type: unknown type "${m.type}"`);
        }
    }
}

if (errors.length > 0) {
    console.error("Changelog media validation failed:");
    for (const err of errors) console.error(" -", err);
    process.exit(1);
}

console.log(`Changelog media check passed (${entries.length} entries validated).`);
