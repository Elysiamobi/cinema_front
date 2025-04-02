import { getOrders, getOrderById, createOrder, updateOrderStatus, getUserOrders } from '@/api/orders'

export default {
  namespaced: true,
  state: {
    orders: [],
    userOrders: [],
    currentOrder: null,
    loading: false,
    error: null
  },
  mutations: {
    SET_ORDERS(state, orders) {
      state.orders = orders
    },
    SET_USER_ORDERS(state, orders) {
      state.userOrders = orders
    },
    SET_CURRENT_ORDER(state, order) {
      state.currentOrder = order
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    UPDATE_ORDER_STATUS(state, { id, status }) {
      console.log(`更新本地订单状态: ID=${id}, status=${status}`)
      // 更新所有订单中的状态
      const orderIndex = state.orders.findIndex(order => order.id === parseInt(id, 10))
      if (orderIndex !== -1) {
        console.log(`在所有订单中找到订单 #${id}，更新状态为 ${status}`)
        state.orders[orderIndex].status = status
      }
      
      // 更新用户订单中的状态
      const userOrderIndex = state.userOrders.findIndex(order => order.id === parseInt(id, 10))
      if (userOrderIndex !== -1) {
        console.log(`在用户订单中找到订单 #${id}，更新状态为 ${status}`)
        state.userOrders[userOrderIndex].status = status
      }
      
      // 更新当前订单的状态（如果存在）
      if (state.currentOrder && state.currentOrder.id === parseInt(id, 10)) {
        console.log(`当前订单是 #${id}，更新状态为 ${status}`)
        state.currentOrder.status = status
      }
    }
  },
  actions: {
    async fetchOrders({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        console.log('开始获取订单列表')
        const response = await getOrders()
        
        if (!response || !Array.isArray(response)) {
          throw new Error('获取订单列表失败：数据格式不正确')
        }
        
        const formattedOrders = response.map(order => ({
          id: parseInt(order.id, 10),
          user: {
            id: parseInt(order.user?.id, 10),
            username: String(order.user?.username || ''),
            email: String(order.user?.email || '')
          },
          movie: {
            id: parseInt(order.movie?.id, 10),
            title: String(order.movie?.title || ''),
            poster_url: String(order.movie?.poster_url || '')
          },
          screening: {
            id: parseInt(order.screening?.id, 10),
            theater: String(order.screening?.theater || ''),
            hall: String(order.screening?.hall || ''),
            screening_time: String(order.screening?.screening_time || ''),
            price: parseFloat(order.screening?.price || 0)
          },
          seats: Array.isArray(order.seats) ? order.seats : 
                 (typeof order.seats === 'string' ? JSON.parse(order.seats) : []),
          total_price: parseFloat(order.total_price || 0),
          status: String(order.status || 'pending'),
          created_at: String(order.created_at || '')
        }))
        
        // Sort orders by ID in ascending order
        formattedOrders.sort((a, b) => a.id - b.id)
        
        console.log('处理后的订单列表:', formattedOrders)
        commit('SET_ORDERS', formattedOrders)
        return formattedOrders
      } catch (error) {
        console.error('获取订单列表失败:', error)
        commit('SET_ERROR', error.message)
        commit('SET_ORDERS', [])
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchUserOrders({ commit, rootGetters }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        console.log('开始获取用户订单列表')
        
        // 获取当前用户信息
        const currentUser = rootGetters['auth/currentUser']
        if (!currentUser || !currentUser.id) {
          throw new Error('未登录或用户信息无效')
        }
        
        const response = await getUserOrders()
        
        if (!response || !Array.isArray(response)) {
          throw new Error('获取用户订单列表失败：数据格式不正确')
        }
        
        const formattedOrders = response.map(order => ({
          id: parseInt(order.id, 10),
          movie: {
            id: parseInt(order.movie?.id, 10),
            title: String(order.movie?.title || ''),
            poster_url: String(order.movie?.poster_url || '')
          },
          screening: {
            id: parseInt(order.screening?.id, 10),
            theater: String(order.screening?.theater || ''),
            hall: String(order.screening?.hall || ''),
            screening_time: String(order.screening?.screening_time || ''),
            price: parseFloat(order.screening?.price || 0)
          },
          seats: Array.isArray(order.seats) ? order.seats : 
                 (typeof order.seats === 'string' ? JSON.parse(order.seats) : []),
          total_price: parseFloat(order.total_price || 0),
          status: String(order.status || 'pending'),
          created_at: String(order.created_at || '')
        }))
        
        // Sort user orders by ID in ascending order
        formattedOrders.sort((a, b) => a.id - b.id)
        
        console.log('处理后的用户订单列表:', formattedOrders)
        commit('SET_USER_ORDERS', formattedOrders)
        return formattedOrders
      } catch (error) {
        console.error('获取用户订单列表失败:', error)
        commit('SET_ERROR', error.message)
        commit('SET_USER_ORDERS', [])
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchOrderById({ commit }, id) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const order = await getOrderById(id)
        
        if (!order) {
          throw new Error('未找到订单')
        }
        
        const formattedOrder = {
          ...order,
          id: parseInt(order.id, 10) || 0,
          user_id: parseInt(order.user_id, 10) || 0,
          screening_id: parseInt(order.screening_id, 10) || 0,
          total_price: parseFloat(order.total_price || 0),
          seats: processSeatsData(order.seats),
          status: order.status || 'pending',
          created_at: order.created_at || null,
          screening: order.screening ? {
            ...order.screening,
            id: parseInt(order.screening.id, 10) || 0,
            price: parseFloat(order.screening.price || 0)
          } : null,
          movie: order.movie ? {
            ...order.movie,
            id: parseInt(order.movie.id, 10) || 0
          } : null,
          user: order.user ? {
            ...order.user,
            id: parseInt(order.user.id, 10) || 0
          } : null
        }
        
        commit('SET_CURRENT_ORDER', formattedOrder)
        return formattedOrder
      } catch (error) {
        console.error('获取订单详情失败:', error)
        commit('SET_ERROR', error.message || '获取订单详情失败')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async createOrder({ dispatch }, orderData) {
      try {
        const formattedData = {
          screening_id: parseInt(orderData.screening_id, 10),
          seats: Array.isArray(orderData.seats) ? orderData.seats : 
                 (typeof orderData.seats === 'string' ? JSON.parse(orderData.seats) : []),
          total_price: parseFloat(orderData.total_price || 0)
        }
        
        console.log('创建订单，处理后的数据:', formattedData)
        await createOrder(formattedData)
        return dispatch('fetchUserOrders')
      } catch (error) {
        console.error('创建订单失败:', error)
        throw error
      }
    },
    async updateOrderStatus({ commit }, { id, status }) {
      try {
        console.log(`更新订单状态: ID=${id}, status=${status}`)
        
        if (!id) {
          throw new Error('订单ID不能为空')
        }
        
        if (!status) {
          throw new Error('订单状态不能为空')
        }
        
        // 后端API接受的状态值: "pending", "paid", "cancelled"
        // 1. 对于"completed"状态，需要在API层转为"paid"
        // 2. 前端状态存储保持一致，使用统一的状态名称
        // 3. 后端API负责将"paid"映射为数据库的"confirmed"状态
        
        // 调用API更新状态
        const result = await updateOrderStatus(id, status)
        console.log('更新订单状态响应:', result)
        
        // 在本地状态中更新订单状态，保持前端状态一致
        commit('UPDATE_ORDER_STATUS', { id, status })
        
        return result
      } catch (error) {
        console.error('更新订单状态失败:', error)
        throw error
      }
    },
    // 获取某场次已售出的座位
    async fetchPaidSeats({ dispatch }, screeningId) {
      try {
        if (!screeningId) {
          throw new Error('场次ID不能为空')
        }
        
        screeningId = parseInt(screeningId, 10);
        console.log('获取已售座位，场次ID:', screeningId)
        
        try {
          // 先尝试获取所有订单，这样能获取到所有用户的订单
          await dispatch('fetchOrders')
        } catch (e) {
          console.warn('获取所有订单失败，将只检查当前用户的订单:', e)
        }
        
        // 尝试获取当前用户的订单
        try {
          await dispatch('fetchUserOrders')
        } catch (e) {
          console.warn('获取用户订单失败:', e)
        }
        
        // 合并所有订单和用户订单，并去重
        const allOrders = [
          ...this.state.orders.orders,  // 所有订单
          ...this.state.orders.userOrders  // 用户自己的订单
        ]
        
        // 去除重复订单（可能同时存在于allOrders和userOrders中）
        const uniqueOrders = allOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.id === order.id)
        );
        
        console.log('所有可能的订单:', uniqueOrders)
        
        // 过滤出指定场次的已支付订单
        if (!uniqueOrders || !uniqueOrders.length) {
          console.warn('没有找到任何订单')
          return []
        }
        
        // 这里需要考虑前端和后端状态名的差异
        // API和前端使用：pending, paid, cancelled
        // 数据库使用：pending, confirmed, completed, cancelled
        // 但是用户界面会看到：pending, paid, confirmed, completed, cancelled
        const paidOrders = uniqueOrders.filter(order => {
          // 检查订单screening_id是否匹配
          const orderScreeningId = parseInt(order.screening_id || order.screening?.id, 10);
          
          // 检查多种表示"已支付"的状态
          // 在整个系统中，"paid"、"confirmed"和"completed"都表示已支付状态
          const isPaidStatus = 
            order.status === 'confirmed' || 
            order.status === 'completed' || 
            order.status === 'paid';
          
          const isMatch = orderScreeningId === screeningId && isPaidStatus;
          if (isMatch) {
            console.log('找到已售座位订单:', order)
          }
          return isMatch;
        })
        
        console.log('获取到已付款订单:', paidOrders)
        return paidOrders
      } catch (error) {
        console.error('获取已售座位失败:', error)
        return [] // 出错时返回空数组，以免阻止页面加载
      }
    }
  },
  getters: {
    allOrders: state => state.orders,
    userOrders: state => state.userOrders,
    currentOrder: state => state.currentOrder,
    loading: state => state.loading,
    error: state => state.error
  }
}

// 辅助函数：处理座位数据
function processSeatsData(seats) {
  // 如果为空，返回空数组
  if (!seats) return []
  
  // 如果是数组，直接返回
  if (Array.isArray(seats)) return seats
  
  // 如果是字符串，尝试解析JSON
  if (typeof seats === 'string') {
    try {
      return JSON.parse(seats)
    } catch (e) {
      // 如果解析失败，尝试按逗号分隔
      return seats.split(',')
    }
  }
  
  // 其他情况，转为字符串再尝试处理
  return String(seats).split(',')
}