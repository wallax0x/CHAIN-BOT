// utils/user_state_manager.js

// Este objeto guardará o histórico de conversa de cada usuário

const userHistories = {};

// Função para obter o histórico de um usuário

const getUserHistory = (userId) => {

    if (!userHistories[userId]) {

        userHistories[userId] = []; // Se não existir, cria um histórico vazio

    }

    return userHistories[userId];

};

// Função para adicionar uma nova mensagem ao histórico

const updateUserHistory = (userId, newHistory) => {

    userHistories[userId] = newHistory;

};

// Função para limpar o histórico de um usuário

const clearUserHistory = (userId) => {

    if (userHistories[userId]) {

        delete userHistories[userId];

    }

};

module.exports = {

    getUserHistory,

    updateUserHistory,

    clearUserHistory

};