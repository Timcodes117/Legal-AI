import { IconInfo, IconWarn } from "../components/Icons.jsx";
import { useGuide } from "../context/GuideContext.jsx";

export default function About() {
  const { copy, briefing } = useGuide();
  const lawyer = briefing?.disclaimer?.when_to_see_lawyer || "";

  return (
    <>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.aboutTitle}</h1>
      <p className="lead">{copy.aboutLead}</p>

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
