<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-section">
        <el-icon :size="64" color="#6366f1">
          <Trophy />
        </el-icon>
        <h1>战队管理系统</h1>
        <p>管理你的电竞战队，征战赛场</p>
      </div>

      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form>

      <div class="register-link">
        还没有账号？
        <router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import { Trophy, User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await loginForm.value.validate()
    loading.value = true
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  background: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 48px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-section h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 16px 0 8px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-section p {
  color: #94a3b8;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}

.register-link {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.register-link a {
  color: #818cf8;
  text-decoration: none;
  margin-left: 4px;
}

.register-link a:hover {
  color: #a5b4fc;
}
</style>
