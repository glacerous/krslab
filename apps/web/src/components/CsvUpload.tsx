"use client";

import React, { useCallback } from "react";
import { useKrsStore } from "@/lib/store";
import { parseBimaCsv } from "@krs/engine";

export function CsvUpload() {
    const setAllSubjects = useKrsStore((state) => state.setAllSubjects);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                const subjects = parseBimaCsv(content);
                setAllSubjects(subjects);
            };
            reader.readAsText(file);
        },
        [setAllSubjects]
    );

    return (
        <div className="flex flex-col gap-4 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-semibold">Upload Jadwal BIMA</h2>
            <p className="text-sm text-zinc-500">Upload file CSV hasil export BIMA untuk memulai perencanaan.</p>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          dark:file:bg-zinc-800 dark:file:text-zinc-200"
            />
        </div>
    );
}
