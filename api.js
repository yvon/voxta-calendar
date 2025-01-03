const config = require('./config');

function getAuthHeaders() {
    if (config.voxta.username && config.voxta.password) {
        const credentials = Buffer.from(`${config.voxta.username}:${config.voxta.password}`).toString('base64');
        return {
            'Authorization': `Basic ${credentials}`
        };
    }
    return {};
}

async function makeApiRequest(endpoint, method = 'GET', data = null) {
    const baseUrl = config.voxta.baseUrl;
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response
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

async function generateText(prompt, maxTokens) {
    const requestBody = { prompt, maxTokens };

    try {
        const response = await makeApiRequest('/api/text/generate', 'POST', requestBody);
        
        console.log(response.headers.get('content-type'));
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
    generateText,
    getAuthHeaders
};
