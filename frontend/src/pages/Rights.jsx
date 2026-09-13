import { useEffect } from "react";
import { RightIcon } from "../components/Icons.jsx";
import { useGuide } from "../context/GuideContext.jsx";

export default function Rights() {
  const { copy, briefing } = useGuide();
  const rights = briefing?.rights || [];

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [briefing]);

  return (
    <>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.rightsTitle}</h1>
      <p className="lead">{copy.rightsLead}</p>
      <div className="banner">{briefing?.disclaimer?.short}</div>

      <div className="detail-grid">
        {rights.map((right) => (
          <article className="card right-card" id={right.id} key={right.id}>
            <div className="right-head">
              <span className="icon-chip">
                <RightIcon id={right.id} size={16} />
              </span>
              <h2>{right.title}</h2>
            </div>
            <p>{right.plain}</p>
            {right.in_practice ? (
              <p className="practice">
                <strong>{copy.inPractice}</strong> {right.in_practice}
              </p>
            ) : null}
            <ul className="say">
              {(right.say || []).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </>
  );
}
