const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

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

function checkAndCreateToday(characterId) {
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
    checkAndCreateToday
};
