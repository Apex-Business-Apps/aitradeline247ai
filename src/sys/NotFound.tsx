import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 py-16 text-center text-white">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">404</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">We couldn&apos;t find that page.</h1>
        <p className="text-base text-slate-300">
          The link might be broken or the page may have moved. Let&apos;s get you back to the dashboard.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-5 py-3 text-base font-medium text-white shadow transition hover:bg-sky-400"
        >
          Return home
        </Link>
        <Link to="/contact" className="text-sm text-slate-300 underline underline-offset-4 hover:text-white">
          Contact support
        </Link>
      </div>
    </div>
  );
}
