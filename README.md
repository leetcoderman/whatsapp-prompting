# 🤖 WhatsApp Personal Bot

> A WhatsApp-based AI assistant powered by **Google Gemini 3.1 Pro** that lives inside a WhatsApp group and responds to your prompts in real-time.

---

## 🎯 What It Does

**Personal Bot** connects to your WhatsApp via a linked device session and monitors a group called **"Playground"**. When you send a message ending with the keyword `Over`, the bot:

1. Strips the trigger word
2. Sends your prompt to **Google Gemini 3.1 Pro**
3. Replies in the group as 🤖 **Personal Bot**

The `Over` keyword prevents infinite loops — since the bot's replies never contain it, only your deliberate prompts trigger responses.

---

## 📸 How It Looks

```
You:            What is quantum computing Over
🤖 Personal Bot: Quantum computing uses qubits that can exist in
                 superposition, enabling parallel computation...
```

---

## 🏗️ Architecture

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│  iPhone WhatsApp │───────▶│  bot.js (Node.js)     │───────▶│  Google Gemini   │
│  "Playground"    │◀───────│  whatsapp-web.js      │◀───────│  3.1 Pro API     │
│  group chat      │  reply │  on your Mac          │  AI    │                 │
└─────────────────┘        └──────────────────────┘        └─────────────────┘
```

- **whatsapp-web.js** — Mirrors WhatsApp Web via Puppeteer. Authenticates by scanning a QR code (just like linking a new device). Uses `LocalAuth` for persistent sessions.
- **@google/genai** — Official Google Generative AI SDK for Node.js.
- **Trigger System** — Only messages ending with `Over` are processed, preventing bot reply loops.

---

## ⚡ Quick Start

### Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **Gemini API Key** — [Get one free](https://aistudio.google.com/apikey)
- **WhatsApp Group** — Create a group named exactly **"Playground"**

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/whatsapp-prompting.git
cd whatsapp-prompting

# 2. Install dependencies
npm install

# 3. Configure your API key
cp .env.example .env
# Edit .env and paste your Gemini API key

# 4. Start the bot
npm start
```

### First Run — Link WhatsApp

1. A **QR code** appears in the terminal
2. On iPhone: **WhatsApp → Settings → Linked Devices → Link a Device**
3. Scan the QR code
4. Wait for `✅ Connected to "Playground" group!`
5. You only scan once — sessions persist across restarts

---

## 💬 Usage

| You type in Playground group | Bot does |
|---|---|
| `Explain Docker in simple terms Over` | ✅ Sends to Gemini, replies with answer |
| `What's 2+2?` | ❌ Ignored (no `Over` keyword) |
| `Hello everyone!` | ❌ Ignored (no `Over` keyword) |
| `Write me a poem about rain Over` | ✅ Generates and replies with a poem |

### Features

- 🧠 **Conversation Memory** — Remembers last 20 messages for context
- ⌨️ **Typing Indicator** — Shows "typing…" while generating
- 🔒 **Group-Only** — Only responds in the Playground group
- 🔄 **Loop-Safe** — `Over` trigger prevents infinite reply chains
- 💾 **Persistent Session** — Scan QR once, auto-reconnects on restart

---

## 📁 Project Structure

```
whatsapp-prompting/
├── bot.js            # Main bot — WhatsApp client + Gemini integration
├── .env              # Your API key (git-ignored)
├── .env.example      # Template for .env
├── .gitignore        # Ignores secrets, node_modules, session data
├── package.json      # Dependencies and start script
└── README.md         # This file
```

---

## 🔧 Configuration

All config lives at the top of `bot.js`:

| Variable | Default | Description |
|---|---|---|
| `BOT_NAME` | `'Personal Bot'` | Name shown in replies |
| `GROUP_NAME` | `'Playground'` | WhatsApp group to monitor |
| `MODEL` | `'gemini-3.1-pro-preview'` | Gemini model to use |
| `MAX_HISTORY` | `20` | Messages remembered per conversation |

---

## 🛠️ Troubleshooting

| Issue | Fix |
|---|---|
| QR code not appearing | Delete `.wwebjs_auth/` and restart |
| `GEMINI_API_KEY is missing` | Check `.env` file has your key |
| `Group not found` | Ensure group is named exactly "Playground" |
| Bot not replying | Make sure message ends with `Over` |
| Session expired | Delete `.wwebjs_auth/` folder, restart, re-scan QR |

---

## ⚠️ Disclaimer

This project uses [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), an unofficial WhatsApp Web API. WhatsApp does not officially support automation on personal numbers. Use responsibly and avoid bulk messaging.

---

## 📄 License

ISC

---

## 🙏 Built With

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) — WhatsApp Web API for Node.js
- [@google/genai](https://www.npmjs.com/package/@google/genai) — Google Generative AI SDK
- [qrcode-terminal](https://www.npmjs.com/package/qrcode-terminal) — Terminal QR code generator
