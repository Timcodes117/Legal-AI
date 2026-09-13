import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { askText, getBriefing, speak, transcribeAudio } from "../api.js";
import { LANGS, ui } from "../copy.js";

const LANG_KEY = "sahara-language";

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.some((item) => item.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return null;
}

const GuideContext = createContext(null);

export function GuideProvider({ children }) {
  const savedLanguage = readSavedLanguage();
  const [language, setLanguageState] = useState(savedLanguage || "en");
  const [welcomeOpen, setWelcomeOpen] = useState(savedLanguage === null);

  function setLanguage(next) {
    setLanguageState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function chooseLanguage(next) {
    setLanguage(next);
    setWelcomeOpen(false);
  }
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [briefing, setBriefing] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const copy = ui[language];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBusy(true);
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
        if (!cancelled) {
          setLoading(false);
          setBusy(false);
        }
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
    if (!typed.trim() || busy) return;
    setError("");
    setStatus(copy.sending);
    setBusy(true);
    try {
      applyAnswer(await askText(typed.trim(), language), true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
      setBusy(false);
    }
  }

  function pickRecorderType() {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return types.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type));
  }

  async function startRecording(event) {
    event.preventDefault();
    if (busy || recorderRef.current?.state === "recording") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mimeType = pickRecorderType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.start(250);
      recorderRef.current = recorder;
      event.currentTarget?.setPointerCapture?.(event.pointerId);
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
    if (event.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const done = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    setRecording(false);
    await done;
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    if (!blob.size) {
      setStatus("");
      setError("No audio was captured. Hold the button, speak, then release.");
      return;
    }
    setStatus(copy.sending);
    setBusy(true);
    try {
      applyAnswer(await transcribeAudio(blob, language), true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
      setBusy(false);
    }
  }

  async function hearAnswer() {
    const text = answer?.spoken_summary;
    if (!text || busy) return;
    setStatus("Generating speech…");
    setBusy(true);
    try {
      const data = await speak(text, language);
      if (!data.audio_url) throw new Error("Could not generate speech.");
      setAudioUrl(data.audio_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
      setBusy(false);
    }
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      welcomeOpen,
      chooseLanguage,
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
      busy,
      handleTyped,
      startRecording,
      stopRecording,
      hearAnswer,
    }),
    [
      language,
      welcomeOpen,
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
      busy,
    ]
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used inside GuideProvider");
  return ctx;
}
