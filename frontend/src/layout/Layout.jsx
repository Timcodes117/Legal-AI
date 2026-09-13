import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  IconChat,
  IconClose,
  IconGlobe,
  IconHome,
  IconInfo,
  IconMenu,
  IconScales,
  IconShield,
  IconWave,
} from "../components/Icons.jsx";
import { LANGS } from "../copy.js";
import { useGuide } from "../context/GuideContext.jsx";

const NAV = [
  { to: "/", end: true, key: "home", icon: IconHome },
  { to: "/rights", end: false, key: "rightsNav", icon: IconShield },
  { to: "/phrases", end: false, key: "phrasesNav", icon: IconChat },
  { to: "/about", end: false, key: "aboutNav", icon: IconInfo },
];

export default function Layout() {
  const { copy, language, setLanguage, recording, status } = useGuide();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="shell">
      <div className={`sidebar-backdrop${open ? " show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <IconScales size={18} />
          </span>
          <div>
            <strong>{copy.brand}</strong>
            <small>{copy.brandTag}</small>
          </div>
        </div>

        <nav className="side-nav" onClick={() => setOpen(false)}>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-item">
                <Icon size={16} />
                <span>{copy[item.key]}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="side-foot">
          <label className="lang-label" htmlFor="lang-select">
            <IconGlobe size={15} />
            {copy.language}
          </label>
          <select
            id="lang-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            {LANGS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="lang-hint">{copy.languageHint}</p>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button className="menu-btn" type="button" onClick={() => setOpen(true)} aria-label="Open menu">
            <IconMenu />
          </button>
          <div className="top-status">
            <span className={`dot${recording ? " live" : ""}`} />
            <span>{recording ? copy.listening : copy.saharaReady}</span>
            <IconWave size={16} />
          </div>
        </header>
        <div className="page">
          <Outlet />
        </div>
        {status ? <p className="sr-status">{status}</p> : null}
      </div>
    </div>
  );
}
