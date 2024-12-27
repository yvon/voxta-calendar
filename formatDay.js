function formatDaySchedule(characterName, schedule) {
    const formattedEvents = schedule
        .map(event => `- ${event.startTime}: ${event.type}`)
        .join('\n');

    return `${characterName}'s day:\n${formattedEvents}`;
}

module.exports = {
    formatDaySchedule
};
