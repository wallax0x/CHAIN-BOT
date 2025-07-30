const faker = require('faker-br');

module.exports = async (sock, m, jid, args, prefix, command) => {
    try {
        const pessoa = {
            nome: faker.name.findName(),
            nascimento: faker.date.past(30, new Date(2003, 0, 1)).toLocaleDateString('pt-BR'),
            rg: faker.br.rg(),
            cpf: faker.br.cpf(),
            celular: faker.phone.phoneNumber('(##) 9####-####'),
            rua: faker.address.streetName(),
            numero: faker.random.number({ min: 1, max: 999 }),
            cidade: faker.address.city(),
            estado: faker.address.stateAbbr(),
            cep: faker.address.zipCode('#####-###'),
        };

        const msg = `
🪪 *Identidade Falsa Gerada:*

👤 Nome: ${pessoa.nome}
📆 Nascimento: ${pessoa.nascimento}
🪪 RG: ${pessoa.rg}
📊 CPF: ${pessoa.cpf}
📱 Celular: ${pessoa.celular}
🏠 Endereço: ${pessoa.rua}, ${pessoa.numero}
🌆 Cidade: ${pessoa.cidade} - ${pessoa.estado}
📮 CEP: ${pessoa.cep}
        `.trim();

        await sock.sendMessage(jid, { text: msg }, { quoted: m });

    } catch (e) {
        console.error('[fakeid] Erro:', e);
        await sock.sendMessage(jid, { text: '❌ Erro ao gerar identidade falsa.' }, { quoted: m });
    }
};
