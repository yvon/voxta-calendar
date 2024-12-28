# Voxta Calendar Provider

This provider generates daily calendars for companions in [Voxta](https://github.com/VoxTA/VoxTA). It creates unique daily activities that are injected into the conversation context, allowing the AI to naturally reference them.

*Note: This project is not officially associated with the Voxta project.*

## Features

- Generation of personalized daily schedules
- Automatic injection into conversation context
- Takes activity history into account

## Installation

Make sure you have Node.js installed on your system, then:

```bash
npm install
```

## Usage

1. Ensure your Voxta instance is up and running
2. Launch the provider:
```bash
node app.js
```
3. Start a conversation with your companion in Voxta

The generated schedule will be automatically integrated into the conversation context.
