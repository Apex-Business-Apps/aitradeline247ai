export default function TrustPanel() {
  // Fetch retention_policies and status (mock if API not ready)
  return (
    <section aria-labelledby="trust-title" className="space-y-4">
      <h2 id="trust-title" className="text-lg font-medium">Trust & Compliance</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <h3 className="font-semibold">Data Retention</h3>
          <p className="text-sm opacity-80">Recordings: 30d · Transcripts: 90d · Email logs: 180d</p>
        </div>
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <h3 className="font-semibold">Audit Log</h3>
          <p className="text-sm opacity-80">Admin-only viewer available.</p>
          <a className="text-sm underline" href="/internal/audit/recent">Open</a>
        </div>
        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <h3 className="font-semibold">System Status</h3>
          <a className="text-sm underline" href="/status">View status</a>
        </div>
      </div>
    </section>
  );
}