import { getMovies, getMovieById, createMovie, updateMovie, deleteMovie } from '@/api/movies'

export default {
  namespaced: true,
  state: {
    movies: [],
    currentMovie: null,
    loading: false,
    error: null
  },
  mutations: {
    SET_MOVIES(state, movies) {
      state.movies = movies
    },
    SET_CURRENT_MOVIE(state, movie) {
      state.currentMovie = movie
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    }
  },
  actions: {
    async fetchMovies({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        console.log('开始获取电影列表')
        const response = await getMovies()
        
        if (!response || !Array.isArray(response)) {
          throw new Error('获取电影列表失败：数据格式不正确')
        }
        
        const formattedMovies = response.map(movie => ({
          id: parseInt(movie.id, 10),
          title: String(movie.title || ''),
          description: String(movie.description || ''),
          director: String(movie.director || ''),
          actors: String(movie.actors || ''),
          duration: parseInt(movie.duration || 0),
          release_date: String(movie.release_date || ''),
          poster_url: String(movie.poster_url || ''),
          rating: parseFloat(movie.rating || 0)
        }))
        
        // 按ID升序排序
        formattedMovies.sort((a, b) => a.id - b.id)
        
        console.log('处理后的电影列表:', formattedMovies)
        commit('SET_MOVIES', formattedMovies)
        return formattedMovies
      } catch (error) {
        console.error('获取电影列表失败:', error)
        commit('SET_ERROR', error.message)
        commit('SET_MOVIES', [])
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchMovieById({ commit }, id) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const movieId = parseInt(id, 10)
        if (isNaN(movieId)) {
          throw new Error('无效的电影ID')
        }
        
        const movie = await getMovieById(movieId)
        if (!movie || !movie.id) {
          throw new Error('获取电影信息失败：数据格式不正确')
        }
        
        const formattedMovie = {
          id: parseInt(movie.id, 10),
          title: String(movie.title || ''),
          description: String(movie.description || ''),
          director: String(movie.director || ''),
          actors: String(movie.actors || ''),
          duration: parseInt(movie.duration || 0),
          release_date: String(movie.release_date || ''),
          poster_url: String(movie.poster_url || ''),
          rating: parseFloat(movie.rating || 0)
        }
        
        commit('SET_CURRENT_MOVIE', formattedMovie)
        return formattedMovie
      } catch (error) {
        console.error('获取电影信息失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async createMovie({ dispatch }, movieData) {
      try {
        const formattedData = {
          title: String(movieData.title || '').trim(),
          description: String(movieData.description || '').trim(),
          director: String(movieData.director || '').trim(),
          actors: String(movieData.actors || '').trim(),
          duration: parseInt(movieData.duration || 0),
          release_date: String(movieData.release_date || ''),
          poster_url: String(movieData.poster_url || '').trim(),
          rating: parseFloat(movieData.rating || 0)
        }
        
        // 确保标题不为空
        if (!formattedData.title) {
          throw new Error('电影标题不能为空')
        }
        
        console.log('创建电影，处理后的数据:', formattedData)
        await createMovie(formattedData)
        return dispatch('fetchMovies')
      } catch (error) {
        console.error('创建电影失败:', error)
        throw error
      }
    },
    async updateMovie({ dispatch }, movieData) {
      try {
        console.log('更新电影数据:', movieData)
        
        // 处理电影数据，支持两种格式：直接对象或{id, data}格式
        let movieId, updateData;
        
        if (movieData.data) {
          // 处理 {id, data} 格式
          movieId = parseInt(movieData.id, 10);
          updateData = { ...movieData.data };
        } else {
          // 处理直接传入电影对象的情况
          movieId = parseInt(movieData.id, 10);
          updateData = { ...movieData };
          delete updateData.id;
        }
        
        // 验证ID
        if (isNaN(movieId) || movieId <= 0) {
          throw new Error('无效的电影ID');
        }
        
        // 确保数据格式正确
        const formattedData = {
          title: String(updateData.title || '').trim(),
          director: String(updateData.director || ''),
          actors: String(updateData.actors || ''),
          duration: parseInt(updateData.duration || 0, 10),
          release_date: String(updateData.release_date || ''),
          poster_url: String(updateData.poster_url || ''),
          rating: parseFloat(updateData.rating || 0),
          description: String(updateData.description || '')
        }
        
        // 确保标题不为空
        if (!formattedData.title) {
          throw new Error('电影标题不能为空')
        }
        
        console.log(`更新电影 ID:${movieId}, 数据:`, formattedData)
        
        // 发送更新请求
        const response = await updateMovie(movieId, formattedData)
        console.log('电影更新响应:', response)
        
        // 更新本地状态
        await dispatch('fetchMovies')
        return response
      } catch (error) {
        console.error('更新电影失败:', error)
        throw error
      }
    },
    async deleteMovie({ dispatch }, id) {
      try {
        const movieId = parseInt(id, 10)
        if (isNaN(movieId)) {
          throw new Error('无效的电影ID')
        }
        
        await deleteMovie(movieId)
        return dispatch('fetchMovies')
      } catch (error) {
        console.error('删除电影失败:', error)
        throw error
      }
    }
  },
  getters: {
    allMovies: state => state.movies,
    currentMovie: state => state.currentMovie,
    loading: state => state.loading,
    error: state => state.error
  }
}