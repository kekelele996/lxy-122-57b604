const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await run(
      'INSERT INTO users (id, username, password, nickname) VALUES (?, ?, ?, ?)',
      [id, username, hashedPassword, nickname || username]
    );

    const user = await get('SELECT id, username, nickname, avatar, rank, game_id FROM users WHERE id = ?', [id]);
    const token = generateToken(user);

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const { password: _, ...userInfo } = user;
    const token = generateToken(userInfo);

    res.json({ user: userInfo, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar, rank, game_id } = req.body;
    const userId = req.user.id;

    await run(
      'UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar), rank = COALESCE(?, rank), game_id = COALESCE(?, game_id) WHERE id = ?',
      [nickname, avatar, rank, game_id, userId]
    );

    const user = await get('SELECT id, username, nickname, avatar, rank, game_id FROM users WHERE id = ?', [userId]);
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ users: [] });
    }

    const users = await all(
      'SELECT id, username, nickname, avatar, rank FROM users WHERE username LIKE ? OR nickname LIKE ? LIMIT 10',
      [`%${q}%`, `%${q}%`]
    );

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '搜索用户失败' });
  }
});

module.exports = router;
