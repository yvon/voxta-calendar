const signalR = require('@microsoft/signalr');
require('dotenv').config();

async function main() {
    const baseUrl = process.env.WS_BASE_URL;
    const credentials = Buffer.from(`${process.env.WS_USERNAME}:${process.env.WS_PASSWORD}`).toString('base64');
    const headers = {
        'Authorization': 'Basic ' + credentials
    };

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/hub`, { headers })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connection.on("ReceiveMessage", (message) => {
        console.log('Message reçu:', message);
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
