import { IconMic } from "../components/Icons.jsx";
import { useGuide } from "../context/GuideContext.jsx";

export default function Phrases() {
  const { copy, briefing } = useGuide();
  const rights = briefing?.rights || [];

  return (
    <>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.phrasesTitle}</h1>
      <p className="lead">{copy.phrasesLead}</p>
      <div className="banner">{briefing?.disclaimer?.short}</div>

      <div className="detail-grid">
        {rights.map((right) => (
          <section className="card phrase-card" key={right.id}>
            <h2>{right.title}</h2>
            <p className="card-lead">{copy.sayThis}</p>
            <ul className="phrase-list tall">
              {(right.say || []).map((line) => (
                <li key={line}>
                  <span>{line}</span>
                  <IconMic size={14} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
