import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

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

        const command = text.toLowerCase().trim();
        const jid = msg.key.remoteJid;

        // ✅ contagem real da viagem
        if (command === '!viagem') {
            const hoje = new Date();
            const viagem = new Date(2026, 2, 4);

            const diff = Math.ceil(
                (viagem - hoje) / (1000 * 60 * 60 * 24)
            );

            await sock.sendMessage(jid, {
                text: `Faltam ${diff} dias pra viagem na Holanda 🇳🇱`
            });
        }

        // ✅ checklist
        if (command === '!checklist') {
            await sock.sendMessage(jid, {
                text: `Checklist:
Passaporte ✅
Mala ✅
Cartão ✅`
            });
        }
    });
}

startBot();
