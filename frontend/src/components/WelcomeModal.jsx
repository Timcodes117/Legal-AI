import { LANGS, welcome } from "../copy.js";
import { useGuide } from "../context/GuideContext.jsx";
import { IconScales } from "./Icons.jsx";

export default function WelcomeModal() {
  const { welcomeOpen, chooseLanguage } = useGuide();
  if (!welcomeOpen) return null;

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <span className="brand-mark">
          <IconScales size={18} />
        </span>
        <h1 id="welcome-title">
          {welcome.titles.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className="welcome-lead">
          {welcome.leads.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <div className="welcome-langs">
          {LANGS.map((item) => (
            <button key={item.id} type="button" onClick={() => chooseLanguage(item.id)}>
              <strong>{item.native}</strong>
              <small>{item.label}</small>
            </button>
          ))}
        </div>
        <p className="welcome-later">{welcome.later}</p>
      </div>
    </div>
  );
}
