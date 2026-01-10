"use client";

import React, { useState } from "react";
import { Code2, Monitor, Copy, Check, Maximize, Minimize, Smartphone, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import { STATIC_PROJECT, REACT_PROJECT, NEXTJS_PROJECT } from "@/lib/templates";

interface LivePreviewProps {
    code: string; // The code for the chosen framework
    previewCode: string | null; // The static HTML for visual preview
    framework: string;
}

type Device = "desktop" | "android" | "iphone";

export function LivePreview({ code, previewCode, framework }: LivePreviewProps) {
    const [view, setView] = useState<"preview" | "code">("preview");
    const [device, setDevice] = useState<Device>("desktop");
    const [copied, setCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Use current framework code if previewCode is not available, or fallback to code
    const displayPreview = previewCode || code;

    const downloadProject = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            let files: Record<string, string> = {};

            if (framework === "react") {
                files = REACT_PROJECT(code);
            } else if (framework === "nextjs") {
                files = NEXTJS_PROJECT(code);
            } else {
                files = STATIC_PROJECT(code);
            }

            Object.entries(files).forEach(([path, content]) => {
                zip.file(path, content);
            });

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `napkin2web-${framework}-project.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download Error:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getProcessedCode = () => {
        if (!displayPreview) return "";

        // If it's a full document, use regex to get body content for embedding
        if (displayPreview.includes("<body")) {
            const bodyMatch = displayPreview.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (bodyMatch) return bodyMatch[1];
        }

        // If it has <html> but no body (rare but possible), just strip html tags
        let processed = displayPreview.replace(/<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>/gi, "").trim();

        // Remove DOCTYPE if it exists
        processed = processed.replace(/<!DOCTYPE html>/gi, "").trim();

        return processed;
    };

    const fullCode = React.useMemo(() => `
    <!DOCTYPE html>
    <html class="h-full">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            min-height: 100vh; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            background-color: #020617; 
            color: white; 
          }
          /* Custom scrollbar for preview */
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #0f172a; }
          ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #475569; }
        </style>
      </head>
      <body>
        <div class="w-full flex justify-center items-center py-12 px-4">
          ${getProcessedCode()}
        </div>
        <script>
          lucide.createIcons();
        </script>
      </body>
    </html>
  `, [displayPreview]);

    return (
        <div ref={containerRef} className={cn("flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card", isFullscreen && "rounded-none")}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setView("preview")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            view === "preview" ? "bg-primary text-white shadow-sm" : "hover:bg-secondary text-muted-foreground"
                        )}
                    >
                        <Monitor className="w-4 h-4" />
                        Preview
                    </button>
                    <button
                        onClick={() => setView("code")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            view === "code" ? "bg-primary text-white shadow-sm" : "hover:bg-secondary text-muted-foreground"
                        )}
                    >
                        <Code2 className="w-4 h-4" />
                        Code
                    </button>
                </div>

                {view === "preview" && (
                    <div className="hidden md:flex items-center gap-1 bg-background/50 p-1 rounded-lg border border-border">
                        <button
                            onClick={() => setDevice("desktop")}
                            className={cn(
                                "flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                                device === "desktop" ? "bg-primary text-white shadow-sm" : "hover:bg-secondary text-muted-foreground"
                            )}
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            Desktop
                        </button>
                        <button
                            onClick={() => setDevice("android")}
                            className={cn(
                                "flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                                device === "android" ? "bg-primary text-white shadow-sm" : "hover:bg-secondary text-muted-foreground"
                            )}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            Android
                        </button>
                        <button
                            onClick={() => setDevice("iphone")}
                            className={cn(
                                "flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                                device === "iphone" ? "bg-primary text-white shadow-sm" : "hover:bg-secondary text-muted-foreground"
                            )}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            iPhone
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadProject}
                        disabled={isDownloading}
                        className="p-2 hover:bg-secondary rounded-md text-muted-foreground transition-all"
                        title="Download Project"
                    >
                        <Download className={cn("w-4 h-4", isDownloading && "animate-bounce")} />
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-secondary rounded-md text-muted-foreground transition-all"
                        title="Copy Code"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-secondary rounded-md text-muted-foreground transition-all"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 relative bg-slate-50/50 overflow-auto p-4 md:p-8 flex justify-center items-start transition-all duration-300">
                {view === "preview" ? (
                    <div
                        className="transition-all duration-500 ease-in-out shadow-2xl rounded-xl overflow-hidden border border-border bg-white origin-top"
                        style={{
                            width: device === 'desktop' ? '100%' : device === 'android' ? '360px' : '390px',
                            height: device === 'desktop' ? '700px' : device === 'android' ? '640px' : '844px',
                        }}
                    >
                        <iframe
                            srcDoc={fullCode}
                            className="w-full h-full border-none"
                            title="Live UI Preview"
                            sandbox="allow-scripts"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full overflow-auto bg-[#1e1e1e] p-6 rounded-lg">
                        <pre className="text-sm text-blue-300 font-mono">
                            <code>{code}</code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
