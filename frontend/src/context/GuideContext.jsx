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
  const [playing, setPlaying] = useState(false);
  const [needTapPlay, setNeedTapPlay] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
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
        setPlaying(false);
        setNeedTapPlay(false);
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

  function clearAudio() {
    setAudioUrl("");
    setPlaying(false);
    setNeedTapPlay(false);
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  function applyAnswer(data, withTranscript) {
    clearAudio();
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
    const audio = audioRef.current;
    if (!text || busy || !audio) return;
    setError("");
    setNeedTapPlay(false);
    setPlaying(false);
    setStatus(copy.hearBusy);
    setBusy(true);
    try {
      audio.muted = true;
      try {
        await audio.play();
      } catch {
        /* keep the tap as a playback gesture before Sahara returns */
      }
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;

      const data = await speak(text, language);
      if (!data.audio_url) throw new Error("Could not generate speech.");
      audio.src = data.audio_url;
      setAudioUrl(data.audio_url);
      audio.load();
      await new Promise((resolve) => {
        const done = () => {
          audio.removeEventListener("canplay", done);
          resolve();
        };
        audio.addEventListener("canplay", done);
        window.setTimeout(done, 2000);
      });
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setNeedTapPlay(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
      setBusy(false);
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onPlay = () => setPlaying(true);
    const onEnded = () => setPlaying(false);
    const onPause = () => {
      if (audio.paused) setPlaying(false);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
    };
  }, [showTranscript]);

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
      audioRef,
      playing,
      needTapPlay,
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
      playing,
      needTapPlay,
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
