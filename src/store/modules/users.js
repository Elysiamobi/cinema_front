import { getUsers, getUserById, createUser, updateUser, deleteUser, updateUserRole } from '@/api/users'
import router from '@/router'

export default {
  namespaced: true,
  state: {
    users: [],
    currentUser: null,
    loading: false,
    error: null
  },
  mutations: {
    SET_USERS(state, users) {
      state.users = users
    },
    SET_CURRENT_USER(state, user) {
      state.currentUser = user
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    }
  },
  actions: {
    async fetchUsers({ commit }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        // 检查是否已登录
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('未登录或登录已过期')
        }
        
        // 检查是否是管理员
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        if (!user || !user.is_admin) {
          throw new Error('需要管理员权限')
        }
        
        const response = await getUsers()
        
        if (!response || !Array.isArray(response)) {
          throw new Error('获取用户列表失败：返回数据格式不正确')
        }
        
        // 处理用户数据
        const processedUsers = response.map(user => ({
          id: parseInt(user.id, 10),
          username: String(user.username || ''),
          email: String(user.email || ''),
          is_admin: Boolean(user.is_admin),
          created_at: String(user.created_at || '')
        }))
        
        // 按ID升序排序
        processedUsers.sort((a, b) => a.id - b.id)
        
        commit('SET_USERS', processedUsers)
        return processedUsers
      } catch (error) {
        console.error('获取用户列表失败:', error)
        commit('SET_ERROR', error.message)
        
        // 如果是认证错误，重定向到登录页
        if (error.message === '未登录或登录已过期') {
          router.push('/login')
        }
        
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchUserById({ commit }, id) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await getUserById(id)
        if (response && response.id) {
          commit('SET_CURRENT_USER', response)
          return response
        } else {
          throw new Error('获取用户详情失败：数据格式不正确')
        }
      } catch (error) {
        console.error('获取用户详情失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async createUser({ commit, dispatch }, userData) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await createUser(userData)
        if (response && response.user) {
          await dispatch('fetchUsers')
          return response.user
        } else {
          throw new Error('创建用户失败：响应数据格式不正确')
        }
      } catch (error) {
        console.error('创建用户失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async updateUser({ commit, dispatch }, { id, ...userData }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await updateUser(id, userData)
        if (response && response.user) {
          await dispatch('fetchUsers')
          return response.user
        } else {
          throw new Error('更新用户失败：响应数据格式不正确')
        }
      } catch (error) {
        console.error('更新用户失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async deleteUser({ commit, dispatch }, id) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        await deleteUser(id)
        await dispatch('fetchUsers')
      } catch (error) {
        console.error('删除用户失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async updateUserRole({ commit, dispatch }, { id, isAdmin }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await updateUserRole(id, isAdmin)
        if (response) {
          await dispatch('fetchUsers')
        } else {
          throw new Error('更新用户角色失败：响应数据格式不正确')
        }
      } catch (error) {
        console.error('更新用户角色失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },
  getters: {
    allUsers: state => state.users,
    currentUser: state => state.currentUser,
    loading: state => state.loading,
    error: state => state.error
  }
}