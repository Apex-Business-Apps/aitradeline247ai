import twilio from "twilio";

const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!authToken) {
  throw new Error("Missing TWILIO_AUTH_TOKEN for webhook validation");
}

export function validateTwilio(req, res, next) {
  const signature = req.headers['x-twilio-signature'];
  
  if (!signature) {
    return res.status(403).send('forbidden');
  }

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const isValid = twilio.validateRequest(authToken, signature, url, req.body);

  if (!isValid) {
    return res.status(403).send('forbidden');
  }

  next();
}