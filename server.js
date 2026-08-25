const https = require("https");

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error("Falta BOT_TOKEN");
  process.exit(1);
}

let offset = 0;

function telegram(method, data = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);

    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${TOKEN}/${method}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      res => {
        let result = "";

        res.on("data", chunk => result += chunk);
        res.on("end", () => {
          try {
            resolve(JSON.parse(result));
          } catch {
            reject(new Error("Respuesta inválida de Telegram"));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function sendMessage(chatId, text) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text
  });
}

async function startBot() {
  console.log("🤖 Bot iniciado");

  while (true) {
    try {
      const result = await telegram("getUpdates", {
        offset,
        timeout: 30
      });

      if (!result.ok) {
        console.log("Error:", result.description);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      for (const update of result.result) {
        offset = update.update_id + 1;

        const message = update.message;
        if (!message || !message.text) continue;

        const chatId = message.chat.id;
        const text = message.text.trim();

        if (text === "/start") {
          await sendMessage(
            chatId,
            "👋 ¡Hola! Soy tu bot de Telegram.\\n\\n" +
            "🤖 Bot funcionando correctamente.\\n\\n" +
            "Comandos:\\n" +
            "/start - Iniciar\\n" +
            "/help - Ayuda"
          );
        }

        else if (text === "/help") {
          await sendMessage(
            chatId,
            "📋 Comandos disponibles:\\n\\n" +
            "/start - Iniciar el bot\\n" +
            "/help - Mostrar ayuda"
          );
        }

        else {
          await sendMessage(
            chatId,
            "💬 Recibí tu mensaje:\\n\\n" + text
          );
        }
      }

    } catch (error) {
      console.log("Error:", error.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

startBot();
