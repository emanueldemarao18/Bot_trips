import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';

const memory = { hotel: null };

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        
        if (qr) {
            const dataUrl = await QRCode.toDataURL(qr);
            console.log('\n🔑 Abra este link no navegador:\n');
            console.log(dataUrl);
        }

        if (connection === 'open') console.log('✅ Bot conectado 🚀');

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
        const diff = Math.max(0, Math.ceil((viagem - hoje) / 86400000));

        try {
            if (command === '!viagem') {
                await sock.sendMessage(jid, {
                    text: `✈️ Faltam ${diff} dias pra Holanda 🇳🇱🔥`
                });
            }

            else if (command === '!countdown') {
                await sock.sendMessage(jid, {
                    text: `🚀 ${diff} dias\n🔥 ${diff * 24} horas\n💥 ${diff * 1440} minutos`
                });
            }

            else if (command.startsWith('!hotel')) {
                const nome = text.replace('!hotel', '').trim();
                memory.hotel = nome;
                await sock.sendMessage(jid, { text: `📍 Hotel salvo: ${memory.hotel}` });
            }

            else if (command === '!info') {
                await sock.sendMessage(jid, {
                    text: `📋 Info viagem:\nHotel: ${memory.hotel || 'não definido'}`
                });
            }

            else if (command === '!help') {
                await sock.sendMessage(jid, {
                    text: `🤖 Comandos:\n!viagem\n!countdown\n!hotel nome\n!info`
                });
            }
        } catch (err) {
            console.log('Erro comando:', err);
        }
    });
}

startBot();
