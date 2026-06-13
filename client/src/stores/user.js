import { defineStore } from 'pinia'
import { userApi } from '../api'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    isLoggedIn: false,
    tasks: null,
    showNewbieGuide: false
  }),

  getters: {
    userId: (state) => state.currentUser?.id || null,
    favoriteInstruments: (state) => state.currentUser?.favoriteInstruments || [],
    tasksProgress: (state) => state.tasks?.progress || 0,
    allTasksCompleted: (state) => state.tasks?.allCompleted || false
  },

  actions: {
    async login(username, phone) {
      try {
        const result = await userApi.login({ username, phone })
        if (result.success) {
          this.currentUser = result.user
          this.isLoggedIn = true
          localStorage.setItem('userId', result.user.id)
          localStorage.setItem('userData', JSON.stringify(result.user))
        }
        return result
      } catch (e) {
        throw e
      }
    },

    restoreSession() {
      const userData = localStorage.getItem('userData')
      if (userData) {
        try {
          this.currentUser = JSON.parse(userData)
          this.isLoggedIn = true
        } catch (e) {
          this.logout()
        }
      }
    },

    async refreshUser() {
      if (this.userId) {
        try {
          const user = await userApi.getUser(this.userId)
          this.currentUser = user
          localStorage.setItem('userData', JSON.stringify(user))
        } catch (e) {
          console.error('刷新用户信息失败', e)
        }
      }
    },

    async updateUser(data) {
      if (this.userId) {
        const result = await userApi.updateUser(this.userId, data)
        if (result.success) {
          this.currentUser = result.user
          localStorage.setItem('userData', JSON.stringify(result.user))
          await this.refreshTasks()
        }
        return result
      }
    },

    async toggleFavorite(instrumentId) {
      if (this.userId) {
        const result = await userApi.toggleFavorite(this.userId, instrumentId)
        if (result.success) {
          this.currentUser = {
            ...this.currentUser,
            favoriteInstruments: result.favoriteInstruments
          }
          localStorage.setItem('userData', JSON.stringify(this.currentUser))
          await this.refreshTasks()
        }
        return result
      }
    },

    isFavorite(instrumentId) {
      return this.favoriteInstruments.includes(instrumentId)
    },

    async refreshTasks() {
      if (this.userId) {
        try {
          const tasks = await userApi.getTasks(this.userId)
          this.tasks = tasks
        } catch (e) {
          console.error('刷新任务状态失败', e)
        }
      }
    },

    async markNewbieGuideShown() {
      if (this.userId) {
        try {
          await userApi.updateNewbieGuide(this.userId, true)
          this.showNewbieGuide = false
          if (this.currentUser) {
            this.currentUser.newbieGuideShown = true
            localStorage.setItem('userData', JSON.stringify(this.currentUser))
          }
        } catch (e) {
          console.error('更新新手引导状态失败', e)
        }
      }
    },

    shouldShowNewbieGuide() {
      return this.isLoggedIn && !this.currentUser?.newbieGuideShown
    },

    logout() {
      this.currentUser = null
      this.isLoggedIn = false
      this.tasks = null
      this.showNewbieGuide = false
      localStorage.removeItem('userId')
      localStorage.removeItem('userData')
    }
  }
})
