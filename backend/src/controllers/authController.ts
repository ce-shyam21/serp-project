// src/controllers/authController.ts
// Handles register and login logic

import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../db/pool';
import {
  AuthRequest,
  RegisterBody,
  LoginBody,
  UserRow,
  ApiResponse,
} from '../types';

// ── POST /api/auth/register ──────────────────────────────────────
export async function register(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { username, password } = req.body as RegisterBody;

  // Basic validation
  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Username and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    // Check if username already taken
    const existing = await queryOne<UserRow>(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing) {
      res.status(409).json({ success: false, error: 'Username already taken' });
      return;
    }

    // Hash password + insert user
    const password_hash = await bcrypt.hash(password, 10);

    await query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, password_hash]
    );

    res.status(201).json({ success: true, message: 'User created' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// ── POST /api/auth/login ─────────────────────────────────────────
export async function login(
  req: AuthRequest,
  res: Response<ApiResponse<{ token: string; user: { id: string; username: string } }>>
): Promise<void> {
  const { username, password } = req.body as LoginBody;

  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Username and password are required' });
    return;
  }

  try {
    // Find user
    const user = await queryOne<UserRow>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Update last_login timestamp
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}