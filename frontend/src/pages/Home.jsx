import { Link } from "react-router-dom";
import Courthouse from "../components/Courthouse.jsx";
import {
  IconCalendar,
  IconChevron,
  IconLeaf,
  IconMic,
  IconPhone,
  IconSend,
  IconWarn,
  RightIcon,
} from "../components/Icons.jsx";
import { useGuide } from "../context/GuideContext.jsx";

export default function Home() {
  const {
    copy,
    briefing,
    answer,
    typed,
    setTyped,
    status,
    error,
    recording,
    showTranscript,
    audioUrl,
    loading,
    handleTyped,
    startRecording,
    stopRecording,
    hearAnswer,
  } = useGuide();

  const workflow = briefing?.workflow;
  const rights = briefing?.rights || [];
  const phrases = rights.flatMap((right) => right.say || []).slice(0, 5);
  const asked = Boolean(showTranscript && answer?.transcript);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
          <div className="banner">
            <IconWarn size={16} />
            <span>{briefing?.disclaimer?.short || "This is information, not a lawyer."}</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Courthouse />
        </div>
      </section>

      <section className="card ask-card">
        <div className="ask-head">
          <h2>{copy.askTitle}</h2>
          <p>{copy.askLead}</p>
        </div>
        <div className="ask-grid">
          <div className="ask-voice">
            <button
              type="button"
              className={`mic-btn${recording ? " live" : ""}`}
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              onPointerCancel={stopRecording}
            >
              <IconMic size={28} />
            </button>
            <strong>{recording ? copy.release : copy.hold}</strong>
            <small>{recording ? copy.listening : copy.release}</small>
          </div>
          <div className="ask-or">or</div>
          <form
            className="ask-type"
            onSubmit={(event) => {
              event.preventDefault();
              handleTyped();
            }}
          >
            <label htmlFor="typed">{copy.typeHint}</label>
            <div className="type-row">
              <input
                id="typed"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={copy.typePlaceholder}
              />
              <button type="submit" aria-label={copy.send}>
                <IconSend size={16} />
              </button>
            </div>
            <p className="type-note">{copy.typeInstead}</p>
          </form>
        </div>
        <div className="ask-foot">
          <span>
            <i className={`dot${recording ? " live" : ""}`} />
            {status || copy.ready}
          </span>
          <span>{copy.saharaReady}</span>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      {asked ? (
        <section className="card answer-card">
          <label>{copy.youSaid}</label>
          <p className="transcript">{answer.transcript}</p>
          {answer.spoken_summary ? (
            <button className="ghost-btn" type="button" onClick={hearAnswer}>
              {copy.hear}
            </button>
          ) : null}
          {audioUrl ? <audio src={audioUrl} controls autoPlay /> : null}
          {answer.workflow ? (
            <ol className="expect-list tight">
              {answer.workflow.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
          {(answer.rights || []).map((right) => (
            <article className="right-block" key={right.id || right.title}>
              <h3>{right.title}</h3>
              <p>{right.plain}</p>
            </article>
          ))}
        </section>
      ) : null}

      <div className="triad">
        <section className="card stack-card">
          <h2>{copy.expectTitle}</h2>
          <div className="expect-box">
            <span className="icon-chip">
              <IconCalendar size={16} />
            </span>
            <div>
              <strong>{copy.expectToday}</strong>
              <p>{workflow?.summary}</p>
            </div>
          </div>
          {loading ? (
            <p className="muted">{copy.ready}</p>
          ) : (
            <ol className="expect-list">
              {(workflow?.steps || []).slice(0, 5).map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          )}
          <Link className="soft-row" to="/about">
            <IconPhone size={16} />
            <span>{copy.phoneNote}</span>
            <IconChevron size={16} />
          </Link>
        </section>

        <section className="card stack-card">
          <h2>{copy.rightsTitle}</h2>
          <p className="card-lead">{copy.rightsLead}</p>
          <ul className="link-list">
            {rights.slice(0, 4).map((right) => (
              <li key={right.id}>
                <Link to={`/rights#${right.id}`}>
                  <span className="icon-chip">
                    <RightIcon id={right.id} size={15} />
                  </span>
                  <span>
                    <strong>{right.title}</strong>
                    <small>{right.plain}</small>
                  </span>
                  <IconChevron size={16} />
                </Link>
              </li>
            ))}
          </ul>
          <Link className="see-all" to="/rights">
            {copy.seeAll}
          </Link>
        </section>

        <section className="card stack-card">
          <h2>{copy.phrasesTitle}</h2>
          <p className="card-lead">{copy.phrasesLead}</p>
          <ul className="phrase-list">
            {phrases.map((line) => (
              <li key={line}>
                <span>{line}</span>
                <IconMic size={14} />
              </li>
            ))}
          </ul>
          <Link className="soft-row" to="/phrases">
            <IconLeaf size={16} />
            <span>{copy.seeAll}</span>
            <IconChevron size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
