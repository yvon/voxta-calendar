const axios = require('axios');
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
        const response = await axios({
            method,
            url: `${baseUrl}${endpoint}`,
            headers: getAuthHeaders(),
            data
        });
        return response.data;
    } catch (error) {
        console.error(`Error making API request to ${endpoint}:`, error.message);
        throw error;
    }
}

async function generateText(systemPrompt, userPrompt, maxTokens) {
    const requestBody = {
        prompt: [
            { role: "System", value: systemPrompt },
            { role: "User", value: userPrompt }
        ],
        maxTokens: maxTokens
    };

    const response = await makeApiRequest('/api/text/generate', 'POST', requestBody);
    
    // Handle streamed response chunks
    if (Array.isArray(response)) {
        let combinedText = '';
        for (const chunk of response) {
            if (chunk.data && chunk.data.text) {
                combinedText += chunk.data.text;
            }
        }
        try {
            return JSON.parse(combinedText);
        } catch (error) {
            console.error('Failed to parse combined JSON:', combinedText);
            throw new Error('Invalid JSON format in response');
        }
    }
    
    return response;
}

module.exports = {
    makeApiRequest,
    generateText
};
