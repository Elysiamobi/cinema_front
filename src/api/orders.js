import api from './config'

export const getOrders = () => {
  return api.get('/orders')
}

export const getOrderById = (id) => {
  return api.get(`/orders/${id}`)
}

export const createOrder = (data) => {
  return api.post('/orders', data)
}

export const updateOrderStatus = async (id, status) => {
  console.log(`API - 更新订单状态: ID=${id}, status=${status}`)
  try {
    // 确保 status 是有效值 - 前端允许的值
    const frontendValidStatuses = ['pending', 'paid', 'cancelled', 'completed']
    if (!frontendValidStatuses.includes(status)) {
      throw new Error(`无效的订单状态: ${status}`)
    }
    
    // 根据错误消息: "Invalid status. Must be one of: pending, paid, cancelled"
    // 后端API 只接受这三种状态值
    let backendStatus = status;
    
    // 如果状态是completed，映射为paid（因为后端不接受completed）
    if (status === 'completed') {
      backendStatus = 'paid';
      console.log(`映射状态: 前端'completed' -> 后端API'paid'`);
    }
    
    // 后端API直接接受'paid'状态（不需要转换为'confirmed'）
    // 后端API会处理'paid'状态与数据库enum类型'confirmed'之间的映射
    
    console.log(`准备发送订单状态: ${backendStatus}`)
    
    // 确保API URL正确 - 不要在URL前加斜杠
    console.log(`发送订单状态更新请求 - 路径: orders/${id}, 状态: ${backendStatus}`)
    const response = await api.put(`orders/${id}`, { status: backendStatus })
    
    console.log('订单状态更新响应:', response)
    return response
  } catch (error) {
    console.error('更新订单状态时出错:', error)
    
    // 添加详细的错误日志，帮助调试
    if (error.response) {
      console.error('请求错误详情:', {
        status: error.response.status,
        data: error.response.data,
        message: error.message
      })
      
      // 解析后端错误消息并提供更明确的提示
      if (error.response.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          if (data.error) {
            console.error('后端错误消息:', data.error);
            error.message = data.error;
          } else if (data.message) {
            console.error('后端错误消息:', data.message);
            error.message = data.message;
          }
        }
      }
    }
    
    throw error
  }
}

export const getUserOrders = () => {
  return api.get('/users/current/orders')
}