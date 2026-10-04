<template>
  <div class="matches-page">
    <div class="page-header">
      <h2>比赛记录</h2>
      <div class="header-actions">
        <el-select v-model="selectedTeamId" placeholder="选择战队" style="width: 200px; margin-right: 12px">
          <el-option
            v-for="team in myTeams"
            :key="team.id"
            :label="team.name"
            :value="team.id"
          />
        </el-select>
        <el-button type="primary" @click="showCreateMatch = true" :disabled="!selectedTeamId">
          <el-icon><Plus /></el-icon>
          添加记录
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" v-if="selectedTeamId">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon win">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ teamStats?.wins || 0 }}</div>
            <div class="stat-label">胜场</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon lose">
            <el-icon><Close /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ teamStats?.losses || 0 }}</div>
            <div class="stat-label">败场</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon rate">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ teamStats?.win_rate || 0 }}%</div>
            <div class="stat-label">胜率</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20" v-if="selectedTeamId">
      <el-col :span="16">
        <div class="panel">
          <div class="panel-header">
            <h3>比赛列表</h3>
          </div>
          <div v-if="matches.length === 0" class="empty-state">
            <el-empty description="暂无比赛记录" />
          </div>
          <div v-else class="match-list">
            <div
              v-for="match in matches"
              :key="match.id"
              class="match-card"
              @click="showMatchDetail(match)"
            >
              <div class="match-result" :class="match.result">
                {{ match.result === 'win' ? '胜' : match.result === 'lose' ? '负' : '平' }}
              </div>
              <div class="match-content">
                <div class="match-teams">
                  <span class="our-team">{{ currentTeamName }}</span>
                  <span class="score">
                    <span :class="{ win: match.result === 'win' }">{{ match.our_score }}</span>
                    :
                    <span :class="{ win: match.result === 'lose' }">{{ match.opponent_score }}</span>
                  </span>
                  <span class="opponent">{{ match.opponent }}</span>
                </div>
                <div class="match-meta">
                  <span class="time">
                    <el-icon><Clock /></el-icon>
                    {{ formatDateTime(match.match_time || match.created_at) }}
                  </span>
                </div>
                <div v-if="match.summary" class="match-summary">
                  {{ match.summary }}
                </div>
              </div>
              <el-icon class="arrow"><Right /></el-icon>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="panel">
          <div class="panel-header">
            <h3>近期表现</h3>
          </div>
          <div class="recent-form">
            <div
              v-for="(match, index) in matches.slice(0, 5)"
              :key="index"
              class="form-item"
              :class="match.result"
            >
              {{ match.result === 'win' ? 'W' : match.result === 'lose' ? 'L' : 'D' }}
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-empty v-else description="请先加入或创建一个战队" class="empty" />
  </div>

  <el-dialog v-model="showCreateMatch" title="添加比赛记录" width="500px">
    <el-form :model="matchForm" label-width="80px">
      <el-form-item label="对手">
        <el-input v-model="matchForm.opponent" placeholder="请输入对手战队名称" />
      </el-form-item>
      <el-form-item label="我方比分">
        <el-input-number v-model="matchForm.our_score" :min="0" />
      </el-form-item>
      <el-form-item label="对手比分">
        <el-input-number v-model="matchForm.opponent_score" :min="0" />
      </el-form-item>
      <el-form-item label="比赛结果">
        <el-radio-group v-model="matchForm.result">
          <el-radio value="win">胜利</el-radio>
          <el-radio value="lose">失败</el-radio>
          <el-radio value="draw">平局</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="比赛时间">
        <el-date-picker
          v-model="matchForm.match_time"
          type="datetime"
          placeholder="选择比赛时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="赛后总结">
        <el-input
          v-model="matchForm.summary"
          type="textarea"
          :rows="4"
          placeholder="请输入赛后总结"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showCreateMatch = false">取消</el-button>
      <el-button type="primary" :loading="creating" @click="handleCreateMatch">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showDetail" title="比赛详情" width="700px">
    <div v-if="currentMatch" class="match-detail">
      <div class="detail-score">
        <div class="team-side">
          <div class="team-name">{{ currentTeamName }}</div>
          <div class="score" :class="{ win: currentMatch.result === 'win' }">
            {{ currentMatch.our_score }}
          </div>
        </div>
        <div class="vs">VS</div>
        <div class="team-side">
          <div class="team-name">{{ currentMatch.opponent }}</div>
          <div class="score" :class="{ win: currentMatch.result === 'lose' }">
            {{ currentMatch.opponent_score }}
          </div>
        </div>
      </div>

      <div class="detail-result" :class="currentMatch.result">
        {{ currentMatch.result === 'win' ? '胜利' : currentMatch.result === 'lose' ? '失败' : '平局' }}
      </div>

      <div class="detail-info">
        <div class="info-row">
          <span class="label">比赛时间</span>
          <span>{{ formatDateTime(currentMatch.match_time || currentMatch.created_at) }}</span>
        </div>
        <div class="info-row" v-if="currentMatch.summary">
          <span class="label">赛后总结</span>
          <p>{{ currentMatch.summary }}</p>
        </div>
      </div>

      <div class="notes-section">
        <div class="section-header">
          <h4>复盘笔记</h4>
        </div>
        <div class="add-note">
          <el-input
            v-model="newNote"
            type="textarea"
            :rows="3"
            placeholder="分享你的复盘心得..."
          />
          <el-button type="primary" style="margin-top: 12px" @click="handleAddNote">
            发布
          </el-button>
        </div>
        <div v-if="matchNotes.length === 0" class="no-notes">
          暂无复盘笔记，快来分享你的想法吧
        </div>
        <div v-else class="notes-list">
          <div v-for="note in matchNotes" :key="note.id" class="note-item">
            <el-avatar :size="36" :src="note.avatar">
              {{ note.nickname?.charAt(0) || note.username?.charAt(0) }}
            </el-avatar>
            <div class="note-content">
              <div class="note-header">
                <span class="author">{{ note.nickname || note.username }}</span>
                <span class="time">{{ formatDateTime(note.created_at) }}</span>
              </div>
              <div class="note-text">{{ note.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="showDetail = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyTeams } from '../api/team'
import {
  getTeamMatches,
  createMatch,
  getMatchDetail,
  addMatchNote,
  getTeamStats
} from '../api/match'
import { Plus, Trophy, Close, DataLine, Clock, Right } from '@element-plus/icons-vue'

const myTeams = ref([])
const selectedTeamId = ref('')
const matches = ref([])
const teamStats = ref(null)
const showCreateMatch = ref(false)
const showDetail = ref(false)
const creating = ref(false)
const currentMatch = ref(null)
const matchNotes = ref([])
const newNote = ref('')

const currentTeamName = computed(() => {
  const team = myTeams.value.find(t => t.id === selectedTeamId.value)
  return team?.name || '我们'
})

const matchForm = reactive({
  opponent: '',
  our_score: 0,
  opponent_score: 0,
  result: 'win',
  match_time: '',
  summary: ''
})

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchMyTeams = async () => {
  try {
    const res = await getMyTeams()
    myTeams.value = res.teams
    if (res.teams.length > 0 && !selectedTeamId.value) {
      selectedTeamId.value = res.teams[0].id
    }
  } catch (err) {
    console.error(err)
  }
}

const fetchMatches = async () => {
  if (!selectedTeamId.value) return
  try {
    const res = await getTeamMatches(selectedTeamId.value)
    matches.value = res.matches
  } catch (err) {
    console.error(err)
  }
}

const fetchStats = async () => {
  if (!selectedTeamId.value) return
  try {
    const res = await getTeamStats(selectedTeamId.value)
    teamStats.value = res
  } catch (err) {
    console.error(err)
  }
}

const handleCreateMatch = async () => {
  if (!matchForm.opponent.trim()) {
    ElMessage.warning('请输入对手名称')
    return
  }
  try {
    creating.value = true
    await createMatch({
      ...matchForm,
      team_id: selectedTeamId.value
    })
    ElMessage.success('比赛记录已添加')
    showCreateMatch.value = false
    resetMatchForm()
    fetchMatches()
    fetchStats()
  } catch (err) {
    console.error(err)
  } finally {
    creating.value = false
  }
}

const resetMatchForm = () => {
  matchForm.opponent = ''
  matchForm.our_score = 0
  matchForm.opponent_score = 0
  matchForm.result = 'win'
  matchForm.match_time = ''
  matchForm.summary = ''
}

const showMatchDetail = async (match) => {
  try {
    const res = await getMatchDetail(match.id)
    currentMatch.value = res.match
    matchNotes.value = res.notes
    showDetail.value = true
  } catch (err) {
    console.error(err)
  }
}

const handleAddNote = async () => {
  if (!newNote.value.trim()) {
    ElMessage.warning('请输入笔记内容')
    return
  }
  try {
    await addMatchNote(currentMatch.value.id, newNote.value)
    ElMessage.success('笔记已发布')
    newNote.value = ''
    showMatchDetail(currentMatch.value)
  } catch (err) {
    console.error(err)
  }
}

watch(selectedTeamId, () => {
  fetchMatches()
  fetchStats()
})

onMounted(() => {
  fetchMyTeams()
})
</script>

<style scoped>
.matches-page {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #f1f5f9;
}

.header-actions {
  display: flex;
  align-items: center;
}

.stat-card {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-icon.win {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.stat-icon.lose {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.stat-icon.rate {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 4px;
}

.mt-20 {
  margin-top: 20px;
}

.panel {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  overflow: hidden;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.empty-state {
  padding: 40px;
}

.empty {
  margin-top: 80px;
}

.match-list {
  padding: 12px;
}

.match-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  background: rgba(99, 102, 241, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.match-card:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

.match-result {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.match-result.win {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.match-result.lose {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.match-result.draw {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

.match-content {
  flex: 1;
}

.match-teams {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.match-teams .our-team {
  font-weight: 600;
  color: #818cf8;
}

.match-teams .score {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
}

.match-teams .score .win {
  color: #4ade80;
}

.match-teams .opponent {
  color: #f87171;
}

.match-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.match-summary {
  font-size: 12px;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.arrow {
  color: #64748b;
}

.recent-form {
  padding: 24px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-item {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.form-item.win {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.form-item.lose {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.form-item.draw {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

.match-detail {
  padding: 8px 0;
}

.detail-score {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 32px 0;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 12px;
  margin-bottom: 24px;
}

.team-side {
  text-align: center;
}

.team-name {
  font-size: 16px;
  color: #e2e8f0;
  margin-bottom: 12px;
}

.score {
  font-size: 48px;
  font-weight: 700;
  color: #64748b;
}

.score.win {
  color: #4ade80;
}

.vs {
  font-size: 24px;
  font-weight: 700;
  color: #6366f1;
}

.detail-result {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
}

.detail-result.win {
  color: #4ade80;
}

.detail-result.lose {
  color: #f87171;
}

.detail-result.draw {
  color: #facc15;
}

.detail-info {
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.info-row .label {
  width: 100px;
  color: #94a3b8;
  font-size: 14px;
}

.info-row p {
  margin: 0;
  color: #e2e8f0;
  line-height: 1.6;
}

.notes-section {
  border-top: 1px solid rgba(99, 102, 241, 0.2);
  padding-top: 24px;
}

.section-header h4 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.add-note {
  margin-bottom: 24px;
}

.no-notes {
  text-align: center;
  color: #64748b;
  padding: 40px 0;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 8px;
}

.note-content {
  flex: 1;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.author {
  font-weight: 600;
  color: #e2e8f0;
}

.note-header .time {
  font-size: 12px;
  color: #64748b;
}

.note-text {
  color: #94a3b8;
  line-height: 1.6;
}
</style>
