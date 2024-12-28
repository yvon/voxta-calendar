require('dotenv').config();

const config = {
    ws: {
        baseUrl: process.env.WS_BASE_URL || 'http://localhost:5384',
        username: process.env.WS_USERNAME,
        password: process.env.WS_PASSWORD
    }
};

module.exports = config;
