export function gbmWebhook(req, res) {
  console.log("GBM webhook called with headers:", req.headers);
  
  // Security: Validate shared secret
  if (req.headers["x-shared-secret"] !== process.env.GBM_SHARED_SECRET) {
    console.warn("GBM webhook: Invalid or missing shared secret");
    return res.status(403).send("forbidden");
  }
  
  console.log("GBM message received:", {
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Implement GBM message processing logic
  // This stub handles basic webhook verification and logging
  
  res.status(200).send("ok");
}