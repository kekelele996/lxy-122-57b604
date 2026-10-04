const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { team_id, schedule_id, opponent, our_score, opponent_score, result, summary, match_time } = req.body;
    const userId = req.user.id;

    if (!team_id || !opponent) {
      return res.status(400).json({ error: '请填写必填信息' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [team_id, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    if (member.role !== 'leader' && member.role !== 'officer') {
      return res.status(403).json({ error: '只有队长或官员可以创建比赛记录' });
    }

    const matchId = uuidv4();
    await run(
      'INSERT INTO match_records (id, team_id, schedule_id, opponent, our_score, opponent_score, result, summary, match_time, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [matchId, team_id, schedule_id || null, opponent, our_score || 0, opponent_score || 0, result || null, summary || null, match_time || null, userId]
    );

    const match = await get('SELECT * FROM match_records WHERE id = ?', [matchId]);
    res.json({ match });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建比赛记录失败' });
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

    const matches = await all(`
      SELECT m.*, u.nickname as creator_name
      FROM match_records m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.team_id = ?
      ORDER BY COALESCE(m.match_time, m.created_at) DESC
    `, [teamId]);

    res.json({ matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取比赛记录列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const match = await get('SELECT * FROM match_records WHERE id = ?', [id]);
    if (!match) {
      return res.status(404).json({ error: '比赛记录不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [match.team_id, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    const notes = await all(`
      SELECT n.*, u.username, u.nickname, u.avatar
      FROM match_notes n
      INNER JOIN users u ON n.user_id = u.id
      WHERE n.match_id = ?
      ORDER BY n.created_at ASC
    `, [id]);

    res.json({ match, notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取比赛记录详情失败' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { opponent, our_score, opponent_score, result, summary, match_time } = req.body;

    const match = await get('SELECT * FROM match_records WHERE id = ?', [id]);
    if (!match) {
      return res.status(404).json({ error: '比赛记录不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [match.team_id, userId, 'approved']);
    if (!member || (member.role !== 'leader' && member.role !== 'officer' && match.created_by !== userId)) {
      return res.status(403).json({ error: '无权限编辑此比赛记录' });
    }

    await run(
      'UPDATE match_records SET opponent = COALESCE(?, opponent), our_score = COALESCE(?, our_score), opponent_score = COALESCE(?, opponent_score), result = ?, summary = ?, match_time = ? WHERE id = ?',
      [opponent, our_score, opponent_score, result || null, summary || null, match_time || null, id]
    );

    const updatedMatch = await get('SELECT * FROM match_records WHERE id = ?', [id]);
    res.json({ match: updatedMatch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新比赛记录失败' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const match = await get('SELECT * FROM match_records WHERE id = ?', [id]);
    if (!match) {
      return res.status(404).json({ error: '比赛记录不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [match.team_id, userId, 'approved']);
    if (!member || (member.role !== 'leader' && member.role !== 'officer' && match.created_by !== userId)) {
      return res.status(403).json({ error: '无权限删除此比赛记录' });
    }

    await run('DELETE FROM match_notes WHERE match_id = ?', [id]);
    await run('DELETE FROM match_records WHERE id = ?', [id]);

    res.json({ message: '比赛记录已删除' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除比赛记录失败' });
  }
});

router.post('/:id/notes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '笔记内容不能为空' });
    }

    const match = await get('SELECT * FROM match_records WHERE id = ?', [id]);
    if (!match) {
      return res.status(404).json({ error: '比赛记录不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [match.team_id, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    const noteId = uuidv4();
    await run(
      'INSERT INTO match_notes (id, match_id, user_id, content) VALUES (?, ?, ?, ?)',
      [noteId, id, userId, content]
    );

    const note = await get(`
      SELECT n.*, u.username, u.nickname, u.avatar
      FROM match_notes n
      INNER JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `, [noteId]);

    res.json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '添加笔记失败' });
  }
});

router.get('/:teamId/stats', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [teamId, userId, 'approved']);
    if (!member) {
      return res.status(403).json({ error: '你不是该战队成员' });
    }

    const stats = await get(`
      SELECT
        COUNT(*) as total_matches,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
        SUM(our_score) as total_our_score,
        SUM(opponent_score) as total_opponent_score
      FROM match_records
      WHERE team_id = ?
    `, [teamId]);

    const winRate = stats.total_matches > 0 ? Math.round((stats.wins / stats.total_matches) * 100) : 0;

    res.json({
      ...stats,
      win_rate: winRate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取战队统计失败' });
  }
});

module.exports = router;
