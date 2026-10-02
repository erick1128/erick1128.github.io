// Friday's brain. Runs on Vercel as a serverless function at /api/friday.
// The website sends the chat here; this file adds Erick's context and asks Claude.
// Your API key lives in Vercel's settings (ANTHROPIC_API_KEY), never in the website code.

const CONTEXT = require("./_friday-context.js");

const MODEL = process.env.FRIDAY_MODEL || "claude-haiku-4-5"; // fast and cheap; change in Vercel settings anytime
const MAX_TOKENS = 400;          // keeps answers short and cheap
const MAX_MESSAGES = 12;         // only the last 12 messages are sent
const MAX_CHARS = 600;           // longest message a visitor can send
const LIMIT_PER_HOUR = 30;       // messages per visitor per hour (best effort)
const ALLOWED = (process.env.ALLOWED_ORIGINS ||
  "https://erickordonez.com,https://www.erickordonez.com").split(",").map((s) => s.trim());

const hits = new Map();

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  const originOk = !origin || ALLOWED.includes(origin) || origin.endsWith(".vercel.app");
  if (originOk && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!originOk) return res.status(403).json({ error: "Not allowed." });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "Friday is offline." });

  // Simple per visitor limit. Your real safety net is the monthly spend limit in the Anthropic Console.
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  if (recent.length >= LIMIT_PER_HOUR) {
    return res.status(429).json({ error: "Friday needs a break, please slow down. You can email Erick at eordonezantuna@hotmail.com." });
  }
  recent.push(now);
  hits.set(ip, recent);

  // Clean up what the browser sent.
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  let messages = Array.isArray(body && body.messages) ? body.messages : [];
  messages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Send a message first." });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: CONTEXT, messages }),
    });
    if (!r.ok) {
      console.error("Anthropic error", r.status, await r.text());
      return res.status(502).json({ error: "Friday is offline." });
    }
    const data = await r.json();
    const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return res.status(200).json({ reply: reply || "Sorry, I didn't catch that. Could you ask again?" });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "Friday is offline." });
  }
};
