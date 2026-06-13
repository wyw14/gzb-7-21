<template>
  <el-dialog
    v-model="visible"
    :title="allCompleted ? '🎉 恭喜完成所有任务！' : '👋 欢迎来到乐搭！'"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="!allCompleted"
    class="newbie-guide-dialog"
    @close="handleClose"
  >
    <div class="guide-content">
      <div v-if="!allCompleted" class="intro">
        <p class="intro-text">完成以下入门任务，快速开启你的音乐之旅～</p>
        <div class="progress-wrap">
          <div class="progress-info">
            <span class="progress-label">完成进度</span>
            <span class="progress-num">{{ completedCount }}/{{ totalCount }}</span>
          </div>
          <el-progress :percentage="progress" :stroke-width="12" :show-text="false" />
        </div>
      </div>

      <div v-else class="completed-intro">
        <div class="completed-icon">🏆</div>
        <p class="completed-text">太棒了！你已完成所有入门任务</p>
        <p class="completed-subtext">继续探索，发现更多音乐乐趣</p>
      </div>

      <div class="task-list">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ completed: task.completed }"
        >
          <div class="task-icon">{{ task.icon }}</div>
          <div class="task-info">
            <h4 class="task-title">
              {{ task.title }}
              <el-icon v-if="task.completed" class="check-icon"><CircleCheckFilled /></el-icon>
            </h4>
            <p class="task-desc">{{ task.description }}</p>
          </div>
          <div class="task-action">
            <el-button
              v-if="!task.completed"
              type="primary"
              size="small"
              @click="handleTaskAction(task)"
            >
              去完成
            </el-button>
            <span v-else class="completed-tag">已完成</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="!allCompleted" @click="handleClose">稍后再说</el-button>
        <el-button v-else type="primary" @click="handleClose">开始探索</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const router = useRouter()
const userStore = useUserStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const tasks = computed(() => userStore.tasks?.tasks || [])
const progress = computed(() => userStore.tasks?.progress || 0)
const completedCount = computed(() => userStore.tasks?.completedCount || 0)
const totalCount = computed(() => userStore.tasks?.totalCount || 4)
const allCompleted = computed(() => userStore.tasks?.allCompleted || false)

const handleTaskAction = (task) => {
  visible.value = false
  
  switch (task.id) {
    case 'skillLevel':
    case 'favoritePieces':
      router.push('/profile')
      break
    case 'firstCheckin':
      router.push('/checkin')
      break
    case 'favoriteOrInvite':
      router.push('/instruments')
      break
  }
}

const handleClose = async () => {
  visible.value = false
  await userStore.markNewbieGuideShown()
  emit('close')
}

watch(() => props.modelValue, (val) => {
  if (val) {
    userStore.refreshTasks()
  }
})
</script>

<style scoped>
.newbie-guide-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 24px 30px;
}

.newbie-guide-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.newbie-guide-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.newbie-guide-dialog :deep(.el-dialog__body) {
  padding: 24px 30px;
}

.intro {
  margin-bottom: 20px;
}

.intro-text {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.progress-wrap {
  background: var(--bg-light);
  padding: 16px 20px;
  border-radius: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.progress-num {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.completed-intro {
  text-align: center;
  padding: 10px 0 20px;
}

.completed-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.completed-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.completed-subtext {
  font-size: 14px;
  color: var(--text-secondary);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg-light);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.task-item.completed {
  background: #f0fdf4;
  border-color: #86efac;
}

.task-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.check-icon {
  color: #22c55e;
  font-size: 18px;
}

.task-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.task-action {
  flex-shrink: 0;
}

.completed-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #dcfce7;
  color: #16a34a;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
}

.dialog-footer {
  text-align: center;
}
</style>
