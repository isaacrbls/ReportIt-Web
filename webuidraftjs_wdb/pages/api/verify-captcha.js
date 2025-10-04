
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'No token provided' });

  const secret = "6Le5EqYrAAAAAJQPHeByI4hYOSGI0eHCz7ED4COU";
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

  try {
    const response = await fetch(verifyUrl, { method: 'POST' });
    const data = await response.json();
    
    if (!data.success) {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
    
    // Also verify via Django backend if available
    try {
      const djangoResponse = await fetch('http://127.0.0.1:8000/api/auth/verify-captcha/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (djangoResponse.ok) {
        console.log('✅ CAPTCHA also verified via Django backend');
      }
    } catch (djangoError) {
      console.warn('⚠️ Django CAPTCHA verification failed, but proceeding with main verification');
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'CAPTCHA verification error' });
  }
}
