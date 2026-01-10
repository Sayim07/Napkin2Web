const fs = require('fs');

async function testClassification() {
    const catImagePath = "C:/Users/sayim/.gemini/antigravity/brain/153e50d1-0e9d-4508-acf4-2d3d571039a0/cat_photo_1768080327570.png";
    const sketchImagePath = "C:/Users/sayim/.gemini/antigravity/brain/153e50d1-0e9d-4508-acf4-2d3d571039a0/ui_sketch_1768080354548.png";

    const testFile = async (filePath, label) => {
        console.log(`Testing ${label}...`);
        const imageData = fs.readFileSync(filePath).toString('base64');
        const imageBase64 = `data:image/png;base64,${imageData}`;

        const response = await fetch("http://localhost:3000/api/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "analyze",
                image: imageBase64,
            }),
        });

        const result = await response.json();
        console.log(`Result for ${label}:`, JSON.stringify(result, null, 2));
        console.log('Status Code:', response.status);
        console.log('-------------------');
    };

    try {
        await testFile(catImagePath, "Cat Photo (Should be rejected)");
        await testFile(sketchImagePath, "UI Sketch (Should be accepted)");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testClassification();
