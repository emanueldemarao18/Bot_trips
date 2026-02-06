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

        if (qr) {
            console.clear();
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ Bot conectado 🚀');
        }

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log('🔁 Reconectando...', shouldReconnect);

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

        if (!text.startsWith('!')) return;

        const jid = msg.key.remoteJid;
        const command = text.toLowerCase().trim();

        const hoje = new Date();
        const viagem = new Date(2026, 2, 4);
        const diff = Math.max(
            0,
            Math.ceil((viagem - hoje) / (1000 * 60 * 60 * 24))
        );

        try {
            // ✈️ viagem
            if (command === '!viagem') {
                await sock.sendMessage(jid, {
                    text: `✈️ Faltam ${diff} dias pra Holanda 🇳🇱🔥`
                });
            }

            // ⏳ countdown
            else if (command === '!countdown') {
                const horas = diff * 24;
                const minutos = horas * 60;

                await sock.sendMessage(jid, {
                    text: `🚀 ${diff} dias\n🔥 ${horas} horas\n💥 ${minutos} minutos`
                });
            }

            // 🧳 mala
            else if (command.startsWith('!mala')) {
                if (command.includes('frio')) {
                    await sock.sendMessage(jid, {
                        text: `🧳 Mala frio:
Casaco 🧥
Luvas 🧤
Cachecol 🧣`
                    });
                } else if (command.includes('calor')) {
                    await sock.sendMessage(jid, {
                        text: `🧳 Mala calor:
T-shirts 👕
Shorts 🩳
Óculos 😎`
                    });
                } else {
                    await sock.sendMessage(jid, {
                        text: `Usa: !mala frio ou !mala calor`
                    });
                }
            }

            // 💶 orçamento
            else if (command.startsWith('!orcamento')) {
                const parts = command.split(' ');
                const total = Number(parts[1]);
                const pessoas = Number(parts[2]);

                if (!total || !pessoas) {
                    await sock.sendMessage(jid, {
                        text: `Uso: !orcamento 300 3`
                    });
                    return;
                }

                const each = (total / pessoas).toFixed(2);

                await sock.sendMessage(jid, {
                    text: `💶 Cada pessoa paga: €${each}`
                });
            }

            // 📍 hotel salvar
            else if (command.startsWith('!hotel')) {
                const nome = text.replace('!hotel', '').trim();

                if (!nome) {
                    await sock.sendMessage(jid, {
                        text: `Uso: !hotel nome do hotel`
                    });
                    return;
                }

                memory.hotel = nome;

                await sock.sendMessage(jid, {
                    text: `📍 Hotel salvo: ${memory.hotel}`
                });
            }

            // 📋 info
            else if (command === '!info') {
                await sock.sendMessage(jid, {
                    text: `📋 Info viagem:
Hotel: ${memory.hotel || 'não definido'}`
                });
            }

            // 😂 mood
            else if (command === '!mood') {
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
            else if (command === '!help') {
                await sock.sendMessage(jid, {
                    text: `🤖 Comandos:
!viagem
!countdown
!mala frio
!mala calor
!orcamento total pessoas
!hotel nome
!info
!mood`
                });
            }
        } catch (err) {
            console.log('Erro comando:', err);
        }
    });
}

startBot();
