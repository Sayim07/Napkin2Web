"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, Send, Loader2, Monitor, Code2, Layout, Layers } from "lucide-react";
import { CodeExtractor } from "@/components/CodeExtractor";
import { LivePreview } from "@/components/LivePreview";
import { VoiceInput } from "@/components/VoiceInput";
import { cn } from "@/lib/utils";

type Framework = "static" | "react" | "nextjs";

export default function Home() {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null); // Always static HTML for visual preview
  const [uiDescription, setUiDescription] = useState<string | null>(null);
  const [framework, setFramework] = useState<Framework>("static");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [textCommand, setTextCommand] = useState("");
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const fetchPreviewCode = async (description: string, image: string | null) => {
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "convert",
          framework: "static",
          uiDescription: description,
          image: image
        }),
      });
      const result = await response.json();
      if (result.success && result.code) {
        setPreviewCode(result.code);
      }
    } catch (error) {
      console.error("Preview Generation Error:", error);
    }
  };

  const handleGenerated = (code: string, description: string, image: string) => {
    setGeneratedCode(code);
    setUiDescription(description);
    setCurrentImage(image);
    setIsGenerating(false);

    // If first generation is static, use it for preview too
    if (framework === "static") {
      setPreviewCode(code);
    } else {
      fetchPreviewCode(description, image);
    }
  };

  const handleFrameworkChange = async (newFramework: Framework) => {
    if (newFramework === framework) return;
    setFramework(newFramework);

    if (uiDescription) {
      setIsEditing(true);
      try {
        const response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "convert",
            framework: newFramework,
            uiDescription: uiDescription,
            image: currentImage
          }),
        });
        const result = await response.json();
        if (result.success && result.code) {
          setGeneratedCode(result.code);
        }
      } catch (error) {
        console.error("Framework Switch Error:", error);
      } finally {
        setIsEditing(false);
      }
    }
  };

  const handleEdit = async (instruction: string) => {
    if (!generatedCode || !instruction.trim()) return;

    setIsEditing(true);
    try {
      // Step 1: Update the framework-specific code
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "edit",
          currentCode: generatedCode,
          instruction: instruction,
          framework: framework
        }),
      });
      const result = await response.json();

      if (result.success && result.code) {
        setGeneratedCode(result.code);

        // Step 2: Update the visual preview (Static HTML) in sync
        if (framework === "static") {
          setPreviewCode(result.code);
        } else {
          // We need to update the static preview to reflect the edit
          // We can use the uiDescription or the new code to generate a new static preview
          // Using the image + instruction might be best, but for now we'll update the static preview
          // by asking Gemini to reflect the instruction on the previous static code too.
          // Or simpler: generate a new static version based on the new description if we had one.
          // For now, let's just trigger a preview refresh based on the instruction.
          if (uiDescription) {
            fetchPreviewCode(uiDescription + "\n\nLatest Update: " + instruction, currentImage);
          }
        }
      } else {
        console.error("Edit Error:", result.error);
      }
    } catch (error) {
      console.error("Edit request failed:", error);
    } finally {
      setIsEditing(false);
      setTextCommand("");
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    handleEdit(transcript);
  };

  const handleTextCommand = (e: React.FormEvent) => {
    e.preventDefault();
    handleEdit(textCommand);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Napkin<span className="gradient-text">2Web</span>
            </h1>
          </div>

          {generatedCode && (
            <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
              {[
                { id: "static", label: "Static", icon: Layout },
                { id: "react", label: "React", icon: Code2 },
                { id: "nextjs", label: "Next.js", icon: Layers }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleFrameworkChange(item.id as Framework)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                    framework === item.id
                      ? "bg-primary text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="px-3 py-1 bg-secondary rounded-full border border-border flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Super-Human Utility
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-80px)] overflow-hidden">
        {/* Left Column: Input */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-6 scrollbar-hide">
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Start with a Sketch</h2>
              <p className="text-muted-foreground text-sm">Upload your hand-drawn UI idea and watch it come to life.</p>
            </div>
            <CodeExtractor
              onGenerated={handleGenerated}
              isGenerating={isGenerating}
              onGenerateStart={() => setIsGenerating(true)}
              framework={framework}
            />
          </section>

          {generatedCode && (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Refine with Voice</h2>
                <p className="text-muted-foreground text-sm">Tell the AI what to change, or use text commands below.</p>
              </div>

              <VoiceInput onTranscript={handleVoiceTranscript} isProcessing={isEditing} />

              <form onSubmit={handleTextCommand} className="relative group">
                <input
                  type="text"
                  placeholder="Change button color to blue..."
                  value={textCommand}
                  onChange={(e) => setTextCommand(e.target.value)}
                  disabled={isEditing}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-4 pr-12 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={isEditing || !textCommand.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors"
                >
                  {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </section>
          )}

          {!generatedCode && !isGenerating && (
            <div className="mt-8 p-6 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3">
              <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">Waiting for your first sketch...</p>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="h-full relative overflow-hidden flex flex-col">
          {generatedCode ? (
            <LivePreview
              code={generatedCode}
              previewCode={previewCode}
              framework={framework}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-card/30 rounded-xl border border-border border-dashed p-12 text-center gap-4">
              <div className="p-4 bg-secondary rounded-full">
                <Monitor className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Live Preview</h3>
                <p className="text-muted-foreground max-w-xs">Once you upload a sketch, your functional HTML/Tailwind CSS will appear here.</p>
              </div>
            </div>
          )}

          {(isEditing || isGenerating) && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center z-50 animate-in fade-in duration-300">
              <div className="bg-card p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 border border-border max-w-sm text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{isGenerating ? "Analyzing Sketch..." : "Refining Code..."}</h3>
                  <p className="text-muted-foreground text-sm">Building your production-ready UI with modern web standards.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
