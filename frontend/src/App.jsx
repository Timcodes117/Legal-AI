import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuideProvider } from "./context/GuideContext.jsx";
import Layout from "./layout/Layout.jsx";
import About from "./pages/About.jsx";
import Home from "./pages/Home.jsx";
import Phrases from "./pages/Phrases.jsx";
import Rights from "./pages/Rights.jsx";

export default function App() {
  return (
    <GuideProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/rights" element={<Rights />} />
            <Route path="/phrases" element={<Phrases />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GuideProvider>
  );
}
