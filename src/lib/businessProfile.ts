// map form values into the exact profile shape
export function toBusinessProfile(form: any) {
  return {
    business_name: form.name,
    industry: form.industry,
    timezone: form.tz,
    service_area: form.serviceArea,
    hours: form.hours,
    booking_rules: form.booking,
    brand_voice: form.voice,
    faq: form.faqItems,
    escalation: form.escalation,
    compliance: { consent_script_version: form.consentVersion }
  };
}
