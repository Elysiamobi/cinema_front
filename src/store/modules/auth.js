import { login as loginApi, register, getUserInfo, updateUserInfo } from '@/api/auth'
import router from '@/router'

export default {
  namespaced: true,
  state: {
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    error: null
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },
    SET_USER(state, user) {
      state.user = user
      if (user && user.id) {
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('userId', user.id)
        localStorage.setItem('isAdmin', user.is_admin ? 'true' : 'false')
      } else {
        localStorage.removeItem('user')
        localStorage.removeItem('userId')
        localStorage.removeItem('isAdmin')
      }
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    CLEAR_AUTH(state) {
      state.token = ''
      state.user = null
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userId')
      localStorage.removeItem('isAdmin')
    }
  },
  actions: {
    async login({ commit, dispatch }, credentials) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        console.log('开始登录流程')
        const response = await loginApi(credentials)
        console.log('登录响应:', response)
        
        if (response && response.access_token) {
          // 确保 token 是字符串类型
          const token = String(response.access_token).trim()
          console.log('设置 token:', token)
          commit('SET_TOKEN', token)
          
          // 构建初始用户对象
          const user = {
            id: String(response.user_id),
            username: response.username,
            email: response.email,
            is_admin: response.is_admin,
            created_at: response.created_at
          }
          
          // 保存用户数据
          commit('SET_USER', user)
          console.log('登录成功，用户ID:', user.id)
          
          // 立即获取最新的用户信息
          try {
            await dispatch('fetchUserInfo')
          } catch (error) {
            console.warn('获取用户信息失败:', error)
          }
          
          return response
        } else {
          throw new Error('登录响应缺少访问令牌')
        }
      } catch (error) {
        console.error('登录失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async register(_, userData) {
      await register(userData)
      return true
    },
    async fetchUserInfo({ commit, state }) {
      if (!state.token) {
        console.warn('未找到 token，无法获取用户信息')
        commit('CLEAR_AUTH')
        return
      }
      
      try {
        console.log('开始获取用户信息')
        const user = await getUserInfo()
        console.log('获取到的用户信息:', user)
        
        if (user && user.id) {
          // 确保用户 ID 是字符串类型
          user.id = String(user.id)
          commit('SET_USER', user)
          return user
        } else {
          console.error('获取到的用户信息无效:', user)
          commit('CLEAR_AUTH')
          throw new Error('获取用户信息失败：数据格式不正确')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        commit('CLEAR_AUTH')
        throw error
      }
    },
    async updateUser({ commit, state }, userData) {
      try {
        if (!userData.id) {
          throw new Error('用户ID不能为空')
        }
        
        const { id, ...data } = userData
        
        // 尝试通过API更新用户信息
        try {
          const response = await updateUserInfo(id, data)
          if (response && response.user) {
            commit('SET_USER', response.user)
            return response.user
          }
        } catch (apiError) {
          console.error('通过API更新用户信息失败:', apiError)
          
          // 如果API更新失败，并且用户正在更新自己的资料，尝试客户端更新
          if (state.user && String(state.user.id) === String(id)) {
            console.log('使用客户端回退机制更新用户资料')
            
            // 创建本地更新的用户对象
            const updatedUser = {
              ...state.user,
              ...data,
              id: state.user.id,  // 保留原始ID
              is_admin: state.user.is_admin  // 保留原始管理员状态
            }
            
            // 更新本地存储
            commit('SET_USER', updatedUser)
            
            // 返回带有客户端处理标志的结果
            return {
              ...updatedUser,
              client_processed: true
            }
          }
          
          // 如果不是更新自己或者有其他问题，则抛出错误
          throw apiError
        }
      } catch (error) {
        console.error('更新用户失败:', error)
        throw error
      }
    },
    logout({ commit }) {
      commit('CLEAR_AUTH')
      router.push('/login')
    }
  },
  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
    isAdmin: state => state.user && state.user.is_admin === true,
    authError: state => state.error,
    isLoading: state => state.loading
  }
}