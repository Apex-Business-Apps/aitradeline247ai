import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center bg-background text-foreground">
      <div className="max-w-md space-y-4">
        <p className="text-sm font-semibold tracking-widest text-muted-foreground">Page not found</p>
        <h1 className="text-3xl font-bold">We couldn't find that page</h1>
        <p className="text-muted-foreground">
          The link you followed may be broken, or the page may have been removed. Try heading back to the homepage.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
