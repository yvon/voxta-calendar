const axios = require('axios');
require('dotenv').config();

function getAuthHeaders() {
    const credentials = Buffer.from(`${process.env.WS_USERNAME}:${process.env.WS_PASSWORD}`).toString('base64');
    return {
        'Authorization': `Basic ${credentials}`
    };
}

async function makeApiRequest(endpoint) {
    const baseUrl = process.env.WS_BASE_URL;
    try {
        const response = await axios.get(`${baseUrl}${endpoint}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error(`Error making API request to ${endpoint}:`, error.message);
        throw error;
    }
}

module.exports = {
    makeApiRequest
};
