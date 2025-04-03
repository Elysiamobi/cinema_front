import api from './config'

export const login = async credentials => {
  console.log('发送登录请求:', credentials.username)
  const response = await api.post('/login', credentials)
  console.log('登录响应:', response)
  return response
}

export const register = async userData => {
  console.log('发送注册请求:', userData.username)
  const response = await api.post('/register', userData)
  console.log('注册响应:', response)
  return response
}

export const getUserInfo = async () => {
  console.log('发送获取用户信息请求')
  try {
    const response = await api.get('/users/current')
    console.log('获取用户信息响应:', response)
    return response
  } catch (error) {
    console.error('获取用户信息错误:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    throw error
  }
}

export const updateUserInfo = async (userId, userData) => {
  console.log('发送更新用户信息请求:', { userId, userData })
  try {
    // 先尝试使用用户自己的个人资料更新端点
    if (userId === parseInt(localStorage.getItem('userId'), 10)) {
      try {
        console.log('尝试使用当前用户端点更新个人资料')
        const response = await api.put('/users/current/profile', userData)
        console.log('更新用户信息响应 (当前用户端点):', response)
        return response
      } catch (currentUserError) {
        console.log('当前用户端点更新失败，尝试标准端点:', currentUserError)
        // 如果用户专用端点失败，继续尝试标准端点（管理员可用）
      }
    }
    
    // 使用标准管理员端点
    const response = await api.put(`/users/${userId}`, userData)
    console.log('更新用户信息响应 (标准端点):', response)
    return response
  } catch (error) {
    console.error('更新用户信息失败:', error)
    throw error
  }
}