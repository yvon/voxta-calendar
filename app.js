const signalR = require('@microsoft/signalr');
require('dotenv').config();
const { handleMessage } = require('./messageHandler');

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

    connection.on("ReceiveMessage", handleMessage);

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
