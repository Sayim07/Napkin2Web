const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Testing the specific model the user is trying
    const modelName = "gemini-1.5-flash-002";
    console.log(`Testing model: ${modelName}`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, respond with 'OK' if you can hear me.");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (e) {
        console.error("FULL ERROR OBJECT:");
        console.error(JSON.stringify(e, null, 2));
        console.error("Message:", e.message);
        console.error("Status:", e.status);
    }
}

testModel();
