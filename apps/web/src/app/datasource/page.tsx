"use client";

import { useState, useMemo } from "react";
import { useAppStore, Subject } from "@/lib/store";
import { parseBimaMasterText } from "@krs/engine";
import { Database, FileCode, Clipboard, Trash2, ChevronDown, ChevronUp, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DatasourcePage() {
    const { datasources, addDatasource, deleteDatasource } = useAppStore();
    const [name, setName] = useState("");
    const [rawText, setRawText] = useState("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [parsedData, setParsedData] = useState<Subject[]>([]);

    const summary = useMemo(() => {
        if (parsedData.length === 0) return null;
        const subjects = parsedData.length;
        const classes = parsedData.reduce((acc, s) => acc + s.classes.length, 0);
        const sks = parsedData.reduce((acc, s) => acc + s.sks, 0);
        return { subjects, classes, sks };
    }, [parsedData]);

    const handleParse = () => {
        try {
            if (!rawText.trim()) {
                toast.error("Process Failed", { description: "Input buffer is empty." });
                return;
            }
            const subjects = parseBimaMasterText(rawText);
            if (subjects.length === 0) {
                toast.error("Format Error", { description: "Unrecognized data structure." });
                return;
            }
            setParsedData(subjects);
            toast.success("Sync Successful", { description: `${subjects.length} subjects extracted.` });
        } catch (error) {
            toast.error("System Exception", { description: "The engine failed to process the input." });
        }
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Missing Input", { description: "Please enter a name for this dataset." });
            return;
        }
        addDatasource(name, parsedData);
        toast.success("Dataset Deployed", { description: `"${name}" added to library.` });
        setRawText("");
        setName("");
        setParsedData([]);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setRawText(text);
            toast.info("Imported from Clipboard");
        } catch (err) {
            toast.error("Action Denied", { description: "Clipboard access is restricted." });
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="space-y-1 pb-6 border-b border-border/50">
                <h1 className="text-2xl font-black tracking-tight text-foreground">Datasources</h1>
                <p className="text-sm text-muted-foreground font-medium">Import academic data from BIMA infrastructure.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Master Input Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 transition-colors">
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Datasource Identity (e.g. 2024 Semester 1)"
                                className="flex-1 bg-muted/30 border border-border px-4 py-2.5 rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary focus:bg-background outline-none transition-soft placeholder:text-muted-foreground/30"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <button
                                onClick={handlePaste}
                                className="px-4 py-2.5 bg-muted text-muted-foreground hover:bg-muted-foreground/10 h-10 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-soft border border-border flex items-center justify-center gap-2 shrink-0"
                            >
                                <Clipboard className="w-3.5 h-3.5" /> Paste
                            </button>
                        </div>

                        <div className="relative">
                            <textarea
                                placeholder="Paste raw system logs here..."
                                className="w-full h-80 p-5 bg-muted/20 text-foreground font-mono text-[12px] outline-none resize-none rounded-lg border border-border focus:bg-background focus:ring-1 focus:ring-primary transition-soft placeholder:text-muted-foreground/30 no-scrollbar"
                                value={rawText}
                                onChange={(e) => {
                                    setRawText(e.target.value);
                                    if (parsedData.length > 0) setParsedData([]);
                                }}
                            />
                            {rawText && (
                                <button
                                    onClick={() => setRawText("")}
                                    className="absolute bottom-4 right-4 text-[10px] font-bold text-muted-foreground/40 hover:text-destructive transition-soft uppercase tracking-widest"
                                >
                                    Purge
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <div className="flex gap-2.5 items-center">
                                {summary ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                                        <Zap className="w-3 h-3" /> {summary.subjects} Subjects
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic ml-2">Standby</span>
                                )}
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={handleParse}
                                    disabled={!rawText.trim()}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-muted text-muted-foreground font-bold rounded-lg text-[11px] uppercase tracking-widest transition-soft disabled:opacity-30 hover:bg-muted-foreground/10 border border-border"
                                >
                                    Sync
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={parsedData.length === 0 || !name.trim()}
                                    className="flex-1 sm:flex-none px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-[11px] uppercase tracking-widest transition-soft disabled:opacity-30 hover:scale-[1.02] active:scale-95 shadow-sm"
                                >
                                    Deploy
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Accordion */}
                    {parsedData.length > 0 && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-colors">
                            <button
                                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                                className="w-full p-5 flex justify-between items-center hover:bg-muted/30 transition-soft active:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileCode className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-[13px] font-bold text-foreground">Extracted Schema</h3>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Verify before library inclusion.</p>
                                    </div>
                                </div>
                                {isPreviewOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </button>

                            {isPreviewOpen && (
                                <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 no-scrollbar border-t border-border/50 pt-5">
                                        {parsedData.map(subject => (
                                            <div key={subject.subjectId} className="p-3 rounded-lg border border-border/50 bg-muted/10">
                                                <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest block mb-0.5">{subject.code}</span>
                                                <h4 className="text-[11px] font-bold text-foreground truncate">{subject.name}</h4>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Library Sidebar */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <Database className="w-3.5 h-3.5 text-muted-foreground" />
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Library ({datasources.length})</h3>
                    </div>

                    <div className="space-y-3">
                        {datasources.length === 0 ? (
                            <div className="py-12 bg-muted/10 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-6">
                                <Sparkles className="w-5 h-5 mb-3 text-muted-foreground/30" />
                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-relaxed">No data sources deployed.</span>
                            </div>
                        ) : (
                            datasources.map(ds => (
                                <div key={ds.id} className="group bg-card p-5 rounded-xl border border-border realistic-shadow transition-soft hover:border-primary/20 flex justify-between items-center pr-3">
                                    <div className="min-w-0 pr-4">
                                        <h4 className="font-bold text-[13px] text-foreground truncate">{ds.name}</h4>
                                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{ds.subjects.length} Subjects</p>
                                    </div>
                                    <button
                                        onClick={() => deleteDatasource(ds.id)}
                                        className="p-1.5 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 rounded-md transition-soft md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
