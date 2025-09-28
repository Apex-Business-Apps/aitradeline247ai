export function payHandler(req, res) {
  console.log("Payment endpoint called - PCI mode active, no sensitive data logged");
  
  // Do not log PAN data. TwiML instructs Twilio to capture payment securely.
  const connector = process.env.TWILIO_PAY_CONNECTOR || "stripe";
  const pciMode = process.env.PCI_MODE === "true";
  const chargeAmount = req.query.amount || "20.00";
  const currency = req.query.currency || "USD";
  
  console.log(`Payment request: connector=${connector}, amount=${chargeAmount}, currency=${currency}, pci_mode=${pciMode}`);
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">To reserve your booking, you can pay securely now.</Say>
  <Pay chargeAmount="${chargeAmount}" paymentConnector="${connector}" currency="${currency}" />
  <Say voice="alice">Thank you for your payment. Your booking is confirmed.</Say>
</Response>`;

  res.type("text/xml").send(twiml);
}