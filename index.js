import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

const memory = {
    hotel: null
};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'open') console.log('Bot conectado 🚀');

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            '';

        const jid = msg.key.remoteJid;
        const command = text.toLowerCase().trim();

        const hoje = new Date();
        const viagem = new Date(2026, 2, 4);
        const diff = Math.ceil((viagem - hoje) / (1000 * 60 * 60 * 24));

        // ✈️ viagem
        if (command === '!viagem') {
            await sock.sendMessage(jid, {
                text: `Faltam ${diff} dias pra Holanda 🇳🇱🔥`
            });
        }

        // ⏳ countdown
        if (command === '!countdown') {
            const horas = diff * 24;
            const minutos = horas * 60;

            await sock.sendMessage(jid, {
                text: `🚀 ${diff} dias\n🔥 ${horas} horas\n💥 ${minutos} minutos`
            });
        }

        // 🧳 mala frio/calor
        if (command.startsWith('!mala')) {
            if (command.includes('frio')) {
                await sock.sendMessage(jid, {
                    text: `🧳 Mala frio:
Casaco 🧥
Luvas 🧤
Cachecol 🧣`
                });
            } else {
                await sock.sendMessage(jid, {
                    text: `🧳 Mala calor:
T-shirts 👕
Shorts 🩳
Óculos 😎`
                });
            }
        }

        // 💶 orçamento
        if (command.startsWith('!orcamento')) {
            const parts = command.split(' ');
            const total = Number(parts[1]);
            const pessoas = Number(parts[2]);

            if (!total || !pessoas) return;

            const each = (total / pessoas).toFixed(2);

            await sock.sendMessage(jid, {
                text: `Cada pessoa paga: €${each}`
            });
        }

        // 📍 hotel salvar
        if (command.startsWith('!hotel')) {
            memory.hotel = text.replace('!hotel', '').trim();

            await sock.sendMessage(jid, {
                text: `Hotel salvo: ${memory.hotel}`
            });
        }

        // 📋 info
        if (command === '!info') {
            await sock.sendMessage(jid, {
                text: `📍 Hotel: ${memory.hotel || 'não definido'}`
            });
        }

        // 😂 mood
        if (command === '!mood') {
            const frases = [
                'Já sente o cheiro da liberdade? ✈️',
                'Essa viagem vai ser histórica 😎',
                'Só falta fazer a mala 🧳',
                'Holanda nos espera 🇳🇱🔥'
            ];

            const r = frases[Math.floor(Math.random() * frases.length)];

            await sock.sendMessage(jid, { text: r });
        }

        // 🧠 help
        if (command === '!help') {
            await sock.sendMessage(jid, {
                text: `Comandos:
!viagem
!countdown
!mala frio/calor
!orcamento total pessoas
!hotel nome
!info
!mood`
            });
        }
    });
}

startBot();
