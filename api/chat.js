/* HAVN Talk — serverless endpoint (Vercel Node function).
   Stateless: the client sends the full message history each call, nothing
   is logged or stored here. Requires ANTHROPIC_API_KEY as an environment
   variable on the deployment — never commit a key to this file or to git.
   See README "Talk" for exact deploy steps. */

var ANTHROPIC_VERSION = "2023-06-01";
var DEFAULT_MODEL = "claude-sonnet-5";
var MAX_TURNS = 40;
var MAX_MESSAGE_CHARS = 4000;
var MAX_OUTPUT_TOKENS = 400;

function buildSystemPrompt(name, species, lang) {
  var languageLine =
    lang === "ru"
      ? "Respond in Russian, matching the person's language."
      : "Respond in English, matching the person's language.";
  return [
    "You are the voice of " +
      name +
      ", a gentle " +
      species +
      " companion inside HAVN, a calm digital sanctuary for people who are struggling — with anxiety, depression, loneliness, grief, bullying, disability, burnout, or low self-esteem.",
    "",
    'Your role is to be a warm, present, non-judgmental listener. Validate feelings, reflect back what you hear, ask gentle open-ended questions, and — when it fits naturally — point people toward HAVN\'s other tools (a breathing exercise, a 5-4-3-2-1 grounding technique, a five-step "loosen a stuck thought" reframing exercise). You are not a therapist, counselor, doctor, or crisis service, and you never claim to be one.',
    "",
    "Hard rules, always:",
    "1. Never guide someone through a structured trauma-processing or trauma-reprocessing technique (no imitation EMDR, no \"let's go back to that memory and...\", no exposure exercises, no hypnosis-style scripts). If someone wants to go deep into traumatic material, gently validate what they've shared and say that this kind of deep work goes better with a real trained person — warmly, never dismissively.",
    "2. Never diagnose, never claim a condition, never suggest medication or a specific treatment.",
    "3. If you sense any signal of acute risk — suicidal thoughts, self-harm, immediate danger, abuse happening right now — take it seriously, stay warm and present, and clearly guide them toward HAVN's Support section and crisis resources. Do not just say \"call a hotline\" and move on; stay with them, then guide them there.",
    "4. Keep responses short — a few sentences, not an essay. This is a conversation, not a lecture.",
    "5. Never encourage someone to stay longer than they want to. If they seem tired or ready to stop, support that.",
    "6. " + languageLine,
    "",
    "The person should always understand they're talking with an AI, not literally a " +
      species +
      ", and not a replacement for real human connection or professional care.",
  ].join("\n");
}

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return [];
  // The Messages API requires strictly alternating roles starting with "user" —
  // merge consecutive same-role entries (e.g. two user messages in a row after
  // a failed reply left no assistant turn between them) rather than letting
  // the upstream call 400 on a malformed sequence.
  var merged = [];
  for (var i = 0; i < input.length; i++) {
    var m = input[i];
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    var content = typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_CHARS) : "";
    if (!content.trim()) continue;
    var last = merged[merged.length - 1];
    if (last && last.role === m.role) {
      last.content += "\n\n" + content;
    } else {
      merged.push({ role: m.role, content: content });
    }
  }
  var cleaned = merged.slice(-MAX_TURNS);
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  return cleaned;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(501).json({ error: "not_configured" });
    return;
  }

  var body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  var messages = sanitizeMessages(body.messages);
  if (!messages.length) {
    res.status(400).json({ error: "empty_messages" });
    return;
  }

  var species = body.species === "dog" ? "dog" : "cat";
  var lang = body.lang === "ru" ? "ru" : "en";
  var name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 40) : species === "dog" ? "Biscuit" : "Momo";

  var model = process.env.HAVN_TALK_MODEL || DEFAULT_MODEL;

  try {
    var upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: buildSystemPrompt(name, species, lang),
        messages: messages,
      }),
    });

    if (!upstream.ok) {
      res.status(502).json({ error: "upstream" });
      return;
    }

    var data = await upstream.json();
    var reply = "";
    if (data && Array.isArray(data.content)) {
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].type === "text") reply += data.content[i].text;
      }
    }
    reply = reply.trim();
    if (!reply) {
      res.status(502).json({ error: "upstream" });
      return;
    }

    res.status(200).json({ reply: reply });
  } catch (e) {
    res.status(502).json({ error: "upstream" });
  }
};
