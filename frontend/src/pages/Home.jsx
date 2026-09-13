import { Link } from "react-router-dom";
import { ButtonSpinner } from "../components/Activity.jsx";
import Courthouse from "../components/Courthouse.jsx";
import {
  IconCalendar,
  IconChevron,
  IconMic,
  IconSend,
  IconShield,
  IconWarn,
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
    busy,
    showTranscript,
    audioUrl,
    handleTyped,
    startRecording,
    stopRecording,
    hearAnswer,
  } = useGuide();

  const asked = Boolean(showTranscript && answer?.transcript);

  return (
    <>
      <section className="card ask-card talk-first">
        <div className="talk-top">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="lead tight">{copy.askLead}</p>
          </div>
          <div className="hero-art compact" aria-hidden="true">
            <Courthouse />
          </div>
        </div>
        <div className="banner">
          <IconWarn size={16} />
          <span>{briefing?.disclaimer?.short || "This is information, not a lawyer."}</span>
        </div>

        <div className="ask-grid">
          <div className="ask-voice">
            <button
              type="button"
              className={`mic-btn${recording ? " live" : ""}${busy ? " busy" : ""}`}
              disabled={busy}
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerCancel={stopRecording}
            >
              {busy ? <ButtonSpinner light size={28} /> : <IconMic size={36} />}
            </button>
            <strong>{busy ? copy.sending : recording ? copy.release : copy.hold}</strong>
            <small>{busy ? copy.sending : recording ? copy.listening : copy.ready}</small>
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
                disabled={busy}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={copy.typePlaceholder}
              />
              <button type="submit" aria-label={copy.send} disabled={busy}>
                {busy ? <ButtonSpinner light size={16} /> : <IconSend size={16} />}
              </button>
            </div>
            <p className="type-note">{copy.typeInstead}</p>
          </form>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      {asked ? (
        <section className="card answer-card">
          <label>{copy.youSaid}</label>
          <p className="transcript">{answer.transcript}</p>
          {answer.spoken_summary ? <p className="spoken">{answer.spoken_summary}</p> : null}
          {answer.grounded_error ? <p className="error">{answer.grounded_error}</p> : null}
          {answer.spoken_summary ? (
            <button className="ghost-btn" type="button" onClick={hearAnswer} disabled={busy}>
              {busy ? <ButtonSpinner size={16} /> : null}
              {copy.hear}
            </button>
          ) : null}
          {audioUrl ? <audio src={audioUrl} controls autoPlay /> : null}
          {(answer.rights || []).some((right) => (right.say || []).length) ? (
            <div className="answer-next">
              <h3>{copy.sayThis}</h3>
              <ul className="say">
                {(answer.rights || []).flatMap((right) => (right.say || []).slice(0, 1)).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link className="see-more inline" to="/rights">
                {copy.rightsTitle} <IconChevron size={16} />
              </Link>
            </div>
          ) : null}
          {answer.workflow?.steps?.length ? (
            <div className="answer-next">
              <h3>{copy.expectToday}</h3>
              <ol className="expect-list tight">
                {answer.workflow.steps.slice(0, 3).map((step) => {
                  const title = step.includes(":") ? step.slice(0, step.indexOf(":")) : step;
                  return <li key={step}>{title}</li>;
                })}
              </ol>
              <Link className="see-more inline" to="/about#expect">
                {copy.seeMore} <IconChevron size={16} />
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="triad compact">
        <Link className="card teaser" to="/about#expect">
          <span className="icon-chip">
            <IconCalendar size={16} />
          </span>
          <div>
            <h2>{copy.expectTitle}</h2>
            <p>{copy.expectOne}</p>
          </div>
          <span className="see-more">
            {copy.seeMore} <IconChevron size={16} />
          </span>
        </Link>
        <Link className="card teaser" to="/rights">
          <span className="icon-chip">
            <IconShield size={16} />
          </span>
          <div>
            <h2>{copy.rightsTitle}</h2>
            <p>{copy.rightsOne}</p>
          </div>
          <span className="see-more">
            {copy.seeMore} <IconChevron size={16} />
          </span>
        </Link>
        <Link className="card teaser" to="/phrases">
          <span className="icon-chip">
            <IconMic size={16} />
          </span>
          <div>
            <h2>{copy.phrasesTitle}</h2>
            <p>{copy.phrasesOne}</p>
          </div>
          <span className="see-more">
            {copy.seeMore} <IconChevron size={16} />
          </span>
        </Link>
      </div>
    </>
  );
}
