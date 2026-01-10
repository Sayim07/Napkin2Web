const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in environment");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-002",
        "gemini-1.5-pro",
        "gemini-1.5-pro-002",
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash-001"
    ];

    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            // Try a very small prompt
            await model.generateContent("hi");
            console.log(`Model ${m} is available and working.`);
        } catch (e) {
            console.log(`Model ${m} failed: ${e.message}`);
        }
    }
}

listModels();
