import api from './config'
import { getMovieById } from './movies' // 导入getMovieById函数

export const getScreenings = async (movieId) => {
  try {
    // 当没有指定 movieId 时获取所有场次，有 movieId 时获取指定电影的场次
    const url = movieId ? `/screenings/movie/${movieId}` : '/screenings'
    console.log(`获取放映场次列表, URL: ${url}`)
    
    const response = await api.get(url)
    console.log('获取到的放映场次列表:', response)
    
    // 确保返回的是数组
    if (!response || !Array.isArray(response)) {
      console.error('放映场次数据格式不正确:', response)
      return []
    }
    
    // 对场次按放映时间排序（升序）
    const sortedScreenings = [...response].sort((a, b) => {
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

// 适用于从URL '/booking/:screeningId' 中获取放映场次
// 这个实现提供了多种方式尝试获取特定ID的场次
export const getScreeningById = async (id) => {
  console.log('获取放映场次详情，ID:', id)
  
  // 确保 ID 是整数，并且请求 URL 是正确的
  const screeningId = parseInt(id, 10)
  if (isNaN(screeningId)) {
    console.error('无效的放映场次 ID:', id)
    return Promise.reject(new Error('无效的放映场次ID'))
  }
  
  try {
    // 尝试获取放映场次信息 - 确保使用 /screenings/{id} 格式
    console.log(`请求放映场次: /screenings/${screeningId}`)
    let response = await api.get(`/screenings/${screeningId}`)
    console.log('放映场次响应:', response)
    
    // 如果响应是有效对象，并且不是空数组，直接使用它
    if (response && typeof response === 'object' && !Array.isArray(response) && Object.keys(response).length > 0) {
      console.log('得到有效对象响应，直接使用')
      return await enrichScreeningWithMovie(processScreeningData(response));
    }
    
    // 如果响应是数组，尝试查找匹配的场次
    if (Array.isArray(response) && response.length > 0) {
      const screening = response.find(item => parseInt(item.id, 10) === screeningId);
      if (screening) {
        console.log('在数组响应中找到匹配场次')
        return await enrichScreeningWithMovie(processScreeningData(screening));
      }
    }
    
    // 方法1：尝试从所有场次中查找
    console.log('从单个端点未获取到有效数据，尝试从所有场次中查找')
    const allScreenings = await getScreenings()
    
    if (Array.isArray(allScreenings) && allScreenings.length > 0) {
      const screening = allScreenings.find(item => parseInt(item.id, 10) === screeningId)
      if (screening) {
        console.log('在所有场次中找到匹配场次')
        return await enrichScreeningWithMovie(processScreeningData(screening));
      }
    }
    
    // 方法2：尝试获取所有电影，然后获取每个电影的场次
    console.log('尝试从所有电影的场次中查找')
    const movies = await api.get('/movies')
    
    if (Array.isArray(movies)) {
      for (const movie of movies) {
        const movieId = parseInt(movie.id, 10)
        console.log(`检查电影ID=${movieId}的场次`)
        
        try {
          const movieScreenings = await getScreenings(movieId)
          
          if (Array.isArray(movieScreenings)) {
            const screening = movieScreenings.find(item => parseInt(item.id, 10) === screeningId)
            
            if (screening) {
              console.log(`在电影 ${movie.title} (ID=${movieId}) 的场次中找到匹配场次`)
              const result = processScreeningData(screening);
              result.movie = movie;
              return result;
            }
          }
        } catch (err) {
          console.warn(`获取电影 ${movieId} 的场次失败:`, err)
          continue;
        }
      }
    }
    
    // 方法3：尝试直接构建一个基本的场次对象（紧急情况下使用）
    console.log('无法找到场次，尝试通过创建虚拟场次回退')
    const fallbackScreening = {
      id: screeningId,
      movie_id: 0,
      theater: '加载中...',
      hall: '加载中...',
      screening_time: new Date().toISOString().replace('T', ' ').substring(0, 16),
      price: 0,
      movie: {
        id: 0,
        title: '加载中...',
        director: '',
        actors: '',
        duration: 0,
        poster_url: '',
        rating: 0
      }
    };
    
    return fallbackScreening;
  } catch (error) {
    console.error('获取放映场次失败:', error)
    throw error
  }
}

// 新增：确保放映场次包含完整的电影信息
async function enrichScreeningWithMovie(screening) {
  if (!screening) return null;
  
  // 如果已经有完整的电影信息(包含标题和其他详细信息)，直接返回
  if (screening.movie && screening.movie.title && screening.movie.title !== '未知电影' && screening.movie.director) {
    console.log('放映场次已包含完整电影信息，无需获取')
    return screening;
  }
  
  // 如果有movie_id但没有完整的电影信息，尝试获取电影详情
  if (screening.movie_id) {
    try {
      console.log(`获取电影详情，ID: ${screening.movie_id}`)
      const movieData = await getMovieById(screening.movie_id)
      
      if (movieData && movieData.id) {
        console.log(`成功获取电影信息: ${movieData.title}`)
        screening.movie = movieData;
      } else {
        console.warn(`无法获取电影信息，ID: ${screening.movie_id}`)
      }
    } catch (error) {
      console.error(`获取电影信息失败，ID: ${screening.movie_id}`, error)
      // 如果获取失败，至少确保movie对象存在
      if (!screening.movie) {
        screening.movie = {
          id: screening.movie_id,
          title: '未知电影',
          director: '',
          actors: '',
          duration: 0,
          poster_url: '',
          rating: 0
        };
      }
    }
  }
  
  return screening;
}

// 辅助函数：处理场次数据以确保一致性
function processScreeningData(screening) {
  if (!screening) return null;
  
  // 创建新对象以避免修改原始数据
  const result = { ...screening };
  
  // 确保ID是整数
  result.id = parseInt(result.id, 10);
  
  // 确保movie_id是整数
  if (result.movie_id) {
    result.movie_id = parseInt(result.movie_id, 10);
  }
  
  // 确保价格是浮点数
  if (result.price) {
    result.price = parseFloat(result.price);
  }
  
  // 处理电影信息
  if (result.movie && typeof result.movie === 'object') {
    // 已有电影信息，确保字段格式正确
    result.movie.id = parseInt(result.movie.id || 0, 10);
    result.movie.duration = parseInt(result.movie.duration || 0, 10);
    result.movie.rating = parseFloat(result.movie.rating || 0);
  } else if (result.movie_id) {
    // 有movie_id但没有电影信息，设置默认电影对象
    result.movie = {
      id: result.movie_id,
      title: '未知电影',
      director: '',
      actors: '',
      duration: 0,
      poster_url: '',
      rating: 0
    };
  }
  
  return result;
}

export const createScreening = (data) => {
  // 确保日期格式正确
  const formattedData = { ...data };
  
  // 处理日期格式，确保符合后端接收格式 'YYYY-MM-DD HH:mm'
  if (formattedData.screening_time) {
    // 检测是否是ISO格式 (例如 '2025-04-27T16:00')
    if (formattedData.screening_time.includes('T')) {
      console.log('正在转换ISO日期格式:', formattedData.screening_time);
      // 转换为 'YYYY-MM-DD HH:mm' 格式
      formattedData.screening_time = formattedData.screening_time.replace('T', ' ');
    }
    
    // 确保时间格式中有分钟，如果没有，添加":00"
    if (formattedData.screening_time.match(/^\d{4}-\d{2}-\d{2} \d{2}$/)) {
      formattedData.screening_time += ':00';
    }
    
    console.log('发送到后端的日期格式:', formattedData.screening_time);
  }
  
  return api.post('/screenings', formattedData);
}

export const updateScreening = (id, data) => {
  // 确保日期格式正确
  const formattedData = { ...data };
  
  // 处理日期格式，确保符合后端接收格式 'YYYY-MM-DD HH:mm'
  if (formattedData.screening_time) {
    // 检测是否是ISO格式 (例如 '2025-04-27T16:00')
    if (formattedData.screening_time.includes('T')) {
      console.log('正在转换ISO日期格式:', formattedData.screening_time);
      // 转换为 'YYYY-MM-DD HH:mm' 格式
      formattedData.screening_time = formattedData.screening_time.replace('T', ' ');
    }
    
    // 确保时间格式中有分钟，如果没有，添加":00"
    if (formattedData.screening_time.match(/^\d{4}-\d{2}-\d{2} \d{2}$/)) {
      formattedData.screening_time += ':00';
    }
    
    console.log('发送到后端的日期格式:', formattedData.screening_time);
  }
  
  return api.put(`/screenings/${id}`, formattedData);
}

export const deleteScreening = (id) => {
  return api.delete(`/screenings/${id}`)
}