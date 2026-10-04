<template>
  <div class="register-container">
    <div class="register-box">
      <div class="logo-section">
        <el-icon :size="64" color="#6366f1">
          <Trophy />
        </el-icon>
        <h1>创建账号</h1>
        <p>加入我们，开始你的电竞之旅</p>
      </div>

      <el-form
        ref="registerForm"
        :model="form"
        :rules="rules"
        class="register-form"
        @keyup.enter="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="昵称（可选）"
            size="large"
            :prefix-icon="UserFilled"
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

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="register-btn"
          :loading="loading"
          @click="handleRegister"
        >
          注册
        </el-button>
      </el-form>

      <div class="login-link">
        已有账号？
        <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import { Trophy, User, UserFilled, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const registerForm = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  try {
    await registerForm.value.validate()
    loading.value = true
    const { confirmPassword, ...registerData } = form
    await userStore.register(registerData)
    ElMessage.success('注册成功')
    router.push('/dashboard')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-box {
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

.register-form {
  margin-bottom: 24px;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
}

.register-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}

.login-link {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.login-link a {
  color: #818cf8;
  text-decoration: none;
  margin-left: 4px;
}

.login-link a:hover {
  color: #a5b4fc;
}
</style>
