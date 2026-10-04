const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { team_id, title, type, start_time, end_time, opponent, location, description } = req.body;
    const userId = req.user.id;

    if (!team_id || !title || !type || !start_time) {
      return res.status(400).json({ error: '请填写必填信息' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [team_id, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    if (member.role !== 'leader' && member.role !== 'officer') {
      return res.status(403).json({ error: '只有队长或官员可以创建日程' });
    }

    const scheduleId = uuidv4();
    await run(
      'INSERT INTO schedules (id, team_id, title, type, start_time, end_time, opponent, location, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [scheduleId, team_id, title, type, start_time, end_time || null, opponent || null, location || null, description || null, userId]
    );

    const schedule = await get('SELECT * FROM schedules WHERE id = ?', [scheduleId]);
    res.json({ schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建日程失败' });
  }
});

router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [teamId, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    const schedules = await all(`
      SELECT s.*, u.nickname as creator_name
      FROM schedules s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.team_id = ?
      ORDER BY s.start_time DESC
    `, [teamId]);

    res.json({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取日程列表失败' });
  }
});

router.get('/my/upcoming', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const schedules = await all(`
      SELECT s.*, t.name as team_name, t.logo as team_logo, u.nickname as creator_name
      FROM schedules s
      INNER JOIN teams t ON s.team_id = t.id
      INNER JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE tm.user_id = ? AND tm.status = 'approved' AND s.start_time >= datetime('now')
      ORDER BY s.start_time ASC
      LIMIT 10
    `, [userId]);

    res.json({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取近期日程失败' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const schedule = await get('SELECT * FROM schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({ error: '日程不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [schedule.team_id, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    const attendance = await all(`
      SELECT sa.*, u.username, u.nickname, u.avatar
      FROM schedule_attendance sa
      INNER JOIN users u ON sa.user_id = u.id
      WHERE sa.schedule_id = ?
    `, [id]);

    const myAttendance = attendance.find(a => a.user_id === userId);

    res.json({ schedule, attendance, myAttendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取日程详情失败' });
  }
});

router.post('/:id/attendance', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, reason } = req.body;

    if (!status || !['attend', 'absent', 'pending'].includes(status)) {
      return res.status(400).json({ error: '无效的出勤状态' });
    }

    const schedule = await get('SELECT * FROM schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({ error: '日程不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [schedule.team_id, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    const existing = await get('SELECT * FROM schedule_attendance WHERE schedule_id = ? AND user_id = ?', [id, userId]);
    if (existing) {
      await run(
        'UPDATE schedule_attendance SET status = ?, reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, reason || null, existing.id]
      );
    } else {
      const attendanceId = uuidv4();
      await run(
        'INSERT INTO schedule_attendance (id, schedule_id, user_id, status, reason) VALUES (?, ?, ?, ?, ?)',
        [attendanceId, id, userId, status, reason || null]
      );
    }

    res.json({ message: '出勤状态已更新' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新出勤状态失败' });
  }
});

router.get('/:teamId/attendance/stats', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [teamId, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    const stats = await all(`
      SELECT
        u.id,
        u.username,
        u.nickname,
        u.avatar,
        COUNT(DISTINCT s.id) as total_schedules,
        SUM(CASE WHEN sa.status = 'attend' THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN sa.status = 'pending' OR sa.status IS NULL THEN 1 ELSE 0 END) as pending
      FROM users u
      INNER JOIN team_members tm ON u.id = tm.user_id
      CROSS JOIN schedules s ON s.team_id = tm.team_id
      LEFT JOIN schedule_attendance sa ON sa.schedule_id = s.id AND sa.user_id = u.id
      WHERE tm.team_id = ? AND tm.status = 'approved'
      GROUP BY u.id
      ORDER BY attended DESC
    `, [teamId]);

    const statsWithRate = stats.map(s => ({
      ...s,
      attendance_rate: s.total_schedules > 0 ? Math.round((s.attended / s.total_schedules) * 100) : 0
    }));

    res.json({ stats: statsWithRate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取出勤统计失败' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, type, start_time, end_time, opponent, location, description } = req.body;

    const schedule = await get('SELECT * FROM schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({ error: '日程不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [schedule.team_id, userId, 'approved']);
    if (!member || (member.role !== 'leader' && member.role !== 'officer' && schedule.created_by !== userId)) {
      return res.status(403).json({ error: '无权限编辑此日程' });
    }

    await run(
      'UPDATE schedules SET title = COALESCE(?, title), type = COALESCE(?, type), start_time = COALESCE(?, start_time), end_time = ?, opponent = ?, location = ?, description = ? WHERE id = ?',
      [title, type, start_time, end_time || null, opponent || null, location || null, description || null, id]
    );

    const updatedSchedule = await get('SELECT * FROM schedules WHERE id = ?', [id]);
    res.json({ schedule: updatedSchedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新日程失败' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const schedule = await get('SELECT * FROM schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({ error: '日程不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [schedule.team_id, userId, 'approved']);
    if (!member || (member.role !== 'leader' && member.role !== 'officer' && schedule.created_by !== userId)) {
      return res.status(403).json({ error: '无权限删除此日程' });
    }

    await run('DELETE FROM schedule_attendance WHERE schedule_id = ?', [id]);
    await run('DELETE FROM schedules WHERE id = ?', [id]);

    res.json({ message: '日程已删除' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除日程失败' });
  }
});

module.exports = router;
