import api from './config'

export const getUsers = async () => {
  try {
    console.log('请求用户列表API')
    const token = localStorage.getItem('token')
    console.log('当前token:', token)
    
    if (!token) {
      throw new Error('未登录或登录已过期')
    }

    const response = await api.get('/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('获取用户列表成功:', response)
    return response
  } catch (error) {
    console.error('获取用户列表错误:', error)
    console.error('错误响应数据:', error.response?.data)
    console.error('错误状态码:', error.response?.status)
    console.error('错误头信息:', error.response?.headers)
    throw error
  }
}

export const getUserById = async (id) => {
  try {
    const response = await api.get(`/users/${id}`)
    return response
  } catch (error) {
    console.error('获取用户详情失败:', error)
    throw error
  }
}

export const createUser = async (userData) => {
  try {
    console.log('创建用户，原始数据:', userData)
    
    // 处理数据
    const processedData = {
      username: userData.username.trim(),
      email: userData.email.trim(),
      password: userData.password,
      is_admin: Boolean(userData.is_admin)
    }
    
    console.log('创建用户，处理后的数据:', processedData)
    const response = await api.post('/users', processedData)
    return response
  } catch (error) {
    console.error('创建用户失败:', error)
    throw error
  }
}

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData)
    return response
  } catch (error) {
    console.error('更新用户失败:', error)
    throw error
  }
}

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`)
    return response
  } catch (error) {
    console.error('删除用户失败:', error)
    throw error
  }
}

export const updateUserRole = async (id, isAdmin) => {
  try {
    const response = await api.put(`/users/${id}/role`, { is_admin: isAdmin })
    return response
  } catch (error) {
    console.error('更新用户角色失败:', error)
    throw error
  }
}