<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="stat-card team-count">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ myTeams.length }}</div>
            <div class="stat-label">我的战队</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card upcoming">
          <div class="stat-icon">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ upcomingSchedules.length }}</div>
            <div class="stat-label">近期安排</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card matches">
          <div class="stat-icon">
            <el-icon><Medal /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalMatches }}</div>
            <div class="stat-label">总比赛</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card win-rate">
          <div class="stat-icon">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overallWinRate }}%</div>
            <div class="stat-label">总胜率</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <div class="panel">
          <div class="panel-header">
            <h3>我的战队</h3>
            <el-button type="primary" size="small" @click="router.push('/teams')">
              查看全部
            </el-button>
          </div>
          <div v-if="myTeams.length === 0" class="empty-state">
            <el-empty description="还没有加入任何战队">
              <el-button type="primary" @click="showCreateTeam = true">创建战队</el-button>
            </el-empty>
          </div>
          <div v-else class="team-list">
            <div
              v-for="team in myTeams.slice(0, 5)"
              :key="team.id"
              class="team-item"
              @click="router.push(`/teams/${team.id}`)"
            >
              <el-avatar :size="48" :src="team.logo">
                {{ team.name.charAt(0) }}
              </el-avatar>
              <div class="team-info">
                <div class="team-name">{{ team.name }}</div>
                <div class="team-role">
                  <el-tag :type="team.role === 'leader' ? 'danger' : 'primary'" size="small">
                    {{ team.role === 'leader' ? '队长' : team.position || '成员' }}
                  </el-tag>
                </div>
              </div>
              <el-icon class="arrow"><Right /></el-icon>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="panel">
          <div class="panel-header">
            <h3>近期日程</h3>
            <el-button type="primary" size="small" @click="router.push('/schedules')">
              查看全部
            </el-button>
          </div>
          <div v-if="upcomingSchedules.length === 0" class="empty-state">
            <el-empty description="暂无近期安排" />
          </div>
          <div v-else class="schedule-list">
            <div
              v-for="schedule in upcomingSchedules.slice(0, 5)"
              :key="schedule.id"
              class="schedule-item"
            >
              <div class="schedule-type" :class="schedule.type">
                {{ schedule.type === 'training' ? '训练' : '比赛' }}
              </div>
              <div class="schedule-info">
                <div class="schedule-title">{{ schedule.title }}</div>
                <div class="schedule-time">
                  <el-icon><Clock /></el-icon>
                  {{ formatTime(schedule.start_time) }}
                </div>
                <div v-if="schedule.opponent" class="schedule-opponent">
                  对手: {{ schedule.opponent }}
                </div>
              </div>
              <div class="schedule-team">
                {{ schedule.team_name }}
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>

  <el-dialog v-model="showCreateTeam" title="创建战队" width="500px">
    <el-form :model="createForm" label-width="80px">
      <el-form-item label="战队名称">
        <el-input v-model="createForm.name" placeholder="请输入战队名称" />
      </el-form-item>
      <el-form-item label="战队简介">
        <el-input
          v-model="createForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入战队简介"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showCreateTeam = false">取消</el-button>
      <el-button type="primary" :loading="creating" @click="handleCreateTeam">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyTeams, createTeam } from '../api/team'
import { getMyUpcomingSchedules } from '../api/schedule'
import { getTeamMatches } from '../api/match'
import { User, Calendar, Medal, Trophy, Right, Clock } from '@element-plus/icons-vue'

const router = useRouter()

const myTeams = ref([])
const upcomingSchedules = ref([])
const showCreateTeam = ref(false)
const creating = ref(false)

const createForm = reactive({
  name: '',
  description: ''
})

const totalMatches = computed(() => {
  return myTeams.value.reduce((sum, team) => sum + (team.matchCount || 0), 0)
})

const overallWinRate = computed(() => {
  let totalWins = 0
  let total = 0
  myTeams.value.forEach(team => {
    if (team.stats) {
      totalWins += team.stats.wins || 0
      total += team.stats.total_matches || 0
    }
  })
  return total > 0 ? Math.round((totalWins / total) * 100) : 0
})

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchData = async () => {
  try {
    const [teamsRes, schedulesRes] = await Promise.all([
      getMyTeams(),
      getMyUpcomingSchedules()
    ])
    myTeams.value = teamsRes.teams
    upcomingSchedules.value = schedulesRes.schedules

    for (const team of myTeams.value) {
      try {
        const matchesRes = await getTeamMatches(team.id)
        team.matchCount = matchesRes.matches.length
      } catch (e) {
        team.matchCount = 0
      }
    }
  } catch (err) {
    console.error(err)
  }
}

const handleCreateTeam = async () => {
  if (!createForm.name.trim()) {
    ElMessage.warning('请输入战队名称')
    return
  }
  try {
    creating.value = true
    await createTeam(createForm)
    ElMessage.success('战队创建成功')
    showCreateTeam.value = false
    createForm.name = ''
    createForm.description = ''
    fetchData()
  } catch (err) {
    console.error(err)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(99, 102, 241, 0.2);
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

.team-count .stat-icon {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

.upcoming .stat-icon {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.matches .stat-icon {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.win-rate .stat-icon {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.team-list,
.schedule-list {
  padding: 12px;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.team-item:hover {
  background: rgba(99, 102, 241, 0.1);
}

.team-info {
  flex: 1;
}

.team-name {
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.arrow {
  color: #64748b;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(99, 102, 241, 0.05);
}

.schedule-type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.schedule-type.training {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.schedule-type.match {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.schedule-info {
  flex: 1;
}

.schedule-title {
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.schedule-time,
.schedule-opponent {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.schedule-team {
  font-size: 12px;
  color: #818cf8;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 4px;
}
</style>
