const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const userRoutes = require('./routes/user');
const teamRoutes = require('./routes/team');
const scheduleRoutes = require('./routes/schedule');
const matchRoutes = require('./routes/match');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/matches', matchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '战队管理系统后端服务运行正常' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});
