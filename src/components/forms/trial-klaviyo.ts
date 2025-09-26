// Attach to the trial form to Identify + Track on submit
import { identifyUser, trackEvent } from "../../lib/klaviyo";

export function wireTrialForm() {
  const root = document.querySelector("#start-trial-hero");
  const form = root?.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", () => {
    const name = (form.querySelector('input[name="name"]') as HTMLInputElement)?.value || "";
    const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value || "";
    const phone = (form.querySelector('input[name="phone"]') as HTMLInputElement)?.value || "";
    const company = (form.querySelector('input[name="company"]') as HTMLInputElement)?.value || "";

    // Identify user
    identifyUser({ $email: email, $first_name: name, phone, company });

    // Track a lead event (for flows/segments)
    trackEvent("Lead Submitted", {
      source: "Start Trial",
      path: location.pathname,
    });
  }, { once: true });
}