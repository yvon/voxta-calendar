const signalR = require('@microsoft/signalr');
require('dotenv').config();
const { handleMessage } = require('./messageHandler');

// {"arguments":[{"$type":"updateContext","sessionId":"501d33a2-3ffa-0a18-4170-2f55a96a7f5b","contextKey":"Inspector","contexts":[{"text":"Test"}]}],"target":"SendMessage","type":1}
//

async function sendUpdateContext(connection, sessionId, contextKey, text) {
    try {
        await connection.invoke('SendMessage', {
            arguments: [{
                $type: "updateContext",
                sessionId: sessionId,
                contextKey: contextKey,
                contexts: [{
                    text: text
                }]
            }],
            target: "SendMessage",
            type: 1
        });
        console.log('Update context message sent successfully');
    } catch (error) {
        console.error('Error sending update context message:', error);
        throw error;
    }
}

async function connect(maxRetries = 3) {
    const baseUrl = process.env.WS_BASE_URL;
    const credentials = Buffer.from(`${process.env.WS_USERNAME}:${process.env.WS_PASSWORD}`).toString('base64');
    const headers = { 'Authorization': 'Basic ' + credentials };

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/hub`, { headers })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connection.on("ReceiveMessage", handleMessage);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
            return connection; // Success, exit the function

        } catch (error) {
            console.error(`Connection attempt ${attempt}/${maxRetries} failed:`, error);
            
            if (attempt === maxRetries) {
                console.error('Max retries reached, giving up');
                throw error;
            }

            // Calculate exponential backoff delay: 2^attempt * 1000ms (1s, 2s, 4s)
            const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Cap at 10 seconds
            console.log(`Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function main() {
    try {
        global.connection = await connect();
        
        // Exemple d'utilisation de sendUpdateContext
        // await sendUpdateContext(
        //     connection,
        //     "501d33a2-3ffa-0a18-4170-2f55a96a7f5b",
        //     "Inspector",
        //     "Test"
        // );
    } catch (error) {
        console.error('Failed to establish connection after all retries:', error);
        process.exit(1);
    }
}

main();
