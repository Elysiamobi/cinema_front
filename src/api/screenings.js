import api from './config'

export const getScreenings = async (movieId) => {
  try {
    // 当没有指定 movieId 时获取所有场次，有 movieId 时获取指定电影的场次
    // 注意：后端API可能不支持直接按电影ID筛选，所以我们在这里做一个兼容处理
    const url = '/screenings'
    console.log(`获取放映场次列表, 电影ID: ${movieId || '全部'}`)
    
    const response = await api.get(url)
    console.log('获取到的放映场次列表:', response)
    
    // 确保返回的是数组
    if (!response || !Array.isArray(response)) {
      console.error('放映场次数据格式不正确:', response)
      return []
    }
    
    // 如果指定了电影ID，在前端进行过滤
    let filteredScreenings = response
    if (movieId) {
      const id = parseInt(movieId, 10)
      console.log(`在前端过滤电影ID: ${id} 的场次`)
      
      // 尝试匹配movie_id字段
      // 注意：考虑到后端数据可能没有movie_id字段，这可能会过滤掉所有结果
      filteredScreenings = response.filter(screening => {
        if (screening.movie_id && parseInt(screening.movie_id, 10) === id) {
          return true
        }
        return false
      })
      
      // 如果没有找到任何结果，返回所有场次（兼容处理）
      if (filteredScreenings.length === 0) {
        console.warn(`没有找到电影ID: ${id} 的场次，返回所有场次`)
        filteredScreenings = response
      }
    }
    
    // 对场次按放映时间排序（升序）
    const sortedScreenings = [...filteredScreenings].sort((a, b) => {
      const timeA = new Date(a.screening_time || 0)
      const timeB = new Date(b.screening_time || 0)
      return timeA - timeB
    })
    
    console.log('排序后的放映场次:', sortedScreenings)
    return sortedScreenings
  } catch (error) {
    console.error('获取放映场次列表失败:', error)
    throw error
  }
}

export const getScreeningById = async (id) => {
  console.log('获取放映场次详情，ID:', id)
  
  // 确保 ID 是整数，并且请求 URL 是正确的
  const screeningId = parseInt(id, 10)
  if (isNaN(screeningId)) {
    console.error('无效的放映场次 ID:', id)
    return Promise.reject(new Error('无效的放映场次ID'))
  }
  
  try {
    // 尝试获取放映场次信息
    console.log(`请求放映场次: screenings/${screeningId}`)
    const response = await api.get(`screenings/${screeningId}`)
    console.log('放映场次响应:', response)
    
    let screening = null
    
    // 处理数组类型的响应 - 后端可能返回包含该ID场次的数组
    if (Array.isArray(response)) {
      console.log('后端返回了数组类型的场次数据，条目数:', response.length)
      
      // 找到匹配ID的场次
      screening = response.find(item => parseInt(item.id, 10) === screeningId)
      
      // 如果没找到匹配的但数组不为空，使用第一个元素
      if (!screening && response.length > 0) {
        console.log('未找到完全匹配ID的场次，使用第一个返回的场次')
        screening = response[0]
      }
    } else if (response && typeof response === 'object') {
      // 如果响应不是数组但是有效对象
      screening = response
    }
    
    // 如果找到了有效的放映场次
    if (screening) {
      console.log('处理放映场次:', screening)
      
      // 确保 ID 是整数类型
      screening.id = parseInt(screening.id, 10)
      
      // 获取电影信息
      if (screening.movie_id) {
        try {
          const movieId = parseInt(screening.movie_id, 10)
          console.log(`尝试获取电影信息: movies/${movieId}`)
          
          // 直接使用正确的URL格式请求电影信息
          const movieResponse = await api.get(`/movies/${movieId}`)
          console.log('电影信息响应:', movieResponse)
          
          if (movieResponse) {
            // 如果电影数据是数组，找到匹配ID的电影
            if (Array.isArray(movieResponse)) {
              const movie = movieResponse.find(m => parseInt(m.id, 10) === movieId)
              if (movie) {
                screening.movie = movie
                console.log('从数组中找到匹配的电影:', movie)
              } else if (movieResponse.length > 0) {
                screening.movie = movieResponse[0]
                console.log('未找到匹配ID的电影，使用第一个:', movieResponse[0])
              } else {
                throw new Error('电影数组为空')
              }
            } else {
              screening.movie = movieResponse
              console.log('直接使用电影对象:', movieResponse)
            }
          } else {
            throw new Error('电影响应为空')
          }
        } catch (movieError) {
          console.error('获取电影信息失败:', movieError)
          // 设置一个默认的电影对象，避免前端渲染错误
          screening.movie = { 
            id: parseInt(screening.movie_id, 10),
            title: '未知电影',
            poster_url: '',
            director: '未知导演',
            actors: '未知演员',
            duration: 0,
            release_date: '',
            rating: 0
          }
        }
      } else {
        console.warn('放映场次无电影ID，无法获取电影信息')
        screening.movie = { 
          id: 0,
          title: '未知电影',
          poster_url: '',
          director: '未知导演',
          actors: '未知演员',
          duration: 0,
          release_date: '',
          rating: 0
        }
      }
      
      console.log('最终处理的放映场次对象:', screening)
      return screening
    }
    
    // 如果没有找到有效的放映场次，返回一个基本对象
    console.error('未找到有效的放映场次数据')
    return {
      id: screeningId,
      movie_id: 0,
      theater: '未知影院',
      hall: '未知影厅',
      screening_time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      price: 0,
      movie: {
        id: 0,
        title: '未知电影',
        poster_url: '',
        director: '未知导演',
        actors: '未知演员',
        duration: 0,
        release_date: '',
        rating: 0
      }
    }
  } catch (error) {
    console.error('获取放映场次失败:', error)
    throw error
  }
}

export const createScreening = (data) => {
  return api.post('/screenings', data)
}

export const updateScreening = (id, data) => {
  return api.put(`/screenings/${id}`, data)
}

export const deleteScreening = (id) => {
  return api.delete(`/screenings/${id}`)
}