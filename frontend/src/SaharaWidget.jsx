import { useEffect, useRef } from "react";
import { loadIntronTranscribeWidget } from "@intron_health/intron_transcriber_streaming";

const widgetKey = import.meta.env.VITE_INTRON_WIDGET_KEY || "";

export function hasWidgetKey() {
  return Boolean(widgetKey) && widgetKey !== "paste_your_widget_key_here";
}

export default function SaharaWidget({ onTranscript }) {
  const hostRef = useRef(null);
  const started = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    if (!hasWidgetKey() || !hostRef.current || started.current) return;
    started.current = true;
    loadIntronTranscribeWidget(hostRef.current, widgetKey, {
      writeStreamOnlyInSpecifiedTextbox: "transcription-target",
      showPostProcessingCategory: "legal",
    });

    const onFinal = (event) => {
      const text = event.detail?.transcript_text || "";
      if (text) onTranscriptRef.current(text);
    };
    document.addEventListener("intronInferEventTranscriptResult", onFinal);
    return () => {
      document.removeEventListener("intronInferEventTranscriptResult", onFinal);
    };
  }, []);

  if (!hasWidgetKey()) return null;

  return (
    <div className="widget-slot">
      <div ref={hostRef} id="transcription-widget" />
      <textarea id="transcription-target" className="widget-transcript" readOnly rows={3} />
    </div>
  );
}
