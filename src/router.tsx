import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./screens/Home";
import Features from "./screens/Features";
import Pricing from "./screens/Pricing";
import FAQ from "./screens/FAQ";
import Contact from "./screens/Contact";
import Legal from "./screens/Legal";
import NotFound from "./screens/NotFound";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <header className="p-4 flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/features">Features</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/contact">Contact</Link>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="p-6 text-sm opacity-75">
        <a href="/privacy">Privacy</a> • <a href="/terms">Terms</a> • Apex Business Systems • Edmonton, Alberta • Built Canadian
      </footer>
    </BrowserRouter>
  );
}