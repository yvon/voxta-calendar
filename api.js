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

async function handleStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let responseData = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n');

        for (let line of lines) {
            if (line.startsWith('data:')) {
                const jsonString = line.substring(6);
                try {
                    const dataObject = JSON.parse(jsonString);
                    if (dataObject.text) {
                        responseData += dataObject.text;
                        // Vous pouvez aussi émettre un événement ici si nécessaire
                    }
                } catch (error) {
                    console.error('Failed to parse streamed JSON:', error);
                    console.error('Response:', jsonString);
                }
            }
        }
    }
    return responseData;
}

async function generateText(systemPrompt, userPrompt, maxTokens) {
    const requestBody = {
        prompt: [
            { role: "System", value: systemPrompt },
            { role: "User", value: userPrompt }
        ],
        maxTokens: maxTokens
    };

    try {
        const response = await makeApiRequest('/api/text/generate', 'POST', requestBody);
        
        if (response.headers && response.headers.get('content-type')?.includes('text/event-stream')) {
            return await handleStreamingResponse(response);
        }
        
        return response;
    } catch (error) {
        console.error('Error in generateText:', error.message);
        throw error;
    }
}

module.exports = {
    makeApiRequest,
    generateText
};
