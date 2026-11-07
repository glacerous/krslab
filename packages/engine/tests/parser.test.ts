import { describe, it, expect } from "vitest";
import { parseBimaMasterWithDebug } from "../src/index";
import fs from "fs";
import path from "path";

describe("Schedule Parser", () => {
    it("parses valid sample-bima.csv correctly", () => {
        const csvPath = path.resolve(__dirname, "../../../apps/web/public/sample-bima.csv");
        const raw = fs.readFileSync(csvPath, "utf-8");
        const res = parseBimaMasterWithDebug(raw);

        expect(res.subjects.length).toBeGreaterThan(0);
        const if101 = res.subjects.find((s) => s.code === "IF101");
        expect(if101).toBeDefined();
        expect(if101?.classes.length).toBe(2);
        expect(if101?.classes[0].meetings[0].day).toBe("Senin");
        expect(if101?.classes[0].meetings[0].start).toBe("07:00");
        expect(if101?.classes[0].meetings[0].end).toBe("10:00");
    });

    describe("Malformed Variants (Must not crash)", () => {
        it("Variant 1: handles empty or whitespace-only input gracefully", () => {
            const res = parseBimaMasterWithDebug("   \n\n\t  \n  ");
            expect(res.subjects).toEqual([]);
            expect(res.debug).toBeDefined();
        });

        it("Variant 2: handles missing time and invalid day names", () => {
            const malformed = `Kode\tMata Kuliah\tSKS\tKelas\tJadwal\tRuang
IF101\tDasar Pemrograman\t3\tA\tFunday 99:99-99:99\tR101
IF102\tStruktur Data\t3\tB\tNotADay\tR102`;
            const res = parseBimaMasterWithDebug(malformed);
            expect(Array.isArray(res.subjects)).toBe(true);
        });

        it("Variant 3: handles broken delimiters, mismatched quotes, and junk symbols", () => {
            const malformed = `"""Program Studi,,,,,,
"Broken,,,;;;||||###
123"456"789;;"Unclosed quote;Senin;08:00
,,,,,;;;;;;;;,,,,`;
            const res = parseBimaMasterWithDebug(malformed);
            expect(Array.isArray(res.subjects)).toBe(true);
        });

        it("Variant 4: handles dummy zero schedules and extreme values", () => {
            const malformed = `Teknik Kimia.\t021250372\tPraktikum Simulasi Komputer\tDTK-B\t2\t0\tSenin 00:00-00:00\t\t
Teknik Kimia.\t021250342\tPerpindahan Kalor\tDTK-A\t-5\t9999\tKamis 23:59-24:00\tR.II-1`;
            const res = parseBimaMasterWithDebug(malformed);
            expect(Array.isArray(res.subjects)).toBe(true);
            expect(res.subjects.length).toBeGreaterThan(0);
        });

        it("Variant 5: handles headers-only table with no data rows", () => {
            const malformed = `Program Studi,Kode,Mata Kuliah,SKS,Kelas,Peserta,Jadwal,Ruang\n`;
            const res = parseBimaMasterWithDebug(malformed);
            expect(res.subjects).toEqual([]);
        });
    });
});
