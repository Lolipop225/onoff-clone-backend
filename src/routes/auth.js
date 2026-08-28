const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, genId } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email et password requis' });
  }

  const existing = [...users.values()].find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'Ce compte existe déjà' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = genId();
  const user = { id, email, passwordHash, createdAt: new Date().toISOString() };
  users.set(id, user);

  const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: { id, email } });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = [...users.values()].find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

// Middleware réutilisable pour protéger les routes
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token manquant' });
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

module.exports = { router, requireAuth };
