import { getScreenings, getScreeningById, createScreening, updateScreening, deleteScreening } from '@/api/screenings'

export default {
  namespaced: true,
  state: {
    screenings: [],
    currentScreening: null,
    loading: false,
    error: null
  },
  mutations: {
    SET_SCREENINGS(state, screenings) {
      state.screenings = screenings
    },
    SET_CURRENT_SCREENING(state, screening) {
      state.currentScreening = screening
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    }
  },
  actions: {
    async fetchScreenings({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        console.log('开始获取放映场次列表')
        const response = await getScreenings()
        
        if (!response || !Array.isArray(response)) {
          throw new Error('获取放映场次列表失败：数据格式不正确')
        }
        
        const formattedScreenings = response.map(screening => ({
          id: parseInt(screening.id, 10),
          movie_id: parseInt(screening.movie_id, 10),
          theater: String(screening.theater || ''),
          hall: String(screening.hall || ''),
          screening_time: String(screening.screening_time || ''),
          price: parseFloat(screening.price || 0),
          created_at: String(screening.created_at || ''),
          updated_at: String(screening.updated_at || '')
        }))
        
        // 按ID升序排序
        formattedScreenings.sort((a, b) => a.id - b.id)
        
        console.log('处理后的放映场次列表:', formattedScreenings)
        commit('SET_SCREENINGS', formattedScreenings)
        return formattedScreenings
      } catch (error) {
        console.error('获取放映场次列表失败:', error)
        commit('SET_ERROR', error.message)
        commit('SET_SCREENINGS', [])
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchScreeningById({ commit }, id) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const screeningId = parseInt(id, 10)
        if (isNaN(screeningId)) {
          throw new Error('无效的放映场次ID')
        }
        
        console.log('开始获取放映场次，ID:', screeningId)
        const response = await getScreeningById(screeningId)
        console.log('获取放映场次响应:', response)
        
        if (!response || !response.id) {
          console.error('放映场次数据格式不正确:', response)
          throw new Error('获取放映场次信息失败：数据格式不正确')
        }
        
        // 构建格式化后的放映场次对象
        const formattedScreening = {
          id: parseInt(response.id, 10),
          movie_id: parseInt(response.movie_id, 10),
          theater: String(response.theater || ''),
          hall: String(response.hall || ''),
          screening_time: String(response.screening_time || ''),
          price: parseFloat(response.price || 0),
          created_at: String(response.created_at || ''),
          updated_at: String(response.updated_at || '')
        }
        
        // 如果有电影信息，添加到放映场次对象中
        if (response.movie) {
          formattedScreening.movie = {
            id: parseInt(response.movie.id, 10),
            title: String(response.movie.title || '未知电影'),
            director: String(response.movie.director || ''),
            actors: String(response.movie.actors || ''),
            duration: parseInt(response.movie.duration || 0),
            release_date: String(response.movie.release_date || ''),
            poster_url: String(response.movie.poster_url || ''),
            rating: parseFloat(response.movie.rating || 0),
            created_at: String(response.movie.created_at || ''),
            updated_at: String(response.movie.updated_at || '')
          }
        } else {
          // 如果没有电影信息，添加一个默认的电影对象
          formattedScreening.movie = {
            id: formattedScreening.movie_id,
            title: '未知电影',
            director: '',
            actors: '',
            duration: 0,
            release_date: '',
            poster_url: '',
            rating: 0,
            created_at: '',
            updated_at: ''
          }
        }
        
        console.log('处理后的放映场次:', formattedScreening)
        commit('SET_CURRENT_SCREENING', formattedScreening)
        return formattedScreening
      } catch (error) {
        console.error('获取放映场次信息失败:', error)
        commit('SET_ERROR', error.message)
        commit('SET_CURRENT_SCREENING', null)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchScreeningsByMovie({ commit }, movieId) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const id = parseInt(movieId, 10)
        if (isNaN(id)) {
          throw new Error('无效的电影ID')
        }
        
        const response = await getScreenings(id)
        if (!response || !Array.isArray(response)) {
          throw new Error('获取电影场次列表失败：数据格式不正确')
        }
        
        const formattedScreenings = response.map(screening => ({
          id: parseInt(screening.id, 10),
          movie_id: parseInt(screening.movie_id, 10),
          theater: String(screening.theater || ''),
          hall: String(screening.hall || ''),
          screening_time: String(screening.screening_time || ''),
          price: parseFloat(screening.price || 0),
          created_at: String(screening.created_at || ''),
          updated_at: String(screening.updated_at || '')
        }))
        
        // 按ID升序排序
        formattedScreenings.sort((a, b) => a.id - b.id)
        
        commit('SET_SCREENINGS', formattedScreenings)
        return formattedScreenings
      } catch (error) {
        console.error('获取电影场次列表失败:', error)
        commit('SET_ERROR', error.message)
        commit('SET_SCREENINGS', [])
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async createScreening({ dispatch }, screeningData) {
      try {
        const formattedData = {
          movie_id: parseInt(screeningData.movie_id, 10),
          theater: String(screeningData.theater),
          hall: String(screeningData.hall),
          screening_time: screeningData.screening_time,
          price: parseFloat(screeningData.price)
        }
        
        // 确保日期格式正确
        if (typeof formattedData.screening_time === 'string') {
          // 处理ISO格式日期（含有T的格式）
          if (formattedData.screening_time.includes('T')) {
            console.log('Store中转换前的日期格式:', formattedData.screening_time);
            formattedData.screening_time = formattedData.screening_time.replace('T', ' ');
            console.log('Store中转换后的日期格式:', formattedData.screening_time);
          }
          
          // 确保时间格式包含分钟
          if (formattedData.screening_time.match(/^\d{4}-\d{2}-\d{2} \d{2}$/)) {
            formattedData.screening_time += ':00';
            console.log('Store中添加分钟后的日期格式:', formattedData.screening_time);
          }
        }
        
        await createScreening(formattedData)
        await dispatch('fetchScreenings')
      } catch (error) {
        console.error('创建放映场次失败:', error)
        throw error
      }
    },
    async updateScreening({ dispatch }, { id, data }) {
      try {
        console.log('更新放映场次数据:', { id, data })
        
        // 验证场次ID
        const screeningId = parseInt(id, 10)
        if (isNaN(screeningId) || screeningId <= 0) {
          throw new Error('无效的放映场次ID')
        }
        
        // 验证数据
        if (!data || typeof data !== 'object') {
          throw new Error('更新数据无效')
        }
        
        // 确保格式正确
        const formattedData = {
          movie_id: parseInt(data.movie_id, 10),
          theater: String(data.theater || ''),
          hall: String(data.hall || ''),
          screening_time: String(data.screening_time || ''),
          price: parseFloat(data.price || 0)
        }
        
        // 确保日期格式正确
        if (typeof formattedData.screening_time === 'string') {
          // 处理ISO格式日期（含有T的格式）
          if (formattedData.screening_time.includes('T')) {
            console.log('Store更新前的日期格式:', formattedData.screening_time);
            formattedData.screening_time = formattedData.screening_time.replace('T', ' ');
            console.log('Store更新后的日期格式:', formattedData.screening_time);
          }
          
          // 确保时间格式包含分钟
          if (formattedData.screening_time.match(/^\d{4}-\d{2}-\d{2} \d{2}$/)) {
            formattedData.screening_time += ':00';
            console.log('Store更新时添加分钟后的日期格式:', formattedData.screening_time);
          }
        }
        
        console.log(`发送放映场次更新请求，ID:${screeningId}, 数据:`, formattedData)
        
        // 发送更新请求
        const response = await updateScreening(screeningId, formattedData)
        console.log('放映场次更新响应:', response)
        
        // 验证响应
        if (!response) {
          throw new Error('放映场次更新失败：无响应')
        }
        
        // 更新本地状态
        await dispatch('fetchScreenings')
        return response
      } catch (error) {
        console.error('更新放映场次失败:', error)
        throw error
      }
    },
    async deleteScreening({ dispatch }, id) {
      try {
        await deleteScreening(id)
        await dispatch('fetchScreenings')
      } catch (error) {
        console.error('删除放映场次失败:', error)
        throw error
      }
    }
  },
  getters: {
    allScreenings: state => state.screenings,
    currentScreening: state => state.currentScreening,
    loading: state => state.loading,
    error: state => state.error
  }
}