"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
    onTranscript: (transcript: string) => void;
    isProcessing: boolean;
}

export function VoiceInput({ onTranscript, isProcessing }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);

                // Reset timeout on every speech event
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    if (currentTranscript.trim()) {
                        handleFinalize(currentTranscript);
                    }
                }, 3000); // 3 seconds of silence to auto-submit
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Error:", event.error);
                if (event.error === "no-speech") {
                    setError("Didn't catch that — try again or type your command.");
                } else {
                    setError("Voice input is currently unavailable — please use text commands.");
                }
                stopListening();
            };
        } else {
            setError("Voice recognition not supported in this browser.");
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const startListening = () => {
        setError(null);
        setTranscript("");
        setIsListening(true);
        recognitionRef.current?.start();

        // 6 second initial timeout if nothing heard
        timeoutRef.current = setTimeout(() => {
            if (!transcript) {
                setError("Didn't catch that — try again or type your command.");
                stopListening();
            }
        }, 6000);
    };

    const stopListening = () => {
        setIsListening(false);
        recognitionRef.current?.stop();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleFinalize = (finalTranscript: string) => {
        stopListening();
        if (finalTranscript.trim()) {
            onTranscript(finalTranscript);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            handleFinalize(transcript);
        } else {
            startListening();
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full max-w-md">
            <div className="flex items-center gap-6 p-4 rounded-2xl bg-secondary/30 border border-border/50 relative overflow-hidden group transition-all hover:bg-secondary/40">
                {isListening && (
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                )}

                <button
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={cn(
                        "relative z-10 p-5 rounded-full transition-all duration-500 transform active:scale-90 shadow-xl",
                        isListening
                            ? "bg-red-500 scale-110 rotate-12"
                            : "bg-primary hover:shadow-primary/20",
                        isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                    ) : isListening ? (
                        <MicOff className="w-8 h-8 text-white" />
                    ) : (
                        <Mic className="w-8 h-8 text-white" />
                    )}

                    {isListening && (
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                    )}
                </button>

                <div className="flex-1 relative z-10">
                    <div className="flex items-end gap-1 mb-2 h-4">
                        {isListening ? (
                            [1, 2, 3, 4, 5, 4, 3, 2, 1].map((i, idx) => (
                                <div
                                    key={idx}
                                    className="w-1 bg-primary rounded-full animate-bounce"
                                    style={{
                                        height: `${Math.random() * 100 + 40}%`,
                                        animationDelay: `${idx * 0.1}s`,
                                        animationDuration: '0.6s'
                                    }}
                                />
                            ))
                        ) : (
                            <div className="text-xs font-bold uppercase tracking-widest text-primary/70">Voice Control</div>
                        )}
                    </div>

                    <p className="text-sm font-semibold text-foreground/80">
                        {isListening ? "I'm listening..." : isProcessing ? "Processing command..." : "Tap to speak a command"}
                    </p>

                    {transcript && (
                        <p className="text-sm text-primary font-medium italic line-clamp-1 mt-1 animate-in fade-in slide-in-from-left-2">
                            "{transcript}"
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-400 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}
