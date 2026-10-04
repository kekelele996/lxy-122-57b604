<template>
  <el-container class="layout-container">
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <el-icon :size="32" color="#6366f1">
          <Trophy />
        </el-icon>
        <span>战队管理</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="transparent"
        text-color="#94a3b8"
        active-text-color="#818cf8"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>概览</span>
        </el-menu-item>
        <el-menu-item index="/teams">
          <el-icon><User /></el-icon>
          <span>我的战队</span>
        </el-menu-item>
        <el-menu-item index="/schedules">
          <el-icon><Calendar /></el-icon>
          <span>日程安排</span>
        </el-menu-item>
        <el-menu-item index="/matches">
          <el-icon><Medal /></el-icon>
          <span>比赛记录</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><Setting /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div class="user-info" @click="router.push('/profile')">
          <el-avatar :size="40">
            {{ userStore.user?.nickname?.charAt(0) || 'U' }}
          </el-avatar>
          <div class="user-text">
            <div class="user-name">{{ userStore.user?.nickname || userStore.user?.username }}</div>
            <div class="user-role">{{ userStore.user?.rank || '未定级' }}</div>
          </div>
        </div>
        <el-button type="danger" text @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          退出
        </el-button>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h2>{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-badge :value="pendingInvitations.length" :hidden="pendingInvitations.length === 0" class="invite-badge">
            <el-button type="primary" text @click="showInvitations = true">
              <el-icon><Bell /></el-icon>
              邀请通知
            </el-button>
          </el-badge>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <el-dialog v-model="showInvitations" title="战队邀请" width="500px">
      <el-empty v-if="pendingInvitations.length === 0" description="暂无邀请" />
      <div v-else class="invitation-list">
        <div v-for="inv in pendingInvitations" :key="inv.id" class="invitation-item">
          <div class="invitation-info">
            <div class="team-name">{{ inv.team_name }}</div>
            <div class="inviter">邀请人: {{ inv.inviter_nickname || inv.inviter_name }}</div>
          </div>
          <div class="invitation-actions">
            <el-button type="success" size="small" @click="handleAccept(inv.id)">接受</el-button>
            <el-button type="danger" size="small" @click="handleReject(inv.id)">拒绝</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'
import { getPendingInvitations, acceptInvitation, rejectInvitation } from '../api/team'
import { Trophy, DataAnalysis, User, Calendar, Medal, Setting, SwitchButton, Bell } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const showInvitations = ref(false)
const pendingInvitations = ref([])

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': '概览',
    '/teams': '我的战队',
    '/schedules': '日程安排',
    '/matches': '比赛记录',
    '/profile': '个人中心'
  }
  return titles[route.path] || '战队管理系统'
})

const fetchInvitations = async () => {
  try {
    const res = await getPendingInvitations()
    pendingInvitations.value = res.invitations
  } catch (err) {
    console.error(err)
  }
}

const handleAccept = async (id) => {
  try {
    await acceptInvitation(id)
    ElMessage.success('已加入战队')
    fetchInvitations()
  } catch (err) {
    console.error(err)
  }
}

const handleReject = async (id) => {
  try {
    await rejectInvitation(id)
    ElMessage.success('已拒绝邀请')
    fetchInvitations()
  } catch (err) {
    console.error(err)
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

onMounted(() => {
  fetchInvitations()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-right: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.logo span {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #818cf8, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  padding: 16px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  margin: 4px 12px;
  border-radius: 8px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(99, 102, 241, 0.1) !important;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(99, 102, 241, 0.2) !important;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(99, 102, 241, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 12px;
  background: rgba(99, 102, 241, 0.1);
}

.user-text .user-name {
  font-weight: 600;
  color: #e2e8f0;
}

.user-text .user-role {
  font-size: 12px;
  color: #94a3b8;
}

.header {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
}

.invite-badge {
  margin-right: 16px;
}

.main-content {
  padding: 24px;
  background: transparent;
}

.invitation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invitation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
}

.invitation-info .team-name {
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.invitation-info .inviter {
  font-size: 12px;
  color: #94a3b8;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
