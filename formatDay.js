function formatDaySchedule(characterName, schedule) {
    const formattedEvents = schedule
        .map(event => `${event.startTime}: ${event.type}`)
        .join(', ');

    return `${characterName}'s day: ${formattedEvents}`;
}

module.exports = {
    formatDaySchedule
};
