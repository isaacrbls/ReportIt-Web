
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token provided' });

  const secret = "6Le5EqYrAAAAAJQPHeByI4hYOSGI0eHCz7ED4COU";
  const verifyUrl = `https:

  try {
    const response = await fetch(verifyUrl, { method: 'POST' });
    const data = await response.json();
    if (!data.success) {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'CAPTCHA verification error' });
  }
}
