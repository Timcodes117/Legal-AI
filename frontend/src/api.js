const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data;
}

export function getBriefing(language) {
  return fetch(apiUrl(`/api/briefing?language=${language}`)).then(readJson);
}

export function askText(text, language) {
  return fetch(apiUrl("/api/ask"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  }).then(readJson);
}

export function transcribeAudio(blob, language) {
  const form = new FormData();
  const ext = (blob.type || "").includes("mp4") ? "m4a" : "webm";
  form.append("language", language);
  form.append("audio", blob, `clip.${ext}`);
  return fetch(apiUrl("/api/transcribe"), { method: "POST", body: form }).then(readJson);
}

export function speak(text, language) {
  return fetch(apiUrl("/api/speak"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  }).then(readJson);
}
