const jwt = require('jsonwebtoken');
const { get } = require('../config/database');

const JWT_SECRET = 'team-manager-secret-key-2024';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id, username, nickname, avatar, rank, game_id FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

module.exports = { generateToken, authMiddleware, JWT_SECRET };
