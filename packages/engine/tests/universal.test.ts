import { describe, it, expect } from "vitest";
import { parseBimaMasterWithDebug } from "../src/index";

describe("Universal Format Parser", () => {
    it("parses CSV with English day names and dot times", () => {
        const csvTable = `Code,Course,Section,Credits,Day,Time,Room,Lecturer
CS101,Computer Programming,A,3,Monday,07.30 - 10.00,Lab 1,Dr. Alice
CS102,Data Structures,B,4,Tuesday,10.00 s/d 12.30 WIB,Room 302,Prof. Bob
CS103,Computer Networks,C,3,Wednesday,13.00 to 15.30,Room 201,Charlie M.Kom`;

        const res = parseBimaMasterWithDebug(csvTable);
        expect(res.subjects.length).toBe(3);
        expect(res.subjects[0].classes[0].meetings[0].day).toBe("Senin");
        expect(res.subjects[0].classes[0].meetings[0].start).toBe("07:30");
        expect(res.subjects[0].classes[0].meetings[0].end).toBe("10:00");
    });

    it("parses TSV with separate Day & Time columns", () => {
        const separateDayTime = `Kode\tMata Kuliah\tSKS\tKelas\tHari\tJam\tRuangan\tDosen
IF201\tBasis Data Lanjut\t3\tIF-A\tSenin\t08:00 - 10:30\tLab Komputer 3\tIr. Joko
IF202\tKecerdasan Buatan\t3\tIF-B\tRabu\t10:30 - 13:00\tR.301\tDr. Sri`;

        const res = parseBimaMasterWithDebug(separateDayTime);
        expect(res.subjects.length).toBe(2);
        expect(res.subjects[0].classes[0].meetings[0].day).toBe("Senin");
        expect(res.subjects[0].classes[0].meetings[0].start).toBe("08:00");
    });

    it("parses SIAKAD semicolon format with dot times", () => {
        const siakadFormat = `124210001;Algoritma Pemrograman;IF-A;3;Senin 07.30-10.00;Lab 1;Budi S.T.
124210002;Sistem Operasi;IF-B;3;Kamis 08.00 s/d 10.30 WIB;Lab 2;Eko M.Kom`;

        const res = parseBimaMasterWithDebug(siakadFormat);
        expect(res.subjects.length).toBe(2);
        expect(res.subjects[0].classes[0].meetings[0].start).toBe("07:30");
        expect(res.subjects[0].classes[0].meetings[0].end).toBe("10:00");
    });

    it("parses Markdown tables", () => {
        const markdownTable = `| Kode | Mata Kuliah | SKS | Kelas | Jadwal | Ruang |
|---|---|---|---|---|---|
| TIF101 | Pemrograman Web | 3 | RA | Jumat 07:30-10:00 | D-101 |
| TIF102 | Grafika Komputer | 3 | RB | Sabtu 09:00-11:30 | D-102 |`;

        const res = parseBimaMasterWithDebug(markdownTable);
        expect(res.subjects.length).toBe(2);
        expect(res.subjects[0].classes[0].meetings[0].day).toBe("Jumat");
    });
});
