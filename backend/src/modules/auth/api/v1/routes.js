import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet } from '#@/core/database';
import { authenticateToken, JWT_SECRET } from '#@/core/middleware/auth';

const router = Router();

// Access codes for privileged roles
const ACCESS_CODES = {
  'Admin': 'ADMIN2026',
  'Super Admin': 'SUPER2026'
};

// Register user
router.post('/register', async (req, res) => {
  const { name, email, password, role, organization, accessCode } = req.body;

  if (!name || !email || !password || !role || !organization) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const validRoles = ['Employee', 'Admin', 'Super Admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  if (role === 'Admin' || role === 'Super Admin') {
    const requiredCode = ACCESS_CODES[role];
    if (accessCode !== requiredCode) {
      return res.status(403).json({ error: `Invalid access code for the role of ${role}.` });
    }
  }

  try {
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await dbRun(
      'INSERT INTO users (name, email, password_hash, role, organization) VALUES (?, ?, ?, ?, ?)',
      [name, email.toLowerCase(), passwordHash, role, organization]
    );

    res.status(214).json({
      message: 'Registration successful!',
      user: {
        id: result.id,
        name,
        email: email.toLowerCase(),
        role,
        organization
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Internal server error occurred during registration.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error occurred during login.' });
  }
});

// Verify current user
router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;
