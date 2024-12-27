const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { makeApiRequest, generateText } = require('./api');
const { formatDaySchedule } = require('./formatDay');

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
        
        return characterData;
    } catch (error) {
        console.error('Error fetching character:', error.message);
        throw error;
    }
}

async function generateSchedule(characterId) {
    const characterData = await fetchCharacter(characterId);
    const characterCard = buildCharacterCard(characterData);
    const prompt = await buildDayGenerationPrompt(characterCard, characterId);

    console.log('Day generation prompt:\n', prompt);
        
    const generatedSchedule = await generateText([
        { role: "System", value: "You are a helpful assistant that generates daily schedules." },
        { role: "User", value: prompt },
        { role: "Assistant", value: '[' }], 500);

    console.log('Generated schedule:', generatedSchedule);
    return generatedSchedule;
}

async function checkAndCreateToday(characterId) {
    // Fetch character data first
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
                    const generatedSchedule = await generateSchedule(characterId);
                    
                    db.run('INSERT INTO days (characterId, day, events) VALUES (?, ?, ?)',
                        [characterId, today, generatedSchedule],
                        function(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            console.log(`New schedule inserted for ${today}`);
                            resolve(JSON.parse(generatedSchedule));
                        }
                    );
                } else {
                    console.log(`Entry already exists for ${today}`);
                    resolve(JSON.parse(row.events));
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

function formatPreviousEventsSection(previousEvents) {
    if (previousEvents.length === 0) return 'No previous schedules available.';
    return JSON.stringify(previousEvents, null, 2);
}

async function buildDayGenerationPrompt(characterCard, characterId) {
    const previousEvents = await getPreviousEvents(characterId);
    const previousEventsStr = formatPreviousEventsSection(previousEvents);

    return `You are tasked with generating a realistic daily schedule for a character.

CHARACTER PROFILE:
${characterCard}

REQUIREMENTS:
1. Generate 4-6 events for today
2. Events must be different from previous days' activities
3. Events should match the character's personality and interests
4. Schedule should follow a logical daily progression
5. Times should be between 06:00 and 23:00

PREVIOUS SCHEDULES TO AVOID REPETITION:
${previousEventsStr}

FORMAT SPECIFICATIONS:
- Return ONLY a JSON array
- Each event must have:
  * "type": descriptive activity name
  * "startTime": 24-hour format "HH:MM"

EXAMPLE FORMAT:
[
    {"type": "morning yoga", "startTime": "07:00"},
    {"type": "breakfast at café", "startTime": "08:30"},
    {"type": "writing session", "startTime": "10:00"}
]`;
}

module.exports = {
    sendUpdateContext,
    checkAndCreateToday,
    fetchCharacter,
    buildDayGenerationPrompt,
    formatPreviousEventsSection
};
