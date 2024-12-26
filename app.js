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
        console.log('Message reçu:', JSON.stringify(message, null, 2));
    });

    try {
        await connection.start();
        console.log('Connecté au WebSocket');

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
        console.log('Authentification envoyée');

    } catch (error) {
        console.error('Erreur:', error);
    }
}

main();
