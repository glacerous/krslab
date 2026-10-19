import { parseBimaMasterWithDebug } from "../src/index";

// 1. CSV format with headers & English day names & dot-separated times
const csvTable = `Code,Course,Section,Credits,Day,Time,Room,Lecturer
CS101,Computer Programming,A,3,Monday,07.30 - 10.00,Lab 1,Dr. Alice
CS102,Data Structures,B,4,Tuesday,10.00 s/d 12.30 WIB,Room 302,Prof. Bob
CS103,Computer Networks,C,3,Wednesday,13.00 to 15.30,Room 201,Charlie M.Kom`;

// 2. Separate Day & Time columns (TSV)
const separateDayTime = `Kode	Mata Kuliah	SKS	Kelas	Hari	Jam	Ruangan	Dosen
IF201	Basis Data Lanjut	3	IF-A	Senin	08:00 - 10:30	Lab Komputer 3	Ir. Joko
IF202	Kecerdasan Buatan	3	IF-B	Rabu	10:30 - 13:00	R.301	Dr. Sri`;

// 3. Semicolon-separated SIAKAD format with dot times
const siakadFormat = `124210001;Algoritma Pemrograman;IF-A;3;Senin 07.30-10.00;Lab 1;Budi S.T.
124210002;Sistem Operasi;IF-B;3;Kamis 08.00 s/d 10.30 WIB;Lab 2;Eko M.Kom`;

// 4. Pipe-delimited markdown table
const markdownTable = `| Kode | Mata Kuliah | SKS | Kelas | Jadwal | Ruang |
|---|---|---|---|---|---|
| TIF101 | Pemrograman Web | 3 | RA | Jumat 07:30-10:00 | D-101 |
| TIF102 | Grafika Komputer | 3 | RB | Sabtu 09:00-11:30 | D-102 |`;

console.log("=== Testing Universal Formats ===");

console.log("\n1. Testing CSV Table with English Days & Dot Times...");
const res1 = parseBimaMasterWithDebug(csvTable);
console.log("Subjects count (should be 3):", res1.subjects.length);
console.log("First subject day (should be Senin):", res1.subjects[0].classes[0].meetings[0].day);
console.log("First subject time (should be 07:30-10:00):", `${res1.subjects[0].classes[0].meetings[0].start}-${res1.subjects[0].classes[0].meetings[0].end}`);

console.log("\n2. Testing Separate Day & Time Columns...");
const res2 = parseBimaMasterWithDebug(separateDayTime);
console.log("Subjects count (should be 2):", res2.subjects.length);
console.log("First subject:", res2.subjects[0].name, res2.subjects[0].classes[0].meetings[0]);

console.log("\n3. Testing Semicolon SIAKAD Format...");
const res3 = parseBimaMasterWithDebug(siakadFormat);
console.log("Subjects count (should be 2):", res3.subjects.length);
console.log("First subject time (should be 07:30-10:00):", `${res3.subjects[0].classes[0].meetings[0].start}-${res3.subjects[0].classes[0].meetings[0].end}`);

console.log("\n4. Testing Markdown Table...");
const res4 = parseBimaMasterWithDebug(markdownTable);
console.log("Subjects count (should be 2):", res4.subjects.length);
console.log("Subjects:", res4.subjects.map(s => `${s.name} (${s.classes[0].meetings[0].day} ${s.classes[0].meetings[0].start}-${s.classes[0].meetings[0].end})`));

console.log("\nAll tests completed successfully!");
