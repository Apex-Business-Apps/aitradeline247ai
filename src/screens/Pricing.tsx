export default function Pricing() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Pricing</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="p-6 border rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-4">Starter</h3>
          <div className="text-3xl font-bold mb-4">$0<span className="text-sm">/month</span></div>
          <ul className="text-left space-y-2 mb-6">
            <li>• 50 minutes included</li>
            <li>• Basic call handling</li>
            <li>• Email transcripts</li>
          </ul>
          <button className="w-full py-2 px-4 bg-blue-600 text-white rounded">Get Started</button>
        </div>
        <div className="p-6 border-2 border-blue-600 rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-4">Growth</h3>
          <div className="text-3xl font-bold mb-4">$49<span className="text-sm">/month</span></div>
          <ul className="text-left space-y-2 mb-6">
            <li>• 500 minutes included</li>
            <li>• Advanced routing</li>
            <li>• CRM integration</li>
            <li>• Priority support</li>
          </ul>
          <button className="w-full py-2 px-4 bg-blue-600 text-white rounded">Get Started</button>
        </div>
        <div className="p-6 border rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-4">Enterprise</h3>
          <div className="text-3xl font-bold mb-4">Custom</div>
          <ul className="text-left space-y-2 mb-6">
            <li>• Unlimited minutes</li>
            <li>• White-label solution</li>
            <li>• Custom integrations</li>
            <li>• Dedicated support</li>
          </ul>
          <button className="w-full py-2 px-4 bg-blue-600 text-white rounded">Contact Sales</button>
        </div>
      </div>
    </main>
  );
}