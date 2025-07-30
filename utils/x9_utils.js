// utils/x9_utils.js

const fs = require('fs').promises;
const path = require('path');

const X9_CONFIG_PATH = path.resolve(__dirname, '../json/x9_config.json');

async function readX9Config() {
    try {
        const data = await fs.readFile(X9_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeX9Config({});
            return {};
        }
        return {};
    }
}

async function writeX9Config(config) {
    try {
        await fs.writeFile(X9_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever em x9_config.json:', error);
    }
}

module.exports = { readX9Config, writeX9Config };