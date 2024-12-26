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
                // Si le jour n'existe pas, on le crée avec des événements par défaut
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
                console.log(`Entry already exists for ${today}, skipping creation`);
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

    connection.on("ReceiveMessage", (message) => {
        console.log('Received message:', JSON.stringify(message, null, 2));
    });

    try {
        await connection.start();
        console.log('Connected to WebSocket');

        // Authentification
        await connection.invoke('SendMessage', {
            $type: 'authenticate',
            client: "SimpleClient",
            clientVersion: "1.0",
            scope: ["role:provider"],
            capabilities: {
                audioInput: "None",
                audioOutput: "None",
                acceptedAudioContentTypes: ["audio/x-wav", "audio/mpeg"]
            }
        });
        console.log('Authentication sent');

        // Vérifier et créer l'entrée du jour pour un characterId de test
        const testCharacterId = '501d33a2-3ffa-0a18-4170-2f55a96a7f5b';
        try {
            await checkAndCreateToday(testCharacterId);
            console.log('Daily entry check/creation completed successfully');
        } catch (dbError) {
            console.error('Error during daily entry check/creation:', dbError);
        }

    } catch (error) {
        console.error('Erreur:', error);
    }
}

main();
