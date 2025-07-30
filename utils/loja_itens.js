// utils/loja_itens.js

const ITENS_DA_LOJA = [
    {
        id: 'titulo', // ID único para o item
        nome: 'Título Personalizado',
        emoji: '📝',
        preco: 100,
        descricao: 'Defina um título que aparecerá no seu perfil.'
    },
    {
        id: 'boost_xp', // ID único
        nome: 'Boost de XP (1h)',
        emoji: '🚀',
        preco: 70,
        descricao: 'Ganhe XP em dobro por 1 hora. (Em desenvolvimento)'
    },
    {
    id: 'caixa',
    nome: 'Caixa Misteriosa',
    preco: 150, // Preço sugerido, você pode mudar
    emoji: '🎁',
    tipo: 'consumivel', // Novo campo para categorizar
    descricao: 'Pode conter prêmios incríveis... ou nada! Você se arrisca?'
},
    // Adicione mais itens aqui no futuro
];

module.exports = ITENS_DA_LOJA;