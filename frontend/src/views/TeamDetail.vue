<template>
  <div class="team-detail">
    <div class="team-header">
      <div class="team-info">
        <el-avatar :size="80" :src="team?.logo">
          {{ team?.name?.charAt(0) }}
        </el-avatar>
        <div>
          <h1>{{ team?.name }}</h1>
          <p>{{ team?.description || '暂无简介' }}</p>
        </div>
      </div>
      <div class="team-actions" v-if="isLeader">
        <el-button @click="showEditTeam = true">
          <el-icon><Edit /></el-icon>
          编辑战队
        </el-button>
        <el-button type="primary" @click="showInvite = true">
          <el-icon><Plus /></el-icon>
          邀请成员
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="panel">
          <div class="panel-header">
            <h3>成员列表</h3>
            <span class="member-count">{{ approvedMembers.length }} 人</span>
          </div>
          <div class="member-list">
            <div v-for="member in approvedMembers" :key="member.id" class="member-item">
              <el-avatar :size="48" :src="member.avatar">
                {{ member.nickname?.charAt(0) || member.username?.charAt(0) }}
              </el-avatar>
              <div class="member-info">
                <div class="member-name">
                  {{ member.nickname || member.username }}
                  <el-tag v-if="member.role === 'leader'" type="danger" size="small">队长</el-tag>
                  <el-tag v-else-if="member.role === 'officer'" type="warning" size="small">官员</el-tag>
                </div>
                <div class="member-meta">
                  <span class="rank">{{ member.rank || '未定级' }}</span>
                  <span class="position" v-if="member.position">{{ member.position }}</span>
                </div>
              </div>
              <div class="member-actions" v-if="isLeader && member.id !== currentUserId">
                <el-select
                  v-model="editPosition[member.id]"
                  placeholder="设置位置"
                  size="small"
                  style="width: 100px"
                  @change="handleSetPosition(member.id)"
                >
                  <el-option label="上单" value="上单" />
                  <el-option label="打野" value="打野" />
                  <el-option label="中单" value="中单" />
                  <el-option label="ADC" value="ADC" />
                  <el-option label="辅助" value="辅助" />
                  <el-option label="替补" value="替补" />
                </el-select>
                <el-select
                  v-model="editRole[member.id]"
                  placeholder="角色"
                  size="small"
                  style="width: 80px"
                  @change="handleSetRole(member.id)"
                >
                  <el-option label="成员" value="member" />
                  <el-option label="官员" value="officer" />
                </el-select>
                <el-button type="danger" text size="small" @click="handleRemoveMember(member.id)">
                  移除
                </el-button>
              </div>
            </div>
          </div>

          <div v-if="pendingMembers.length > 0" class="pending-section">
            <div class="pending-title">待审核 ({{ pendingMembers.length }})</div>
            <div v-for="member in pendingMembers" :key="member.id" class="member-item pending">
              <el-avatar :size="40" :src="member.avatar">
                {{ member.nickname?.charAt(0) || member.username?.charAt(0) }}
              </el-avatar>
              <div class="member-info">
                <div class="member-name">{{ member.nickname || member.username }}</div>
                <div class="member-meta">等待加入</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="panel">
          <div class="panel-header">
            <h3>段位分布</h3>
          </div>
          <div class="rank-distribution">
            <div v-for="(count, rank) in rankDistribution" :key="rank" class="rank-item">
              <span class="rank-name">{{ rank }}</span>
              <div class="rank-bar">
                <div class="rank-fill" :style="{ width: (count / approvedMembers.length * 100) + '%' }"></div>
              </div>
              <span class="rank-count">{{ count }}人</span>
            </div>
          </div>
        </div>

        <div class="panel mt-20">
          <div class="panel-header">
            <h3>快速操作</h3>
          </div>
          <div class="quick-actions">
            <el-button type="primary" @click="router.push('/schedules')">
              <el-icon><Calendar /></el-icon>
              查看日程
            </el-button>
            <el-button type="success" @click="router.push('/matches')">
              <el-icon><Medal /></el-icon>
              比赛记录
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>

  <el-dialog v-model="showEditTeam" title="编辑战队" width="500px">
    <el-form :model="editForm" label-width="80px">
      <el-form-item label="战队名称">
        <el-input v-model="editForm.name" />
      </el-form-item>
      <el-form-item label="战队简介">
        <el-input v-model="editForm.description" type="textarea" :rows="4" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditTeam = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleUpdateTeam">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showInvite" title="邀请成员" width="500px">
    <el-form label-width="80px">
      <el-form-item label="用户名">
        <el-input
          v-model="inviteUsername"
          placeholder="输入用户名搜索"
          @input="handleSearchUser"
        />
      </el-form-item>
    </el-form>
    <div v-if="searchResults.length > 0" class="search-results">
      <div
        v-for="user in searchResults"
        :key="user.id"
        class="search-result-item"
        @click="handleInvite(user.username)"
      >
        <el-avatar :size="40" :src="user.avatar">
          {{ user.nickname?.charAt(0) || user.username?.charAt(0) }}
        </el-avatar>
        <div>
          <div class="username">{{ user.nickname || user.username }}</div>
          <div class="user-rank">{{ user.rank || '未定级' }}</div>
        </div>
        <el-button type="primary" size="small">邀请</el-button>
      </div>
    </div>
    <template #footer>
      <el-button @click="showInvite = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'
import { getTeamDetail, updateTeam, inviteMember, updateMemberRole, removeMember } from '../api/team'
import { searchUsers } from '../api/user'
import { Edit, Plus, Calendar, Medal } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const teamId = route.params.id
const team = ref(null)
const members = ref([])
const rankDistribution = ref({})
const showEditTeam = ref(false)
const showInvite = ref(false)
const saving = ref(false)
const inviting = ref(false)
const inviteUsername = ref('')
const searchResults = ref([])
const editPosition = reactive({})
const editRole = reactive({})

const currentUserId = computed(() => userStore.user?.id)

const isLeader = computed(() => {
  return team.value?.leader_id === currentUserId.value
})

const approvedMembers = computed(() => {
  return members.value.filter(m => m.status === 'approved')
})

const pendingMembers = computed(() => {
  return members.value.filter(m => m.status === 'pending')
})

const editForm = reactive({
  name: '',
  description: ''
})

const fetchTeamDetail = async () => {
  try {
    const res = await getTeamDetail(teamId)
    team.value = res.team
    members.value = res.members
    rankDistribution.value = res.rankDistribution

    editForm.name = res.team.name
    editForm.description = res.team.description || ''

    res.members.forEach(m => {
      editPosition[m.id] = m.position || ''
      editRole[m.id] = m.role === 'leader' ? 'member' : m.role
    })
  } catch (err) {
    console.error(err)
  }
}

const handleUpdateTeam = async () => {
  if (!editForm.name.trim()) {
    ElMessage.warning('战队名称不能为空')
    return
  }
  try {
    saving.value = true
    await updateTeam(teamId, editForm)
    ElMessage.success('战队信息已更新')
    showEditTeam.value = false
    fetchTeamDetail()
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

const handleSearchUser = async (query) => {
  if (!query.trim()) {
    searchResults.value = []
    return
  }
  try {
    const res = await searchUsers(query)
    searchResults.value = res.users.filter(u => u.id !== currentUserId.value)
  } catch (err) {
    console.error(err)
  }
}

const handleInvite = async (username) => {
  try {
    inviting.value = true
    await inviteMember(teamId, username)
    ElMessage.success(`已向 ${username} 发送邀请`)
    inviteUsername.value = ''
    searchResults.value = []
  } catch (err) {
    console.error(err)
  } finally {
    inviting.value = false
  }
}

const handleSetPosition = async (memberId) => {
  try {
    await updateMemberRole(teamId, memberId, { position: editPosition[memberId] })
    ElMessage.success('位置已更新')
    fetchTeamDetail()
  } catch (err) {
    console.error(err)
  }
}

const handleSetRole = async (memberId) => {
  try {
    await updateMemberRole(teamId, memberId, { role: editRole[memberId] })
    ElMessage.success('角色已更新')
    fetchTeamDetail()
  } catch (err) {
    console.error(err)
  }
}

const handleRemoveMember = async (memberId) => {
  try {
    await ElMessageBox.confirm('确定要移除该成员吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await removeMember(teamId, memberId)
    ElMessage.success('已移除成员')
    fetchTeamDetail()
  } catch (err) {
    if (err !== 'cancel') {
      console.error(err)
    }
  }
}

onMounted(() => {
  fetchTeamDetail()
})
</script>

<style scoped>
.team-detail {
  padding: 0;
}

.team-header {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.team-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.team-info h1 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 700;
  color: #f1f5f9;
}

.team-info p {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

.team-actions {
  display: flex;
  gap: 12px;
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

.member-count {
  color: #818cf8;
  font-size: 14px;
}

.member-list {
  padding: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background 0.2s ease;
}

.member-item:hover {
  background: rgba(99, 102, 241, 0.05);
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-meta {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  gap: 12px;
}

.rank {
  color: #fbbf24;
}

.position {
  color: #818cf8;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pending-section {
  padding: 12px;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
}

.pending-title {
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 12px;
  font-size: 14px;
}

.pending {
  background: rgba(245, 158, 11, 0.05);
}

.rank-distribution {
  padding: 24px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.rank-item:last-child {
  margin-bottom: 0;
}

.rank-name {
  width: 60px;
  font-size: 14px;
  color: #e2e8f0;
}

.rank-bar {
  flex: 1;
  height: 8px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.rank-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.rank-count {
  width: 40px;
  text-align: right;
  font-size: 14px;
  color: #94a3b8;
}

.mt-20 {
  margin-top: 20px;
}

.quick-actions {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions .el-button {
  height: 48px;
  justify-content: center;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px 0;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-result-item:hover {
  background: rgba(99, 102, 241, 0.1);
}

.username {
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 2px;
}

.user-rank {
  font-size: 12px;
  color: #94a3b8;
}
</style>
