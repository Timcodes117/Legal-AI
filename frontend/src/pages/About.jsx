import { useEffect } from "react";
import { PageBusy } from "../components/Activity.jsx";
import { IconInfo, IconWarn } from "../components/Icons.jsx";
import { useGuide } from "../context/GuideContext.jsx";

export default function About() {
  const { copy, briefing, loading } = useGuide();
  const lawyer = briefing?.disclaimer?.when_to_see_lawyer || "";

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [briefing]);

  return (
    <>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.aboutTitle}</h1>
      <p className="lead">{copy.aboutLead}</p>
      {loading && !briefing ? <PageBusy label={copy.sending} /> : null}

      {briefing?.workflow ? (
        <section className="card" id="expect">
          <h2>{copy.expectTitle}</h2>
          <p className="card-lead">{copy.expectOne}</p>
          <ol className="expect-list">
            {briefing.workflow.steps.slice(0, 3).map((step, index) => {
              const split = step.indexOf(":");
              const title = split === -1 ? step : step.slice(0, split);
              const body = split === -1 ? "" : step.slice(split + 1).trim();
              return (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>
                    <strong>{title}</strong>
                    {body ? ` ${body}` : null}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="card">
        <div className="right-head">
          <span className="icon-chip">
            <IconInfo size={16} />
          </span>
          <h2>{copy.howTitle}</h2>
        </div>
        <ol className="expect-list">
          {copy.howSteps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <div className="banner tight">
          <IconWarn size={16} />
          <span>{briefing?.disclaimer?.short}</span>
        </div>
        {lawyer ? (
          <>
            <h2>{copy.seeLawyer}</h2>
            <ul className="lawyer-list">
              {lawyer.split(";").map((item) => (
                <li key={item}>{item.trim()}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </>
  );
}
