import { Outlet } from "react-router-dom";
import officialLogo from '@/assets/official-logo.svg';

export default function RootLayout(){
  return (
    <div className="min-h-full flex flex-col">
      <header className="px-6 py-4 border-b">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <img src={officialLogo} alt="TradeLine 24/7" className="h-8" />
          <span className="sr-only">TradeLine 24/7</span>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="px-6 py-8 border-t text-sm">
        <div className="max-w-6xl mx-auto opacity-70">
          Apex Business Systems • Edmonton, Alberta • Built Canadian
        </div>
      </footer>
    </div>
  );
}