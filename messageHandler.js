const { checkAndCreateToday } = require('./calendar');

async function handleMessage(message) {
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
}

module.exports = {
    handleMessage
};
