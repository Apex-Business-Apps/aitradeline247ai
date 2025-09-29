export default function FAQ() {
  const faqs = [
    {
      q: "How does the AI receptionist work?",
      a: "Our AI receptionist answers calls using advanced natural language processing, follows your custom scripts, and can route calls to you when needed."
    },
    {
      q: "Can I customize the greeting and responses?",
      a: "Yes, you can fully customize greetings, responses, and call flows to match your business needs."
    },
    {
      q: "What happens if the AI can't handle a call?",
      a: "The system can transfer calls to you or take detailed messages based on your preferences."
    },
    {
      q: "Do I get transcripts of all calls?",
      a: "Yes, you receive email transcripts of every call within minutes of completion."
    },
    {
      q: "Is there a setup fee?",
      a: "No setup fees. You can start with our free tier and upgrade as needed."
    },
    {
      q: "How quickly can I get started?",
      a: "Setup takes just minutes. You'll be ready to receive calls right away."
    }
  ];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">{faq.q}</h3>
            <p className="text-gray-700">{faq.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}