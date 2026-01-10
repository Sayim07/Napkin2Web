import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_BASE = `
You are a world-class award-winning frontend developer and UI/UX designer. Your task is to convert a UI description or a sketch into a stunning, production-ready implementation.

Aesthetic Guidelines (The "Super-Human Utility" Theme):
- Colors: Deep midnight blues, sleek blacks, and vibrant accent colors (e.g., Electric Purple #8B5CF6, Cyan #06B6D4). Avoid flat white backgrounds.
- Backgrounds: Use subtle mesh gradients or dark radial backgrounds.
- Components: Use glassmorphism (backdrop-blur, subtle borders, thin white shadows).
- Typography: Use bold, clear headings and high-quality sans-serif fonts (like Inter).
- Interactive Elements: Add hover animations to buttons and inputs using Tailwind transition/transform classes.
- Spacing: Generous padding and logical grouping of elements.
`;

const PROMPT_STATIC = `
Convert this UI into clean, single-file HTML and Tailwind CSS.
Requirements:
- Use semantic HTML.
- Use Tailwind CSS via CDN.
- Use Lucide Icons (via CDN).
- Use Google Fonts (Inter).
- Return ONLY the complete HTML code starting with <!DOCTYPE html>.
`;

const PROMPT_REACT = `
Convert this UI into a modern React functional component using Tailwind CSS.
Requirements:
- Use Lucide React for icons.
- Use Tailwind CSS for all styling.
- Assume Tailwind is configured.
- Include all necessary imports at the top.
- Return ONLY the React component code. Do not include markdown blocks.
- The component should be a single file named 'App.tsx' or similar.
`;

const PROMPT_NEXTJS = `
Convert this UI into a Next.js 14+ Page (App Router) using Tailwind CSS.
Requirements:
- Use 'use client' if interactivity is needed.
- Use Lucide React for icons.
- Use Tailwind CSS for styling.
- Follow Next.js best practices.
- No backend or API routes.
- Return ONLY the page file code (page.tsx). Do not include markdown blocks.
`;

const SYSTEM_PROMPT_EDITOR = `
You are an expert full-stack frontend engineer. You are part of the "Universal AI Editing Engine" for Napkin2Web.
Your mission is to modify the existing UI code based on natural language instructions.

Core Directives:
1. Universal Capability: You can Edit, Delete, Move, Restyle, Resize, Re-layout, Recolor, or Rebuild any part of the UI.
2. Context Awareness: Respect the current framework (Static, React, or Next.js) and maintain his styling (Tailwind CSS).
3. Stateful Persistence: Build on the previous code. Do not reset the layout unless explicitly asked to "rebuild" or "start over".
4. Precision Styling: Use Tailwind CSS for all modifications. If asked for animations, use Tailwind's transition classes or popular libraries if appropriate for the framework.
5. Content Quality: If asked to "add a feature" or "make it look like X", implement high-quality, professional UI components that match the "Super-Human Utility" aesthetic.

Instructions:
- Return ONLY the updated, complete code.
- No markdown code blocks (e.g., no \`\`\`html or \`\`\`tsx).
- No explanations or chatty text.
- Ensure the code remains functional and responsive.
- If deleting an element, ensure its parent layout remains stable.
`;

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelsToTry = [
            "gemini-2.0-flash-exp",
            "gemini-flash-latest",
            "gemini-2.0-flash"
        ];

        const body = await req.json();
        const { image, type, currentCode, instruction, framework = "static", uiDescription } = body;

        let systemPrompt = SYSTEM_PROMPT_BASE;
        if (framework === "react") systemPrompt += PROMPT_REACT;
        else if (framework === "nextjs") systemPrompt += PROMPT_NEXTJS;
        else systemPrompt += PROMPT_STATIC;

        console.log(`Starting ${type} request for framework: ${framework}...`);

        let lastError = null;
        for (const modelName of modelsToTry) {
            try {
                const currentModel = genAI.getGenerativeModel({ model: modelName });

                // Classification Step
                if ((type === "analyze" || type === "convert") && image) {
                    let imageData = image.split(",")[1] || image;
                    let mimeType = "image/png";
                    if (image.startsWith("data:")) {
                        const match = image.match(/data:([^;]+);/);
                        if (match) mimeType = match[1];
                    }

                    const classificationPrompt = "You are an image classifier. Your task is to decide if this image is a hand-drawn UI or wireframe sketch of a software interface. A valid UI sketch contains layouts, boxes, buttons, input fields, text labels, screens, navigation, or app layouts. It should look like a rough website or app design drawn on paper, whiteboard, or tablet. Respond ONLY with one of these two values: UI_SKETCH or NOT_UI_SKETCH.";

                    const classificationResult = await currentModel.generateContent([
                        { inlineData: { data: imageData, mimeType } },
                        { text: classificationPrompt }
                    ]);
                    const classificationResponse = classificationResult.response.text().trim();

                    if (classificationResponse.includes("NOT_UI_SKETCH")) {
                        return NextResponse.json({
                            success: false,
                            error: "This is not a UI sketch. Please upload a hand-drawn interface."
                        }, { status: 400 });
                    }
                }

                if (type === "analyze") {
                    if (!image) return NextResponse.json({ error: "Image required" }, { status: 400 });

                    let imageData = image.split(",")[1] || image;
                    let mimeType = "image/png";
                    if (image.startsWith("data:")) {
                        const match = image.match(/data:([^;]+);/);
                        if (match) mimeType = match[1];
                    }

                    const result = await currentModel.generateContent([
                        { inlineData: { data: imageData, mimeType } },
                        { text: "Analyze this UI sketch in detail. List all sections, components, colors, spacing, and layout logic. Provide a comprehensive UI blueprint description in plain text." }
                    ]);
                    const text = result.response.text();
                    return NextResponse.json({ success: true, description: text });

                } else if (type === "convert") {
                    const promptText = uiDescription ?
                        `Use this UI Blueprint to generate code:\n${uiDescription}\n\n${systemPrompt}` :
                        `Generate code from this sketch:\n\n${systemPrompt}`;

                    const content: any[] = [{ text: promptText }];
                    if (image) {
                        let imageData = image.split(",")[1] || image;
                        let mimeType = "image/png";
                        if (image.startsWith("data:")) {
                            const match = image.match(/data:([^;]+);/);
                            if (match) mimeType = match[1];
                        }
                        content.unshift({ inlineData: { data: imageData, mimeType } });
                    }

                    const result = await currentModel.generateContent(content);
                    let text = result.response.text();

                    // Cleanup markdown
                    text = text.replace(/```(html|typescript|tsx|javascript|jsx|nextjs)?/gi, "").replace(/```/g, "").trim();

                    return NextResponse.json({ success: true, code: text });

                } else if (type === "edit") {
                    const prompt = `
Current Framework: ${framework}
Current Code:
${currentCode}

User Instruction:
${instruction}

${SYSTEM_PROMPT_EDITOR}
`;
                    const result = await currentModel.generateContent(prompt);
                    let text = result.response.text();
                    text = text.replace(/```(html|typescript|tsx|javascript|jsx|nextjs)?/gi, "").replace(/```/g, "").trim();

                    return NextResponse.json({ success: true, code: text });
                }
            } catch (error: any) {
                console.error(`ERROR with model ${modelName}:`, error.message);
                lastError = error;
                if (error.message?.includes("429")) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                continue;
            }
        }

        return NextResponse.json({ error: lastError?.message || "All models failed" }, { status: 500 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
    }
}
