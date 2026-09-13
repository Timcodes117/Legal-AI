import { useState } from "react";
import { PageBusy } from "../components/Activity.jsx";
import { IconChevron, IconMic } from "../components/Icons.jsx";
import { useGuide } from "../context/GuideContext.jsx";

export default function Phrases() {
  const { copy, briefing, loading } = useGuide();
  const rights = briefing?.rights || [];
  const [openId, setOpenId] = useState("");

  return (
    <>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.phrasesTitle}</h1>
      <p className="lead">{copy.phrasesLead}</p>
      <div className="banner">{briefing?.disclaimer?.short}</div>
      {loading && !rights.length ? <PageBusy label={copy.sending} /> : null}

      <div className="simple-list">
        {rights.map((right) => {
          const say = right.say || [];
          const extra = say.slice(1);
          const open = openId === right.id;
          if (!say[0]) return null;
          return (
            <section className={`card fold-card${open ? " open" : ""}`} key={right.id}>
              <div className="phrase-main">
                <IconMic size={16} />
                <p>{say[0]}</p>
              </div>
              {extra.length ? (
                <>
                  <button
                    type="button"
                    className="fold-more"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? "" : right.id)}
                  >
                    <span>{open ? copy.hideDetail : copy.morePhrases}</span>
                    <IconChevron size={16} />
                  </button>
                  {open ? (
                    <ul className="phrase-list tall">
                      {extra.map((line) => (
                        <li key={line}>
                          <span>{line}</span>
                          <IconMic size={14} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}
