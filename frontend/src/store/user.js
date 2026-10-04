import { defineStore } from 'pinia'
import { login, register, getProfile } from '../api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || '',
    teams: []
  }),

  actions: {
    async login(data) {
      const res = await login(data)
      this.token = res.token
      this.user = res.user
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      return res
    },

    async register(data) {
      const res = await register(data)
      this.token = res.token
      this.user = res.user
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      return res
    },

    async fetchProfile() {
      const res = await getProfile()
      this.user = res.user
      localStorage.setItem('user', JSON.stringify(res.user))
      return res
    },

    logout() {
      this.user = null
      this.token = ''
      this.teams = []
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    loadUserFromStorage() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          this.user = JSON.parse(userStr)
        } catch (e) {
          this.user = null
        }
      }
    }
  }
})
