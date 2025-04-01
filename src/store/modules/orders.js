import axios from 'axios'

export default {
  namespaced: true,
  state: {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null
  },
  mutations: {
    setOrders(state, orders) {
      state.orders = orders
    },
    setCurrentOrder(state, order) {
      state.currentOrder = order
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    }
  },
  actions: {
    async createOrder({ commit }, orderData) {
      commit('setLoading', true)
      try {
        const response = await axios.post('http://localhost:5000/api/orders', orderData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        return response.data
      } catch (error) {
        commit('setError', error.response.data)
        throw error.response.data
      } finally {
        commit('setLoading', false)
      }
    },
    async fetchUserOrders({ commit }) {
      commit('setLoading', true)
      try {
        const response = await axios.get('http://localhost:5000/api/orders', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        commit('setOrders', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response.data)
        throw error.response.data
      } finally {
        commit('setLoading', false)
      }
    },
    async updateOrderStatus({ commit }, { orderId, status }) {
      commit('setLoading', true)
      try {
        const response = await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
          { status },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        return response.data
      } catch (error) {
        commit('setError', error.response.data)
        throw error.response.data
      } finally {
        commit('setLoading', false)
      }
    }
  },
  getters: {
    allOrders: state => state.orders,
    currentOrder: state => state.currentOrder,
    isLoading: state => state.loading,
    error: state => state.error
  }
} 