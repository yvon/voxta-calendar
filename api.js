require('dotenv').config();

function getAuthHeaders() {
    const credentials = Buffer.from(`${process.env.WS_USERNAME}:${process.env.WS_PASSWORD}`).toString('base64');
    return {
        'Authorization': `Basic ${credentials}`
    };
}

async function makeApiRequest(endpoint, method = 'GET', data = null) {
    const baseUrl = process.env.WS_BASE_URL;
    try {
        const options = {
            method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error making API request to ${endpoint}:`, error.message);
        throw error;
    }
}

function generateText(systemPrompt, userPrompt, maxTokens) {
    const requestBody = {
        prompt: [
            { role: "System", value: systemPrompt },
            { role: "User", value: userPrompt }
        ],
        maxTokens: maxTokens
    };

    return makeApiRequest('/api/text/generate', 'POST', requestBody);
}

module.exports = {
    makeApiRequest,
    generateText
};
