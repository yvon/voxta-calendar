const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { makeApiRequest } = require('./api');

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

function buildCharacterCard(characterData) {
    let content = '';
    
    if (characterData.personality) {
        content += `Personality: ${characterData.personality}\n`;
    }
    
    if (characterData.description) {
        content += `Description: ${characterData.description}\n`;
    }
    
    if (characterData.profile) {
        content += `${characterData.profile}\n`;
    }
    
    return content.trim();
}

async function fetchCharacter(characterId) {
    try {
        const characterData = await makeApiRequest(`/api/characters/${characterId}`);
        console.log('Character data:', characterData);
        
        // Build and log the character card
        const characterCard = buildCharacterCard(characterData);
        console.log('Character card:\n', characterCard);
        
        // Generate and log the day generation prompt
        const prompt = buildDayGenerationPrompt(characterCard);
        console.log('Day generation prompt:\n', prompt);
        
        return characterData;
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

function buildDayGenerationPrompt(characterCard) {
    return `Based on the following character card, generate a daily schedule of events in JSON format.

```
${characterCard}
```

Generate a schedule of events for this character's day. Each event should have:
- type: the activity name
- startTime: in "HH:MM" 24-hour format

Return ONLY a JSON array of events like this example:
[
    {"type": "meditation", "startTime": "07:00"},
    {"type": "breakfast", "startTime": "08:00"},
    {"type": "work", "startTime": "09:00"}
]

The schedule should match the character's personality and interests. Generate 4-6 events spread throughout the day.`;
}

module.exports = {
    checkAndCreateToday,
    fetchCharacter,
    buildDayGenerationPrompt
};
