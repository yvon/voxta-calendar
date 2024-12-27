const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

// Initialize database
function initializeDatabase() {
    const db = new sqlite3.Database('database.db');
    const schema = fs.readFileSync('schema.sql', 'utf8');
    
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database:', err);
        } else {
            console.log('Database schema initialized');
        }
    });
    
    return db;
}

const db = initializeDatabase();

async function fetchCharacter(characterId) {
    const baseUrl = process.env.WS_BASE_URL;
    const credentials = Buffer.from(`${process.env.WS_USERNAME}:${process.env.WS_PASSWORD}`).toString('base64');
    
    try {
        const response = await axios.get(`${baseUrl}/api/characters/${characterId}`, {
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });
        console.log('Character data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching character:', error.message);
        throw error;
    }
}

async function checkAndCreateToday(characterId) {
    // Fetch character data first
    await fetchCharacter(characterId);
    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking daily entry for character ${characterId} on ${today}`);
    
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM days WHERE characterId = ? AND day = ?', [characterId, today], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!row) {
                console.log(`No entry found for ${today}, creating new entry with default events`);
                // If no entry exists for today, create one with default events
                const defaultEvents = JSON.stringify([
                    { type: "piscine", startTime: "10:00" },
                    { type: "petanque", startTime: "16:00" }
                ]);
                
                db.run('INSERT INTO days (characterId, day, events) VALUES (?, ?, ?)',
                    [characterId, today, defaultEvents],
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        console.log(`Successfully created new entry for ${today} with default events`);
                        resolve();
                    });
            } else {
                console.log(`Entry already exists for ${today}, current events:`);
                console.log(JSON.parse(row.events));
                resolve();
            }
        });
    });
}

module.exports = {
    checkAndCreateToday,
    fetchCharacter
};
