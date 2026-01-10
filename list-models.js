const fs = require('fs');
async function listModels() {
    const apiKey = "AIzaSyBCfA0AwFY0BQjZK0Fmx6Kjn6Mip9LklLM";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            const names = data.models.map(m => m.name.replace('models/', ''));
            fs.writeFileSync('models.txt', names.join('\n'));
            console.log("Done");
        }
    } catch (e) {
        console.error(e);
    }
}
listModels();
