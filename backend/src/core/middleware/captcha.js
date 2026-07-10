import { dbGet } from '#@/core/database.js';

export async function verifyCaptcha(req, res, next) {
  const { email, recaptchaToken, captchaV2Response } = req.body;
  
  // Track failed attempts from the database for this email
  let userAttempts = 0;
  if (email) {
    try {
      const user = await dbGet('SELECT login_attempts FROM users WHERE email = ?', [email.toLowerCase()]);
      if (user) {
        userAttempts = user.login_attempts || 0;
      }
    } catch (err) {
      console.error('Failed to query user attempts for captcha:', err.message);
    }
  }

  // Check if reCAPTCHA secret key is configured in env
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    // Dev-fallback: auto-approve verification but print diagnostic log
    console.log(`[CAPTCHA Dev-Fallback] Bypassing check. attempts: ${userAttempts}`);
    return next();
  }

  // After 3 failed attempts, we expect the V2 Checkbox fallback token
  const token = userAttempts >= 3 ? captchaV2Response : recaptchaToken;
  if (!token) {
    return res.status(400).json({ error: 'CAPTCHA verification token is missing. Please solve the security check.' });
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`
    });
    const data = await response.json();
    if (!data.success) {
      return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'CAPTCHA verification request failed: ' + err.message });
  }
}
