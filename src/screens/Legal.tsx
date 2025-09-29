export default function Legal({ kind }: { kind: "privacy" | "terms" }) {
  if (kind === "privacy") {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">Information Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at info@tradeline247ai.com.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
          <p>By accessing and using TradeLine 24/7 services, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">Service Description</h2>
          <p>TradeLine 24/7 provides AI-powered receptionist services for businesses, including call handling, message taking, and call routing.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
          <p>TradeLine 24/7 shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
          <p>For questions about these Terms of Service, please contact us at info@tradeline247ai.com.</p>
        </section>
      </div>
    </main>
  );
}