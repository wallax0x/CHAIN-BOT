// utils/help_messages.js

const { PREFIX } = require('../config');

// O objeto 'helpData' armazena as informações de todos os comandos.
const helpData = {
    // CATEGORIA: ADMIN
    'ban': {
        category: 'Admin',
        description: 'Remove um membro do grupo.',
        usage: `${PREFIX}ban @membro | <respondendo a uma msg>`,
        details: 'Ao responder a uma mensagem, o bot apaga a mensagem e remove o autor. Admins não podem ser removidos.'
    },
    'add': {
        category: 'Admin',
        description: 'Adiciona um membro ao grupo pelo número.',
        usage: `${PREFIX}add 55119...`
    },
    'promover': {
        category: 'Admin',
        description: 'Promove um membro a administrador.',
        usage: `${PREFIX}promover @membro`
    },
    'demote': {
        category: 'Admin',
        description: 'Rebaixa um administrador a membro comum.',
        usage: `${PREFIX}demote @membro`
    },
    'antilink': {
        category: 'Admin',
        description: 'Ativa/desativa a remoção automática de membros que enviam links.',
        usage: `${PREFIX}antilink on | off`
    },
    'antispam': {
        category: 'Dono',
        description: 'Ativa/desativa o sistema de cooldown para comandos.',
        usage: `${PREFIX}antispam on | off`
    },
    'soadms': {
        category: 'Admin',
        description: 'Restringe o uso de comandos apenas para admins do grupo.',
        usage: `${PREFIX}soadms on | off`
    },
    'limpar': {
        category: 'Admin',
        description: 'Apaga as mensagens do bot no chat.',
        usage: `${PREFIX}limpar`
    },
    'marcarall': {
        category: 'Admin',
        description: 'Menciona todos os membros do grupo em uma mensagem.',
        usage: `${PREFIX}marcarall [sua mensagem]`,
        aliases: ['todos']
    },
    'x9': {
        category: 'Admin',
        description: 'Ativa/desativa o modo de auditoria do grupo (X9).',
        usage: `${PREFIX}x9 on | off`
    },

    // CATEGORIA: ECONOMIA & PERFIL
    'daily': {
        category: 'Economia',
        description: 'Resgata sua recompensa diária de XP e Moedas.',
        usage: `${PREFIX}daily`
    },
    'perfil': {
        category: 'Economia',
        description: 'Mostra seu perfil com nível, XP, moedas e título.',
        usage: `${PREFIX}perfil [@membro]`,
        aliases: ['level']
    },
    'loja': {
        category: 'Economia',
        description: 'Mostra os itens disponíveis para compra com moedas.',
        usage: `${PREFIX}loja`
    },
    'comprar': {
        category: 'Economia',
        description: 'Compra um item da loja.',
        usage: `${PREFIX}comprar <id_do_item> [argumentos]`
    },
    'rank': {
        category: 'Economia',
        description: 'Exibe o ranking de XP ou moedas do grupo.',
        usage: `${PREFIX}rank xp | moedas`
    },

    // CATEGORIA: SOCIAL & RELACIONAMENTO
    'relacionamento': {
        category: 'Social',
        description: 'Gerencia todo o sistema de namoro e casamento do bot.',
        usage: `${PREFIX}relacionamento`,
        aliases: ['pedirnamoro', 'aceitar', 'recusar', 'casar', 'aceitarcasamento', 'recusarcasamento', 'terminar', 'divorcio', 'casais'],
        subcommands: {
            'pedirnamoro': {
                usage: `${PREFIX}pedirnamoro @membro`,
                description: 'Pede alguém em namoro. A pessoa precisa usar `!aceitar` ou `!recusar`.'
            },
            'casar': {
                usage: `${PREFIX}casar`,
                description: 'Pede seu/sua namorada(o) em casamento. Requer um tempo mínimo de namoro.'
            },
            'aceitar / recusar': {
                usage: `${PREFIX}aceitar | ${PREFIX}recusar`,
                description: 'Responde a um pedido de namoro.'
            },
            'aceitarcasamento / recusarcasamento': {
                usage: `${PREFIX}aceitarcasamento | ${PREFIX}recusarcasamento`,
                description: 'Responde a um pedido de casamento.'
            },
            'terminar / divorcio': {
                usage: `${PREFIX}terminar | ${PREFIX}divorcio`,
                description: 'Termina seu relacionamento atual (namoro ou casamento).'
            },
            'casais': {
                usage: `${PREFIX}casais`,
                description: 'Lista todos os casais e namorados do grupo.'
            }
        }
    },

    // CATEGORIA: IA
    'gemini': {
        category: 'IA',
        description: 'Faz uma pergunta para a Inteligência Artificial Gemini.',
        usage: `${PREFIX}gemini <sua pergunta>`
    },
    'desenhar': {
        category: 'IA',
        description: 'Pede para a IA gerar uma imagem a partir de um texto.',
        usage: `${PREFIX}desenhar <descrição da imagem>`,
        aliases: ['iaimagem']
    },

    // CATEGORIA: JOGOS
    'forca': {
        category: 'Jogos',
        description: 'Inicia um jogo da Forca.',
        usage: `${PREFIX}forca [categoria]`,
        details: `Subcomandos: ${PREFIX}letra <letra>, ${PREFIX}palavra <palavra>`
    },
    'velha': {
        category: 'Jogos',
        description: 'Desafia um membro para um Jogo da Velha.',
        usage: `${PREFIX}velha @membro`
    },
    'brincadeiras': {
        category: 'Jogos',
        description: 'Ativa ou desativa os comandos de jogos no grupo.',
        usage: `${PREFIX}brincadeiras on | off`
    },

    // CATEGORIA: UTILIDADES
    'ping': {
        category: 'Utilidades',
        description: 'Verifica se o bot está online e seu tempo de resposta.',
        usage: `${PREFIX}ping`
    },
    'clima': {
        category: 'Utilidades',
        description: 'Mostra a previsão do tempo para uma cidade.',
        usage: `${PREFIX}clima <cidade>`
    },
    'figu': {
        category: 'Utilidades',
        description: 'Cria uma figurinha a partir de uma imagem ou vídeo (máx 10s).',
        usage: `${PREFIX}figu <respondendo a uma mídia>`,
        aliases: ['s']
    },
    'rename': {
        category: 'Utilidades',
        description: 'Muda o nome de uma figurinha.',
        usage: `${PREFIX}rename <Novo Nome> | <Novo Autor>`
    },
    'correio': {
        category: 'Utilidades',
        description: 'Envia uma mensagem anônima para qualquer número no WhatsApp.',
        usage: `${PREFIX}correio <número> / <mensagem>`
    },
    // Adicione os outros comandos aqui...
};

// Função para encontrar um comando pelo seu nome ou alias
function findCommand(commandName) {
    if (helpData[commandName]) {
        return { name: commandName, ...helpData[commandName] };
    }
    for (const name in helpData) {
        if (helpData[name].aliases && helpData[name].aliases.includes(commandName)) {
            return { name, ...helpData[name] };
        }
    }
    return null;
}

module.exports = { helpData, findCommand };