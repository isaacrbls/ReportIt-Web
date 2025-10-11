// Google reCAPTCHA Site Key
// To get your own keys, visit: https://www.google.com/recaptcha/admin
// Make sure to add your domains (localhost, 127.0.0.1, and production domain)

// Using Google's test keys for development - REPLACE FOR PRODUCTION!
// Test keys work on all domains but ALWAYS pass (no bot protection)
// Get real keys at: https://www.google.com/recaptcha/admin

export const RECAPTCHA_SITE_KEY = 
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 
  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Google's test key (DEVELOPMENT ONLY)
