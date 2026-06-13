<template>
  <div class="app">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
    <LoginModal v-if="showLoginModal" @close="showLoginModal = false" @success="onLoginSuccess" />
    <NewbieGuide v-model="showNewbieGuide" />
  </div>
</template>

<script setup>
import { ref, provide, watch, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import LoginModal from './components/LoginModal.vue'
import NewbieGuide from './components/NewbieGuide.vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()
const showLoginModal = ref(false)
const showNewbieGuide = ref(false)

function requireLogin() {
  showLoginModal.value = true
}

provide('requireLogin', requireLogin)

async function onLoginSuccess() {
  showLoginModal.value = false
  await userStore.refreshTasks()
  if (userStore.shouldShowNewbieGuide()) {
    showNewbieGuide.value = true
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.refreshTasks()
  }
})

watch(
  () => userStore.isLoggedIn,
  async (isLoggedIn) => {
    if (isLoggedIn) {
      await userStore.refreshTasks()
      if (userStore.shouldShowNewbieGuide()) {
        showNewbieGuide.value = true
      }
    }
  }
)
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
