const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

async function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", chunk => data += chunk);

    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function telegram(token, method, params = {}) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    }
  );

  return await response.json();
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      const html = fs.readFileSync(
        path.join(__dirname, "index.html"),
        "utf8"
      );

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });

      return res.end(html);
    }

    if (req.method === "POST" && req.url === "/api/bot-info") {
      const { token } = await getBody(req);

      if (!token) {
        return json(res, 400, {
          error: "Falta el token"
        });
      }

      const result = await telegram(token, "getMe");

      if (!result.ok) {
        return json(res, 401, {
          error: result.description || "Token inválido"
        });
      }

      return json(res, 200, {
        bot: result.result
      });
    }

    if (req.method === "POST" && req.url === "/api/send") {
      const { token, chatId, text } = await getBody(req);

      if (!token || !chatId || !text) {
        return json(res, 400, {
          error: "Faltan datos"
        });
      }

      const result = await telegram(token, "sendMessage", {
        chat_id: chatId,
        text: text
      });

      if (!result.ok) {
        return json(res, 400, {
          error: result.description || "Error de Telegram"
        });
      }

      return json(res, 200, {
        ok: true
      });
    }

    res.writeHead(404);
    res.end("Not found");

  } catch (error) {
    json(res, 500, {
      error: error.message
    });
  }
});

server.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});
