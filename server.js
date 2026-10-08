import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");

if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. /api/chat will return an error until it is configured.");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-6-luna"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) return res.status(400).json({ error: "messages wajib diisi." });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY belum dikonfigurasi di server." });

    const safeMessages = messages.slice(-30).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 20000)
    }));

    const stream = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions:
        "You are Gladiator AI, a helpful assistant. The user interface has a Roman gladiator theme, " +
        "but answer naturally and accurately in the user's language. Do not roleplay excessively unless asked.",
      input: safeMessages,
      stream: true
    });

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) res.flushHeaders();

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        res.write(`data: ${JSON.stringify({ text: event.delta })}\n\n`);
      } else if (event.type === "error") {
        res.write(`data: ${JSON.stringify({ error: event.error?.message || "AI error" })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error(err);
    const message = err?.message || "Gagal menghubungi AI.";
    if (!res.headersSent) res.status(500).json({ error: message });
    else { res.write(`data: ${JSON.stringify({ error: message })}\n\n`); res.end(); }
  }
});

app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, "0.0.0.0", () => console.log(`Gladiator AI running on port ${port}`));
