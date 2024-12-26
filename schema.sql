CREATE TABLE IF NOT EXISTS days (
    characterId TEXT NOT NULL,  -- UUID stored as TEXT
    day DATE NOT NULL,
    events JSON,
    PRIMARY KEY (characterId, day)
);
