// utils/bot_instance.js
let sockInstance = null;

function setSock(s) {
    sockInstance = s;
}

function getSock() {
    return sockInstance;
}

module.exports = {
    setSock,
    getSock,
};