// utils/simi_manager.js
const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../json/simi_db.json');
const MEMORY_LIMIT = 500;

async function readDb() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch { return {}; }
}

async function writeDb(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

async function learn(trigger, response) {
    const db = await readDb();
    const triggerKey = trigger.toLowerCase().trim();
    if (!db[triggerKey]) {
        db[triggerKey] = [];
    }
    db[triggerKey].push({ response: response, learnedAt: Date.now() });

    const allKeys = Object.keys(db);
    if (allKeys.length > MEMORY_LIMIT) {
        let oldestKey = allKeys[0];
        let oldestTime = db[oldestKey][0]?.learnedAt || Date.now();
        for (const key of allKeys) {
            const entryTimestamp = db[key][0]?.learnedAt;
            if (entryTimestamp && entryTimestamp < oldestTime) {
                oldestTime = entryTimestamp;
                oldestKey = key;
            }
        }
        delete db[oldestKey];
    }
    
    await writeDb(db);
    return true;
}

async function getResponse(trigger) {
    const db = await readDb();
    const triggerKey = trigger.toLowerCase().trim();
    const possibleResponses = db[triggerKey];
    if (possibleResponses?.length > 0) {
        const randomResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
        return randomResponse.response;
    }
    return null;
}

module.exports = { learn, getResponse };