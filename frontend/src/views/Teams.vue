<template>
  <div class="teams-page">
    <div class="page-header">
      <h2>我的战队</h2>
      <el-button type="primary" @click="showCreateTeam = true">
        <el-icon><Plus /></el-icon>
        创建战队
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col v-for="team in teams" :key="team.id" :span="8">
        <div class="team-card" @click="router.push(`/teams/${team.id}`)">
          <div class="team-header">
            <el-avatar :size="64" :src="team.logo">
              {{ team.name.charAt(0) }}
            </el-avatar>
            <el-tag :type="team.role === 'leader' ? 'danger' : 'primary'" size="small">
              {{ team.role === 'leader' ? '队长' : team.position || '成员' }}
            </el-tag>
          </div>
          <div class="team-info">
            <h3>{{ team.name }}</h3>
            <p>{{ team.description || '暂无简介' }}</p>
          </div>
          <div class="team-footer">
            <span>
              <el-icon><User /></el-icon>
              查看详情
            </span>
            <el-icon><Right /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-empty v-if="teams.length === 0" description="还没有加入任何战队" class="empty">
      <el-button type="primary" @click="showCreateTeam = true">创建战队</el-button>
    </el-empty>
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
          :rows="4"
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyTeams, createTeam } from '../api/team'
import { Plus, User, Right } from '@element-plus/icons-vue'

const router = useRouter()

const teams = ref([])
const showCreateTeam = ref(false)
const creating = ref(false)

const createForm = reactive({
  name: '',
  description: ''
})

const fetchTeams = async () => {
  try {
    const res = await getMyTeams()
    teams.value = res.teams
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
    fetchTeams()
  } catch (err) {
    console.error(err)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  fetchTeams()
})
</script>

<style scoped>
.teams-page {
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

.team-card {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(99, 102, 241, 0.2);
  margin-bottom: 20px;
}

.team-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
}

.team-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.team-info h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
}

.team-info p {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.team-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
  color: #818cf8;
  font-size: 14px;
}

.team-footer span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty {
  margin-top: 80px;
}
</style>
