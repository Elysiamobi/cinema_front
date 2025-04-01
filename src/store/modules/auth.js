import axios from 'axios'

export default {
  namespaced: true,
  state: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAdmin: localStorage.getItem('userRole') === 'admin'
  },
  mutations: {
    setToken(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    setUser(state, user) {
      state.user = user
      state.isAdmin = user.is_admin
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('userRole', user.is_admin ? 'admin' : 'user')
    },
    clearAuth(state) {
      state.token = null
      state.user = null
      state.isAdmin = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userRole')
    }
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await axios.post('http://localhost:5000/api/login', credentials)
        const { access_token, user_id, is_admin } = response.data
        commit('setToken', access_token)
        commit('setUser', { id: user_id, is_admin })
        return response.data
      } catch (error) {
        throw error.response.data
      }
    },
    async register({ commit }, userData) {
      try {
        const response = await axios.post('http://localhost:5000/api/register', userData)
        return response.data
      } catch (error) {
        throw error.response.data
      }
    },
    logout({ commit }) {
      commit('clearAuth')
    }
  },
  getters: {
    isAuthenticated: state => !!state.token,
    isAdmin: state => state.isAdmin,
    currentUser: state => state.user
  }
} 