import { parseBimaMasterWithDebug } from "../src/index";

const problematicData = `Teknik Kimia.	021250372	Praktikum Simulasi Komputer	DTK-B	2	0	Senin 00:00-00:00		
Teknik Kimia.	021250372	Praktikum Simulasi Komputer	DTK-A	2	0	Senin 00:00-00:00		
Teknik Kimia.	021250342	Perpindahan Kalor	DTK-A	2	0	Senin 07:00-08:45	R.II-1	
Dr. Retno Ringgani ST., M.Eng

Teknik Kimia.	021250092	Operasi Teknik Kimia 1	DTK-B	2	0	Senin 07:00-08:45	R.II-2	
Susanti Rina Nugraheni ST,M.Eng`;

console.log("Testing Problematic Data (Teknik Kimia)...");
const result = parseBimaMasterWithDebug(problematicData);
console.log("Debug Result:", JSON.stringify(result.debug, null, 2));

result.subjects.forEach(s => {
    console.log(`Subject: ${s.name} (${s.code}), SKS: ${s.sks}`);
    s.classes.forEach(c => {
        console.log(`  Class: ${c.className}, Lecturers: ${c.lecturers.join(", ")}`);
    });
});
