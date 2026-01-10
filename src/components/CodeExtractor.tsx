"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeExtractorProps {
    onGenerated: (code: string, description: string, image: string) => void;
    isGenerating: boolean;
    onGenerateStart: () => void;
    framework: string;
}

export function CodeExtractor({ onGenerated, isGenerating, onGenerateStart, framework }: CodeExtractorProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError("File size exceeds 10MB. Please upload a smaller file.");
            return;
        }

        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const maxDim = 1024;

                if (width > height) {
                    if (width > maxDim) {
                        height *= maxDim / width;
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                setPreview(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif"],
        },
        multiple: false,
    });

    const handleGenerate = async () => {
        if (!preview) return;
        onGenerateStart();

        try {
            // Step 1: Analyze the UI Structure
            console.log("Analyzing UI Structure...");
            const analyzeRes = await fetch("/api/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "analyze",
                    image: preview,
                }),
            });
            const analyzeData = await analyzeRes.json();

            if (!analyzeData.success) {
                throw new Error(analyzeData.error || "Analysis failed");
            }

            const uiDescription = analyzeData.description;

            // Step 2: Convert to selected Framework
            console.log(`Converting to ${framework}...`);
            const convertRes = await fetch("/api/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "convert",
                    image: preview,
                    framework: framework,
                    uiDescription: uiDescription
                }),
            });
            const convertData = await convertRes.json();

            if (convertData.success && convertData.code) {
                onGenerated(convertData.code, uiDescription, preview);
            } else {
                setError(convertData.error || "Failed to generate UI.");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            // Done handled in parent state
        }
    };

    const clear = () => {
        setPreview(null);
        setError(null);
    };

    return (
        <div className="w-full space-y-4">
            {!preview ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-card/30",
                        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="p-4 rounded-full bg-secondary">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold">Drop your sketch here</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG, GIF (Max 10MB)</p>
                    </div>
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-border group">
                    <img src={preview} alt="Sketch Preview" className="w-full max-h-96 object-contain bg-black/20" />
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={clear}
                            className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-6 py-3 bg-primary text-white rounded-lg font-bold flex items-center gap-2 transform active:scale-95 transition-all shadow-xl"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating UI...
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-5 h-5" />
                                    Generate UI
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}
        </div>
    );
}
