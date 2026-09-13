import { useEffect, useState } from "react";
import { PageBusy } from "../components/Activity.jsx";
import { IconChevron, RightIcon } from "../components/Icons.jsx";
import { useGuide } from "../context/GuideContext.jsx";

export default function Rights() {
  const { copy, briefing, loading } = useGuide();
  const rights = briefing?.rights || [];
  const [openId, setOpenId] = useState("");

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    setOpenId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [briefing]);

  return (
    <>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.rightsTitle}</h1>
      <p className="lead">{copy.rightsLead}</p>
      <div className="banner">{briefing?.disclaimer?.short}</div>
      {loading && !rights.length ? <PageBusy label={copy.sending} /> : null}

      <div className="simple-list">
        {rights.map((right) => {
          const open = openId === right.id;
          const say = right.say || [];
          return (
            <article className={`card fold-card${open ? " open" : ""}`} id={right.id} key={right.id}>
              <button
                type="button"
                className="fold-head"
                aria-expanded={open}
                onClick={() => setOpenId(open ? "" : right.id)}
              >
                <span className="icon-chip">
                  <RightIcon id={right.id} size={16} />
                </span>
                <span className="fold-copy">
                  <strong>{right.title}</strong>
                  <small>{say[0] || copy.tapToRead}</small>
                </span>
                <IconChevron size={18} />
              </button>
              {open ? (
                <div className="fold-body">
                  <p>{right.plain}</p>
                  {say.length ? (
                    <ul className="say">
                      {say.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
