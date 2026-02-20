require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require('@google/genai');

// ─── Configuration ───────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.error('❌  GEMINI_API_KEY is missing or not set.');
    console.error('   1. Get a key at https://aistudio.google.com/apikey');
    console.error('   2. Paste it into the .env file');
    process.exit(1);
}

const BOT_NAME = 'Personal Bot';
const GROUP_NAME = 'Playground';
const MODEL = 'gemini-3.1-pro-preview';
const MAX_HISTORY = 20;

const SYSTEM_PROMPT = `You are "${BOT_NAME}", a friendly and highly capable personal AI assistant chatting inside a WhatsApp group.
- Keep replies concise and well-formatted for a mobile chat interface.
- Use emojis sparingly to keep things friendly.
- If the user asks who you are, introduce yourself as "${BOT_NAME}".
- You can help with questions, brainstorming, writing, coding, math, and general knowledge.
- If you don't know something, say so honestly.
- Do NOT repeat the question back to the user.
- NEVER end your reply with the word "Over".`;

// ─── Gemini Setup ────────────────────────────────────────────────────────────
const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const chatHistory = [];

async function askGemini(question) {
    chatHistory.push({ role: 'user', parts: [{ text: question }] });
    while (chatHistory.length > MAX_HISTORY) chatHistory.shift();

    try {
        const response = await genai.models.generateContent({
            model: MODEL,
            contents: chatHistory,
            config: { systemInstruction: SYSTEM_PROMPT },
        });

        const reply = response.text || 'Sorry, I could not generate a response.';
        chatHistory.push({ role: 'model', parts: [{ text: reply }] });
        while (chatHistory.length > MAX_HISTORY) chatHistory.shift();
        return reply;
    } catch (err) {
        console.error(`[Gemini Error] ${err.message}`);
        chatHistory.pop();
        return `⚠️ Something went wrong: ${err.message}`;
    }
}

// ─── WhatsApp Client ─────────────────────────────────────────────────────────
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

let isReady = false;
let playgroundChatId = null;
const botSentMessages = new Set();
const processedMessages = new Set();

client.on('qr', (qr) => {
    console.log('\n📱  Scan this QR code with WhatsApp:');
    console.log('   (Settings → Linked Devices → Link a Device)\n');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('✅  Authenticated successfully!');
});

client.on('ready', async () => {
    console.log(`\n🤖  ${BOT_NAME} is online!`);
    console.log('⏳  Looking for "Playground" group...\n');

    try {
        const chats = await client.getChats();
        const groups = chats.filter((c) => c.isGroup);

        console.log(`   Found ${groups.length} groups:`);
        groups.forEach((g) => console.log(`   • "${g.name}" (${g.id._serialized})`));

        const playground = groups.find((g) => g.name === GROUP_NAME);

        if (playground) {
            playgroundChatId = playground.id._serialized;
            console.log(`\n✅  Connected to "${GROUP_NAME}" group!`);
            console.log(`   Group ID: ${playgroundChatId}`);
            console.log(`\n   Send a message ending with "Over" to chat.`);
            console.log('   Press Ctrl+C to stop.\n');
        } else {
            console.error(`\n❌  Group "${GROUP_NAME}" not found!`);
            console.error('   Create a WhatsApp group named exactly "Playground" and restart.\n');
        }
    } catch (err) {
        console.error('❌  Error fetching chats:', err.message);
    }

    // Mark ready AFTER group lookup is done
    isReady = true;
    console.log('🟢  Bot is now listening for messages.\n');
});

// ─── Message Handlers ────────────────────────────────────────────────────────
async function handleMessage(msg) {
    // Wait until ready and group is found
    if (!isReady || !playgroundChatId) return;

    // Deduplicate (both 'message' and 'message_create' may fire for same msg)
    const msgId = msg.id?._serialized || msg.id?.id;
    if (!msgId || processedMessages.has(msgId)) return;
    processedMessages.add(msgId);
    if (processedMessages.size > 500) {
        const entries = [...processedMessages];
        entries.slice(0, 250).forEach((id) => processedMessages.delete(id));
    }

    // Skip bot's own replies
    if (botSentMessages.has(msgId)) return;

    // Check if message is in the Playground group
    const msgChatId = msg.from?.endsWith('@g.us') ? msg.from : msg.to;
    if (msgChatId !== playgroundChatId) return;

    // Only respond to text messages ending with "Over"
    const text = msg.body?.trim();
    if (!text) return;

    // Check if message ends with "Over" (case-insensitive)
    const endsWithOver = /\bOver\s*$/i.test(text);
    console.log(`[MSG] "${text.substring(0, 80)}" | fromMe: ${msg.fromMe} | endsWithOver: ${endsWithOver}`);

    if (!endsWithOver) return;

    // Strip "Over" from the end before sending to Gemini
    const question = text.replace(/\s*Over\s*$/i, '').trim();
    if (!question) return;

    console.log(`\n📩  [Shikhar]: ${question}`);

    try {
        const chat = await msg.getChat();
        await chat.sendStateTyping();

        const reply = await askGemini(question);
        const formattedReply = `🤖 *${BOT_NAME}:*\n\n${reply}`;

        const sentMsg = await chat.sendMessage(formattedReply);
        if (sentMsg?.id?._serialized) {
            botSentMessages.add(sentMsg.id._serialized);
        }

        console.log(`📤  [${BOT_NAME}]: ${reply.substring(0, 120)}${reply.length > 120 ? '...' : ''}\n`);
    } catch (err) {
        console.error(`[Error] ${err.message}`);
    }
}

client.on('message', handleMessage);
client.on('message_create', handleMessage);

// ─── Error Handling ──────────────────────────────────────────────────────────
client.on('auth_failure', (err) => {
    console.error('❌  Authentication failed:', err);
    process.exit(1);
});

client.on('disconnected', (reason) => {
    console.log('🔌  Disconnected:', reason);
    process.exit(0);
});

// ─── Start ───────────────────────────────────────────────────────────────────
console.log(`\n🚀  Starting ${BOT_NAME}...\n`);
client.initialize();
