const signalR = require('@microsoft/signalr');

async function main() {
    const baseUrl = 'YOUR_WS_BASE_URL';
    const headers = {
        'Authorization': 'Basic ' + Buffer.from('username:password').toString('base64')
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
            scope: ["role:app"],
            capabilities: {
                audioInput: "WebSocketStream",
                audioOutput: "Url",
                acceptedAudioContentTypes: ["audio/x-wav", "audio/mpeg"]
            }
        });
        console.log('Authentification envoyée');

    } catch (error) {
        console.error('Erreur:', error);
    }
}

main();
