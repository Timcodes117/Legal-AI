import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { askText, getBriefing, speak, transcribeAudio } from "../api.js";
import { ui } from "../copy.js";

const GuideContext = createContext(null);

export function GuideProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [briefing, setBriefing] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const copy = ui[language];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBriefing(language)
      .then((data) => {
        if (cancelled) return;
        setBriefing(data);
        setAnswer(data);
        setShowTranscript(false);
        setError("");
        setAudioUrl("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  function applyAnswer(data, withTranscript) {
    setAnswer(data);
    setShowTranscript(Boolean(withTranscript && data.transcript));
    setError(data.refused ? data.message || "This request cannot be answered." : "");
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
    const text = answer?.spoken_summary;
    if (!text) return;
    setStatus("Generating speech…");
    try {
      const data = await speak(text, language);
      if (!data.audio_url) throw new Error("Could not generate speech.");
      setAudioUrl(data.audio_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
    }
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      copy,
      typed,
      setTyped,
      status,
      error,
      briefing,
      answer,
      showTranscript,
      audioUrl,
      recording,
      loading,
      handleTyped,
      startRecording,
      stopRecording,
      hearAnswer,
    }),
    [
      language,
      copy,
      typed,
      status,
      error,
      briefing,
      answer,
      showTranscript,
      audioUrl,
      recording,
      loading,
    ]
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used inside GuideProvider");
  return ctx;
}
