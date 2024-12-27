const signalR = require('@microsoft/signalr');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
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

// {"arguments":[{"$type":"updateContext","sessionId":"501d33a2-3ffa-0a18-4170-2f55a96a7f5b","contextKey":"Inspector","contexts":[{"text":"Test"}]}],"target":"SendMessage","type":1}
//

async function main() {
    const baseUrl = process.env.WS_BASE_URL;
    const credentials = Buffer.from(`${process.env.WS_USERNAME}:${process.env.WS_PASSWORD}`).toString('base64');
    const headers = { 'Authorization': 'Basic ' + credentials };

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/hub`, { headers })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connection.on("ReceiveMessage", async (message) => {
        console.log('Received message:', JSON.stringify(message, null, 2));
        
        if (message.$type === 'chatsSessionsUpdated') {
            for (const session of message.sessions) {
                for (const character of session.characters) {
                    try {
                        await checkAndCreateToday(character.id);
                        console.log(`Daily entry check/creation completed for character ${character.name} (${character.id})`);
                    } catch (dbError) {
                        console.error(`Error during daily entry check/creation for character ${character.name}:`, dbError);
                    }
                }
            }
        }
    });

    try {
        await connection.start();
        console.log('Connected to WebSocket');

        // Authentication
        await connection.invoke('SendMessage', {
            $type: 'authenticate',
            client: "Calendar",
            clientVersion: "1.0",
            scope: ["role:provider"],
            capabilities: {}
        });
        console.log('Authentication sent');

    } catch (error) {
        console.error('Erreur:', error);
    }
}

main();
