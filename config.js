require('dotenv').config();

const config = {
    voxta: {
        baseUrl: process.env.VOXTA_BASE_URL || 'http://localhost:5384',
        username: process.env.VOXTA_USERNAME,
        password: process.env.VOXTA_PASSWORD
    }
};

module.exports = config;
