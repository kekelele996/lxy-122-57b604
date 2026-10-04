const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    if (!name) {
      return res.status(400).json({ error: '战队名称不能为空' });
    }

    const existingTeam = await get('SELECT id FROM teams WHERE name = ?', [name]);
    if (existingTeam) {
      return res.status(400).json({ error: '战队名称已存在' });
    }

    const teamId = uuidv4();
    const leaderId = req.user.id;

    await run(
      'INSERT INTO teams (id, name, description, logo, leader_id) VALUES (?, ?, ?, ?, ?)',
      [teamId, name, description || '', logo || '', leaderId]
    );

    const memberId = uuidv4();
    await run(
      'INSERT INTO team_members (id, team_id, user_id, role, position, status) VALUES (?, ?, ?, ?, ?, ?)',
      [memberId, teamId, leaderId, 'leader', '队长', 'approved']
    );

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    res.json({ team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建战队失败' });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const teams = await all(`
      SELECT t.*, tm.role, tm.position, tm.status as member_status
      FROM teams t
      INNER JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.status = 'approved'
      ORDER BY t.created_at DESC
    `, [userId]);

    res.json({ teams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取战队列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: '战队不存在' });
    }

    const members = await all(`
      SELECT u.id, u.username, u.nickname, u.avatar, u.rank, tm.role, tm.position, tm.status, tm.joined_at
      FROM team_members tm
      INNER JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.role = 'leader' DESC, tm.joined_at ASC
    `, [teamId]);

    const rankDistribution = {};
    members.filter(m => m.status === 'approved').forEach(m => {
      const rank = m.rank || '未定级';
      rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
    });

    const pendingInvitations = await all(`
      SELECT i.*, u.username as inviter_name, u.nickname as inviter_nickname
      FROM invitations i
      INNER JOIN users u ON i.inviter_id = u.id
      WHERE i.team_id = ? AND i.status = 'pending'
    `, [teamId]);

    res.json({ team, members, rankDistribution, pendingInvitations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取战队详情失败' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    const { name, description, logo } = req.body;

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: '战队不存在' });
    }

    if (team.leader_id !== userId) {
      return res.status(403).json({ error: '只有队长可以修改战队信息' });
    }

    if (name && name !== team.name) {
      const existingTeam = await get('SELECT id FROM teams WHERE name = ? AND id != ?', [name, teamId]);
      if (existingTeam) {
        return res.status(400).json({ error: '战队名称已存在' });
      }
    }

    await run(
      'UPDATE teams SET name = COALESCE(?, name), description = COALESCE(?, description), logo = COALESCE(?, logo) WHERE id = ?',
      [name, description, logo, teamId]
    );

    const updatedTeam = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    res.json({ team: updatedTeam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新战队信息失败' });
  }
});

router.post('/:id/invite', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: '请输入用户名' });
    }

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: '战队不存在' });
    }

    const member = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [teamId, userId, 'approved']);
    if (!member || (member.role !== 'leader' && member.role !== 'officer')) {
      return res.status(403).json({ error: '只有队长或官员可以邀请成员' });
    }

    const invitee = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!invitee) {
      return res.status(400).json({ error: '用户不存在' });
    }

    if (invitee.id === userId) {
      return res.status(400).json({ error: '不能邀请自己' });
    }

    const existingMember = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, invitee.id]);
    if (existingMember) {
      if (existingMember.status === 'approved') {
        return res.status(400).json({ error: '该用户已是战队成员' });
      } else if (existingMember.status === 'pending') {
        return res.status(400).json({ error: '该用户的加入申请正在审核中' });
      }
    }

    const existingInvitation = await get('SELECT * FROM invitations WHERE team_id = ? AND invitee_username = ? AND status = ?', [teamId, username, 'pending']);
    if (existingInvitation) {
      return res.status(400).json({ error: '已向该用户发送过邀请' });
    }

    const invitationId = uuidv4();
    await run(
      'INSERT INTO invitations (id, team_id, inviter_id, invitee_username) VALUES (?, ?, ?, ?)',
      [invitationId, teamId, userId, username]
    );

    res.json({ message: '邀请已发送' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '发送邀请失败' });
  }
});

router.get('/invitations/pending', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await get('SELECT username FROM users WHERE id = ?', [userId]);

    const invitations = await all(`
      SELECT i.*, t.name as team_name, t.logo as team_logo, u.username as inviter_name, u.nickname as inviter_nickname
      FROM invitations i
      INNER JOIN teams t ON i.team_id = t.id
      INNER JOIN users u ON i.inviter_id = u.id
      WHERE i.invitee_username = ? AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `, [user.username]);

    res.json({ invitations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取邀请列表失败' });
  }
});

router.post('/invitations/:id/accept', authMiddleware, async (req, res) => {
  try {
    const invitationId = req.params.id;
    const userId = req.user.id;
    const user = await get('SELECT username FROM users WHERE id = ?', [userId]);

    const invitation = await get('SELECT * FROM invitations WHERE id = ? AND status = ?', [invitationId, 'pending']);
    if (!invitation) {
      return res.status(404).json({ error: '邀请不存在或已处理' });
    }

    if (invitation.invitee_username !== user.username) {
      return res.status(403).json({ error: '无权处理此邀请' });
    }

    const existingMember = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [invitation.team_id, userId]);
    if (existingMember && existingMember.status === 'approved') {
      await run('UPDATE invitations SET status = ? WHERE id = ?', ['rejected', invitationId]);
      return res.status(400).json({ error: '你已是该战队成员' });
    }

    if (existingMember) {
      await run('UPDATE team_members SET status = ? WHERE id = ?', ['approved', existingMember.id]);
    } else {
      const memberId = uuidv4();
      await run(
        'INSERT INTO team_members (id, team_id, user_id, role, position, status) VALUES (?, ?, ?, ?, ?, ?)',
        [memberId, invitation.team_id, userId, 'member', null, 'approved']
      );
    }

    await run('UPDATE invitations SET status = ? WHERE id = ?', ['accepted', invitationId]);
    res.json({ message: '已加入战队' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '接受邀请失败' });
  }
});

router.post('/invitations/:id/reject', authMiddleware, async (req, res) => {
  try {
    const invitationId = req.params.id;
    const userId = req.user.id;
    const user = await get('SELECT username FROM users WHERE id = ?', [userId]);

    const invitation = await get('SELECT * FROM invitations WHERE id = ? AND status = ?', [invitationId, 'pending']);
    if (!invitation) {
      return res.status(404).json({ error: '邀请不存在或已处理' });
    }

    if (invitation.invitee_username !== user.username) {
      return res.status(403).json({ error: '无权处理此邀请' });
    }

    await run('UPDATE invitations SET status = ? WHERE id = ?', ['rejected', invitationId]);
    res.json({ message: '已拒绝邀请' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '拒绝邀请失败' });
  }
});

router.put('/:teamId/members/:userId', authMiddleware, async (req, res) => {
  try {
    const { teamId, userId: memberUserId } = req.params;
    const currentUserId = req.user.id;
    const { role, position } = req.body;

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: '战队不存在' });
    }

    const currentMember = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [teamId, currentUserId, 'approved']);
    if (!currentMember || currentMember.role !== 'leader') {
      return res.status(403).json({ error: '只有队长可以设置成员角色' });
    }

    await run(
      'UPDATE team_members SET role = COALESCE(?, role), position = COALESCE(?, position) WHERE team_id = ? AND user_id = ?',
      [role, position, teamId, memberUserId]
    );

    res.json({ message: '成员信息已更新' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新成员信息失败' });
  }
});

router.delete('/:teamId/members/:userId', authMiddleware, async (req, res) => {
  try {
    const { teamId, userId: memberUserId } = req.params;
    const currentUserId = req.user.id;

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: '战队不存在' });
    }

    const currentMember = await get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?', [teamId, currentUserId, 'approved']);
    if (!currentMember || (currentMember.role !== 'leader' && currentUserId !== memberUserId)) {
      return res.status(403).json({ error: '无权限执行此操作' });
    }

    if (team.leader_id === memberUserId) {
      return res.status(400).json({ error: '队长不能退出战队，请先转让队长' });
    }

    await run('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, memberUserId]);
    res.json({ message: '已移除成员' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '移除成员失败' });
  }
});

module.exports = router;
