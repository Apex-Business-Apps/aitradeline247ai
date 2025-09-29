import LeadForm from "../ui/LeadForm";
export default function Contact(){
  return (
    <main className="p-8">
      <h2>Contact</h2>
      <LeadForm />
      <p className="mt-6 text-sm">By submitting, you agree to our <a href="/privacy">Privacy</a> and <a href="/terms">Terms</a>.</p>
    </main>
  );
}