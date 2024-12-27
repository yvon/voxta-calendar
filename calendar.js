const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { makeApiRequest, generateText } = require('./api');

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
        const response = await makeApiRequest(`/api/characters/${characterId}`);
        const characterData = await response.json();
        console.log('Character data:', characterData);
        
        // Build and log the character card
        const characterCard = buildCharacterCard(characterData);
        console.log('Character card:\n', characterCard);
        
        // Generate and log the day generation prompt
        const prompt = await buildDayGenerationPrompt(characterCard, characterId);
        console.log('Day generation prompt:\n', prompt);
        
        // Generate schedule using the text generation API
        const generatedSchedule = await generateText([
            { role: "System", value: "You are a helpful assistant that generates daily schedules." },
            { role: "User", value: prompt },
            { role: "Assistant", value: '[' }], 500);

        console.log('Generated schedule:', generatedSchedule);
        
        return characterData;
    } catch (error) {
        console.error('Error fetching character:', error.message);
        throw error;
    }
}

async function checkAndCreateToday(characterId) {
    // Fetch character data first
    const characterData = await fetchCharacter(characterId);
    const characterCard = buildCharacterCard(characterData);
    const prompt = await buildDayGenerationPrompt(characterCard, characterId);
    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking daily entry for character ${characterId} on ${today}`);
    
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM days WHERE characterId = ? AND day = ?', [characterId, today], async (err, row) => {
            try {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!row) {
                    console.log(`No entry found for ${today}, generating new schedule`);
                } else {
                    console.log(`Entry already exists for ${today}, current events:`);
                    console.log(JSON.parse(row.events));
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function getPreviousEvents(characterId, daysToLookBack = 7) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT day, events 
            FROM days 
            WHERE characterId = ? 
            ORDER BY day DESC 
            LIMIT ?
        `;
        
        db.all(query, [characterId, daysToLookBack], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const events = rows.map(row => ({
                day: row.day,
                events: JSON.parse(row.events)
            }));
            resolve(events);
        });
    });
}

async function buildDayGenerationPrompt(characterCard, characterId) {
    const previousEvents = await getPreviousEvents(characterId);
    const previousEventsStr = previousEvents.length > 0 
        ? `\nPrevious schedules for this character:\n${JSON.stringify(previousEvents, null, 2)}`
        : '\nNo previous schedules available.';

    return `Based on the following character card, generate a daily schedule of events in JSON format.
    Important: Generate different activities from the previous days shown below.

\`\`\`
${characterCard}
\`\`\`

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
