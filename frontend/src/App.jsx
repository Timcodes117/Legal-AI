import { useEffect, useRef, useState } from "react";
import { askText, getBriefing, speak, transcribeAudio } from "./api.js";
import { LANGS, ui } from "./copy.js";
import SaharaWidget, { hasWidgetKey } from "./SaharaWidget.jsx";

export default function App() {
  const [language, setLanguage] = useState("en");
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const copy = ui[language];
  const widgetReady = hasWidgetKey();

  useEffect(() => {
    getBriefing(language)
      .then((data) => {
        setAnswer(data);
        setShowTranscript(false);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [language]);

  function applyAnswer(data, withTranscript) {
    setAnswer(data);
    setShowTranscript(Boolean(withTranscript && data.transcript));
    setError(data.refused ? data.message || "This request cannot be answered." : "");
  }

  async function handleWidgetTranscript(text) {
    setStatus(copy.sending);
    try {
      applyAnswer(await askText(text, language), true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
    }
  }

  async function handleTyped() {
    if (!typed.trim()) return;
    try {
      applyAnswer(await askText(typed.trim(), language), true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function startRecording(event) {
    event.preventDefault();
    if (recorderRef.current?.state === "recording") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setStatus(copy.listening);
    } catch {
      setError("Microphone permission is required for voice. You can still type.");
    }
  }

  async function stopRecording(event) {
    event.preventDefault();
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    const done = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
    await done;
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    if (!blob.size) {
      setStatus("");
      return;
    }
    setStatus(copy.sending);
    try {
      applyAnswer(await transcribeAudio(blob, language), true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
    }
  }

  async function hearAnswer() {
    if (!answer?.spoken_summary) return;
    setStatus("Generating speech…");
    try {
      const data = await speak(answer.spoken_summary, language);
      if (!data.audio_url) throw new Error("Could not generate speech.");
      setAudioUrl(data.audio_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
    }
  }

  return (
    <main className="wrap">
      <p className="eyebrow">Legal & public services</p>
      <h1>{copy.title}</h1>
      <p className="lead">
        Speak in English, Yoruba, Hausa, or a mix. Sahara turns your voice into an answer you can
        use in court.
      </p>
      <div className="banner">{answer?.disclaimer?.short || "This is information, not a lawyer."}</div>

      <section className="card">
        <label>Language</label>
        <div className="pills">
          {LANGS.map((item) => (
            <button
              key={item.id}
              className="pill"
              type="button"
              aria-pressed={item.id === language}
              onClick={() => setLanguage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        {widgetReady ? (
          <>
            <p className="status">{copy.widgetHint}</p>
            <SaharaWidget onTranscript={handleWidgetTranscript} />
          </>
        ) : (
          <div className="mic-wrap">
            <button
              id="talk"
              type="button"
              className={recording ? "live" : ""}
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              onPointerCancel={stopRecording}
            >
              {recording ? copy.listening : copy.hold}
            </button>
            <p className="status muted">
              Add VITE_INTRON_WIDGET_KEY to .env to use the official Intron widget.
            </p>
          </div>
        )}
        <p className="status">{status}</p>
        <label htmlFor="typed">{copy.typeHint}</label>
        <textarea
          id="typed"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="They gave me a court date. What are my rights?"
        />
        <div className="row">
          <button className="secondary" type="button" onClick={handleTyped}>
            {copy.send}
          </button>
          {answer?.spoken_summary ? (
            <button className="secondary" type="button" onClick={hearAnswer}>
              {copy.hear}
            </button>
          ) : null}
        </div>
        {audioUrl ? <audio src={audioUrl} controls autoPlay /> : null}
      </section>

      {error ? <p className="error">{error}</p> : null}

      {showTranscript && answer?.transcript ? (
        <section className="card">
          <label>{copy.youSaid}</label>
          <p className="transcript">{answer.transcript}</p>
        </section>
      ) : null}

      {answer?.workflow ? (
        <section className="card">
          <h2>{answer.workflow.title}</h2>
          <p>{answer.workflow.summary}</p>
          <ol>
            {answer.workflow.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {(answer?.rights || []).map((right) => (
        <article className="card right" key={right.id || right.title}>
          <h3>{right.title}</h3>
          <p>{right.plain}</p>
          <p>{right.in_practice}</p>
          <ul className="say">
            {(right.say || []).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
      ))}
    </main>
  );
}
