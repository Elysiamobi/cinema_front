import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 不需要认证的公开API路径
const publicPaths = [
  '/login', 
  '/register', 
  '/movies',  // 电影列表是公开的，不需要登录就能访问
  '/screenings' // 放映场次也应该是公开的
]

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 5000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 检查当前请求是否是公开路径
    const isPublicPath = publicPaths.some(path => config.url?.includes(path))
    console.log(`请求: ${config.url}, 是否公开路径: ${isPublicPath}`)

    // 从localStorage获取token
    const token = localStorage.getItem('token')
    
    // 如果有token，则设置Authorization请求头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      console.log('已设置token:', token.substring(0, 15) + '...')
    } else if (!isPublicPath) {
      // 非公开路径且没有token
      console.error('访问需要认证的路径但没有token:', config.url)
      // 在API调用中处理，不自动重定向
    }

    // 处理请求数据
    if (config.method === 'post' || config.method === 'put') {
      const data = config.data
      if (data) {
        // 处理数值类型
        if (data.duration) data.duration = parseInt(data.duration)
        if (data.price) data.price = parseFloat(data.price)
        if (data.total_price) data.total_price = parseFloat(data.total_price)
        if (data.rating) data.rating = parseFloat(data.rating)
        
        // 处理布尔类型
        if (data.is_admin !== undefined) data.is_admin = Boolean(data.is_admin)
        
        // 处理日期格式
        if (data.release_date) {
          data.release_date = new Date(data.release_date).toISOString().split('T')[0]
        }
        if (data.screening_time) {
          data.screening_time = new Date(data.screening_time).toISOString().slice(0, 16)
        }
        
        // 处理座位数据
        if (data.seats && typeof data.seats === 'string') {
          try {
            data.seats = JSON.parse(data.seats)
          } catch (e) {
            data.seats = data.seats.split(',').map(seat => seat.trim())
          }
        }
      }
    }

    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    const res = response.data
    
    // 处理响应数据
    if (Array.isArray(res)) {
      return res.map(item => processResponseData(item))
    } else if (typeof res === 'object' && res !== null) {
      return processResponseData(res)
    }
    
    return res
  },
  error => {
    console.error('响应错误:', error)
    const message = error.response?.data?.error || '请求失败'
    
    // 处理不同的错误状态码
    switch (error.response?.status) {
      case 401:
        ElMessage.error('未授权，请重新登录')
        // 清除token并跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('isAdmin')
        router.push('/login')
        break
      case 403:
        ElMessage.error('没有权限执行此操作')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 422:
        ElMessage.error('请求数据格式错误：' + message)
        break
      case 500:
        ElMessage.error('服务器错误，请稍后重试')
        break
      default:
        ElMessage.error(message)
    }
    
    return Promise.reject(error)
  }
)

// 处理响应数据的辅助函数
function processResponseData(data) {
  if (!data || typeof data !== 'object') return data
  
  const processed = { ...data }
  
  // 处理ID字段
  if (processed.id) processed.id = parseInt(processed.id)
  
  // 处理数值类型
  if (processed.duration) processed.duration = parseInt(processed.duration)
  if (processed.price) processed.price = parseFloat(processed.price)
  if (processed.total_price) processed.total_price = parseFloat(processed.total_price)
  if (processed.rating) processed.rating = parseFloat(processed.rating)
  
  // 处理布尔类型
  if (processed.is_admin !== undefined) processed.is_admin = Boolean(processed.is_admin)
  
  // 处理嵌套对象
  if (processed.user) processed.user = processResponseData(processed.user)
  if (processed.movie) processed.movie = processResponseData(processed.movie)
  if (processed.screening) processed.screening = processResponseData(processed.screening)
  
  // 处理座位数据
  if (processed.seats && typeof processed.seats === 'string') {
    try {
      processed.seats = JSON.parse(processed.seats)
    } catch (e) {
      processed.seats = processed.seats.split(',').map(seat => seat.trim())
    }
  }
  
  return processed
}

export default api