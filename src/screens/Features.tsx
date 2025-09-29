export default function Features() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Features</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">24/7 Availability</h3>
          <p>Never miss another call. Your AI receptionist works around the clock to capture leads and handle inquiries.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Smart Call Routing</h3>
          <p>Intelligent call forwarding based on your business rules and availability.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Instant Transcripts</h3>
          <p>Get email transcripts of every call immediately after it ends.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Bilingual Support</h3>
          <p>Handle calls in both English and French with automatic language detection.</p>
        </div>
      </div>
    </main>
  );
}