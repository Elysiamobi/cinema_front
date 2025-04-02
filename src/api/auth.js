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
    const response = await api.put(`/users/${userId}`, userData)
    console.log('更新用户信息响应:', response)
    return response
  } catch (error) {
    console.error('更新用户信息错误:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    throw error
  }
}