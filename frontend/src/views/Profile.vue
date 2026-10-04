<template>
  <div class="profile">
    <el-row :gutter="20">
      <el-col :span="8">
        <div class="profile-card">
          <div class="avatar-section">
            <el-avatar :size="120">
              {{ userStore.user?.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <h2>{{ userStore.user?.nickname || userStore.user?.username }}</h2>
            <p>@{{ userStore.user?.username }}</p>
          </div>

          <div class="info-list">
            <div class="info-item">
              <span class="label">游戏ID</span>
              <span class="value">{{ userStore.user?.game_id || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">段位</span>
              <span class="value">{{ userStore.user?.rank || '未定级' }}</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="16">
        <div class="panel">
          <div class="panel-header">
            <h3>个人信息</h3>
          </div>
          <el-form :model="form" label-width="100px" class="profile-form">
            <el-form-item label="昵称">
              <el-input v-model="form.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="游戏ID">
              <el-input v-model="form.game_id" placeholder="请输入游戏ID" />
            </el-form-item>
            <el-form-item label="段位">
              <el-select v-model="form.rank" placeholder="请选择段位" style="width: 100%">
                <el-option label="青铜" value="青铜" />
                <el-option label="白银" value="白银" />
                <el-option label="黄金" value="黄金" />
                <el-option label="铂金" value="铂金" />
                <el-option label="钻石" value="钻石" />
                <el-option label="大师" value="大师" />
                <el-option label="宗师" value="宗师" />
                <el-option label="王者" value="王者" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="panel mt-20">
          <div class="panel-header">
            <h3>账号安全</h3>
          </div>
          <div class="security-list">
            <div class="security-item">
              <div class="security-icon">
              <el-icon><Lock /></el-icon>
              </div>
              <div class="security-info">
                <div class="security-title">修改密码</div>
                <div class="security-desc">定期修改密码，保障账号安全</div>
              </div>
              <el-button type="primary" text>修改</el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import { updateProfile } from '../api/user'
import { Lock } from '@element-plus/icons-vue'

const userStore = useUserStore()

const saving = ref(false)

const form = reactive({
  nickname: '',
  game_id: '',
  rank: ''
})

const loadUserInfo = () => {
  if (userStore.user) {
    form.nickname = userStore.user.nickname || ''
    form.game_id = userStore.user.game_id || ''
    form.rank = userStore.user.rank || ''
  }
}

const handleSave = async () => {
  try {
    saving.value = true
    await updateProfile(form)
    await userStore.fetchProfile()
    ElMessage.success('保存成功')
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile {
  padding: 0;
}

.profile-card {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.avatar-section {
  margin-bottom: 24px;
}

.avatar-section h2 {
  margin: 16px 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
}

.avatar-section p {
  color: #94a3b8;
  font-size: 14px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #94a3b8;
  font-size: 14px;
}

.value {
  color: #e2e8f0;
  font-weight: 500;
}

.panel {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.2);
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

.profile-form {
  padding: 24px;
}

.mt-20 {
  margin-top: 20px;
}

.security-list {
  padding: 24px;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.05);
}

.security-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
  font-size: 24px;
}

.security-info {
  flex: 1;
}

.security-title {
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.security-desc {
  font-size: 12px;
  color: #94a3b8;
}
</style>
