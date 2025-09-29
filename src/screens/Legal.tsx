export default function Legal({ kind }: { kind: "privacy"|"terms" }){
  return (
    <main className="p-8">
      <h2>{kind === "privacy" ? "Privacy Policy" : "Terms of Service"}</h2>
      <p>We collect call details and messages to deliver the service and improve reliability. See consent disclosures on calls.</p>
    </main>
  );
}