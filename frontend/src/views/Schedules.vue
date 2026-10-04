<template>
  <div class="schedules-page">
    <div class="page-header">
      <h2>日程安排</h2>
      <div class="header-actions">
        <el-select v-model="selectedTeamId" placeholder="选择战队" style="width: 200px; margin-right: 12px">
          <el-option
            v-for="team in myTeams"
            :key="team.id"
            :label="team.name"
            :value="team.id"
          />
        </el-select>
        <el-button type="primary" @click="showCreateSchedule = true" :disabled="!selectedTeamId">
          <el-icon><Plus /></el-icon>
          创建日程
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" v-if="selectedTeamId">
      <el-col :span="16">
        <div class="panel">
          <div class="panel-header">
            <h3>日程列表</h3>
            <div class="filter-tabs">
              <el-radio-group v-model="filterType" size="small">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="training">训练</el-radio-button>
                <el-radio-button value="match">比赛</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div v-if="filteredSchedules.length === 0" class="empty-state">
            <el-empty description="暂无日程安排" />
          </div>
          <div v-else class="schedule-list">
            <div
              v-for="schedule in filteredSchedules"
              :key="schedule.id"
              class="schedule-card"
              @click="showScheduleDetail(schedule)"
            >
              <div class="schedule-type" :class="schedule.type">
                {{ schedule.type === 'training' ? '训练' : '比赛' }}
              </div>
              <div class="schedule-content">
                <div class="schedule-title">{{ schedule.title }}</div>
                <div class="schedule-meta">
                  <span class="time">
                    <el-icon><Clock /></el-icon>
                    {{ formatDateTime(schedule.start_time) }}
                  </span>
                  <span v-if="schedule.opponent" class="opponent">
                    vs {{ schedule.opponent }}
                  </span>
                </div>
                <div v-if="schedule.description" class="schedule-desc">
                  {{ schedule.description }}
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
            <h3>出勤统计</h3>
          </div>
          <div class="attendance-stats">
            <div
              v-for="stat in attendanceStats"
              :key="stat.id"
              class="stat-item"
            >
              <el-avatar :size="40" :src="stat.avatar">
                {{ stat.nickname?.charAt(0) || stat.username?.charAt(0) }}
              </el-avatar>
              <div class="stat-info">
                <div class="stat-name">{{ stat.nickname || stat.username }}</div>
                <div class="stat-bar">
                  <div
                    class="stat-fill"
                    :style="{ width: stat.attendance_rate + '%' }"
                  ></div>
                </div>
              </div>
              <div class="stat-rate">{{ stat.attendance_rate }}%</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-empty v-else description="请先加入或创建一个战队" class="empty" />
  </div>

  <el-dialog v-model="showCreateSchedule" title="创建日程" width="500px">
    <el-form :model="scheduleForm" label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="scheduleForm.title" placeholder="请输入日程标题" />
      </el-form-item>
      <el-form-item label="类型">
        <el-radio-group v-model="scheduleForm.type">
          <el-radio value="training">训练</el-radio>
          <el-radio value="match">比赛</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="开始时间">
        <el-date-picker
          v-model="scheduleForm.start_time"
          type="datetime"
          placeholder="选择开始时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="结束时间">
        <el-date-picker
          v-model="scheduleForm.end_time"
          type="datetime"
          placeholder="选择结束时间（可选）"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="对手" v-if="scheduleForm.type === 'match'">
        <el-input v-model="scheduleForm.opponent" placeholder="请输入对手名称" />
      </el-form-item>
      <el-form-item label="地点">
        <el-input v-model="scheduleForm.location" placeholder="训练室/服务器等（可选）" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="scheduleForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入日程描述"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showCreateSchedule = false">取消</el-button>
      <el-button type="primary" :loading="creating" @click="handleCreateSchedule">创建</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showDetail" :title="currentSchedule?.title" width="600px">
    <div v-if="currentSchedule" class="schedule-detail">
      <div class="detail-row">
        <span class="label">类型</span>
        <el-tag :type="currentSchedule.type === 'training' ? 'success' : 'danger'">
          {{ currentSchedule.type === 'training' ? '训练' : '比赛' }}
        </el-tag>
      </div>
      <div class="detail-row">
        <span class="label">时间</span>
        <span>{{ formatDateTime(currentSchedule.start_time) }}</span>
      </div>
      <div class="detail-row" v-if="currentSchedule.opponent">
        <span class="label">对手</span>
        <span>{{ currentSchedule.opponent }}</span>
      </div>
      <div class="detail-row" v-if="currentSchedule.location">
        <span class="label">地点</span>
        <span>{{ currentSchedule.location }}</span>
      </div>
      <div class="detail-row" v-if="currentSchedule.description">
        <span class="label">描述</span>
        <span>{{ currentSchedule.description }}</span>
      </div>

      <div class="attendance-section">
        <div class="section-title">我的出勤</div>
        <el-radio-group v-model="myAttendance" @change="handleUpdateAttendance">
          <el-radio value="attend">参加</el-radio>
          <el-radio value="absent">请假</el-radio>
          <el-radio value="pending">待定</el-radio>
        </el-radio-group>
        <el-input
          v-if="myAttendance === 'absent'"
          v-model="absentReason"
          placeholder="请假原因"
          class="reason-input"
          @blur="handleUpdateAttendance"
        />
      </div>

      <div class="attendance-list">
        <div class="section-title">出勤情况</div>
        <div class="attendance-items">
          <div
            v-for="item in currentAttendance"
            :key="item.id"
            class="attendance-item"
          >
            <el-avatar :size="32" :src="item.avatar">
              {{ item.nickname?.charAt(0) || item.username?.charAt(0) }}
            </el-avatar>
            <span class="name">{{ item.nickname || item.username }}</span>
            <el-tag
              :type="item.status === 'attend' ? 'success' : item.status === 'absent' ? 'danger' : 'warning'"
              size="small"
            >
              {{ item.status === 'attend' ? '参加' : item.status === 'absent' ? '请假' : '待定' }}
            </el-tag>
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
  getTeamSchedules,
  createSchedule,
  getScheduleDetail,
  updateAttendance,
  getAttendanceStats
} from '../api/schedule'
import { Plus, Clock, Right } from '@element-plus/icons-vue'

const myTeams = ref([])
const selectedTeamId = ref('')
const schedules = ref([])
const filterType = ref('all')
const showCreateSchedule = ref(false)
const showDetail = ref(false)
const creating = ref(false)
const currentSchedule = ref(null)
const currentAttendance = ref([])
const myAttendance = ref('pending')
const absentReason = ref('')
const attendanceStats = ref([])

const scheduleForm = reactive({
  title: '',
  type: 'training',
  start_time: '',
  end_time: '',
  opponent: '',
  location: '',
  description: ''
})

const filteredSchedules = computed(() => {
  if (filterType.value === 'all') {
    return schedules.value
  }
  return schedules.value.filter(s => s.type === filterType.value)
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

const fetchSchedules = async () => {
  if (!selectedTeamId.value) return
  try {
    const res = await getTeamSchedules(selectedTeamId.value)
    schedules.value = res.schedules
  } catch (err) {
    console.error(err)
  }
}

const fetchStats = async () => {
  if (!selectedTeamId.value) return
  try {
    const res = await getAttendanceStats(selectedTeamId.value)
    attendanceStats.value = res.stats
  } catch (err) {
    console.error(err)
  }
}

const handleCreateSchedule = async () => {
  if (!scheduleForm.title.trim()) {
    ElMessage.warning('请输入日程标题')
    return
  }
  if (!scheduleForm.start_time) {
    ElMessage.warning('请选择开始时间')
    return
  }
  try {
    creating.value = true
    await createSchedule({
      ...scheduleForm,
      team_id: selectedTeamId.value
    })
    ElMessage.success('日程创建成功')
    showCreateSchedule.value = false
    resetScheduleForm()
    fetchSchedules()
  } catch (err) {
    console.error(err)
  } finally {
    creating.value = false
  }
}

const resetScheduleForm = () => {
  scheduleForm.title = ''
  scheduleForm.type = 'training'
  scheduleForm.start_time = ''
  scheduleForm.end_time = ''
  scheduleForm.opponent = ''
  scheduleForm.location = ''
  scheduleForm.description = ''
}

const showScheduleDetail = async (schedule) => {
  try {
    const res = await getScheduleDetail(schedule.id)
    currentSchedule.value = res.schedule
    currentAttendance.value = res.attendance
    myAttendance.value = res.myAttendance?.status || 'pending'
    absentReason.value = res.myAttendance?.reason || ''
    showDetail.value = true
  } catch (err) {
    console.error(err)
  }
}

const handleUpdateAttendance = async () => {
  if (!currentSchedule.value) return
  try {
    await updateAttendance(currentSchedule.value.id, {
      status: myAttendance.value,
      reason: absentReason.value
    })
    showScheduleDetail(currentSchedule.value)
  } catch (err) {
    console.error(err)
  }
}

watch(selectedTeamId, () => {
  fetchSchedules()
  fetchStats()
})

onMounted(() => {
  fetchMyTeams()
})
</script>

<style scoped>
.schedules-page {
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

.empty {
  margin-top: 80px;
}

.schedule-list {
  padding: 12px;
}

.schedule-card {
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

.schedule-card:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

.schedule-type {
  padding: 6px 16px;
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

.schedule-content {
  flex: 1;
}

.schedule-title {
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 6px;
}

.schedule-meta {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
}

.schedule-meta .time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.schedule-meta .opponent {
  color: #f87171;
}

.schedule-desc {
  font-size: 12px;
  color: #64748b;
}

.arrow {
  color: #64748b;
}

.attendance-stats {
  padding: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.stat-item:hover {
  background: rgba(99, 102, 241, 0.05);
}

.stat-info {
  flex: 1;
}

.stat-name {
  font-size: 14px;
  color: #e2e8f0;
  margin-bottom: 6px;
}

.stat-bar {
  height: 6px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 3px;
}

.stat-rate {
  font-size: 14px;
  font-weight: 600;
  color: #4ade80;
  width: 50px;
  text-align: right;
}

.schedule-detail {
  padding: 8px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.detail-row .label {
  width: 80px;
  color: #94a3b8;
  font-size: 14px;
}

.attendance-section {
  margin-top: 24px;
  padding: 16px;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 8px;
}

.section-title {
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.reason-input {
  margin-top: 12px;
}

.attendance-list {
  margin-top: 24px;
}

.attendance-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.attendance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 20px;
}

.attendance-item .name {
  font-size: 14px;
  color: #e2e8f0;
}
</style>
