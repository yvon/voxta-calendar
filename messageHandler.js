const { checkAndCreateToday } = require('./calendar');
const { formatDaySchedule } = require('./formatDay');
const EventEmitter = require('events');

const messageEvents = new EventEmitter();

async function handleMessage(message) {
    console.log('Received message:', JSON.stringify(message, null, 2));
    
    // {
    //   "$type": "chatsSessionsUpdated",
    //   "sessions": [
    //     {
    //       "sessionId": "ef550630-87a1-eb48-a2cb-0c5885952898",
    //       "chatId": "941a38e7-a427-a01d-7c4b-04831ec8e5f4",
    //       "user": {
    //         "id": "1efb273a-1f41-7531-a601-16ac9c6cb39b",
    //         "name": "Yvon"
    //       },
    //       "characters": [
    //         {
    //           "id": "35c74d75-e3e4-44af-9389-faade99cc419",
    //           "name": "Voxta",
    //           "thumbnailUrl": "/api/characters/35c74d75-e3e4-44af-9389-faade99cc419/thumbnail?etag=1"
    //         }
    //       ]
    //     }
    //   ]
    // }
    if (message.$type === 'chatsSessionsUpdated') {
        for (const session of message.sessions) {
            for (const character of session.characters) {
                try {
                    const schedule = await checkAndCreateToday(character.id);
                    const formattedDay = formatDaySchedule(character.name, schedule);
                    console.log(`Daily entry check/creation completed for character ${character.name} (${character.id})`);
                    console.log(formattedDay);
                    
                    // Emit event with schedule data
                    messageEvents.emit('scheduleGenerated', {
                        sessionId: session.sessionId,
                        formattedDay
                    });
                } catch (dbError) {
                    console.error(`Error during daily entry check/creation for character ${character.name}:`, dbError);
                }
            }
        }
    }
}

module.exports = {
    handleMessage,
    messageEvents
};
