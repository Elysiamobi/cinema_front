import axios from 'axios'

export default {
  namespaced: true,
  state: {
    movies: [],
    currentMovie: null,
    loading: false,
    error: null
  },
  mutations: {
    setMovies(state, movies) {
      state.movies = movies
    },
    setCurrentMovie(state, movie) {
      state.currentMovie = movie
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    }
  },
  actions: {
    async fetchMovies({ commit }) {
      commit('setLoading', true)
      try {
        const response = await axios.get('http://localhost:5000/api/movies')
        commit('setMovies', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response.data)
        throw error.response.data
      } finally {
        commit('setLoading', false)
      }
    },
    async fetchMovieById({ commit }, id) {
      commit('setLoading', true)
      try {
        const response = await axios.get(`http://localhost:5000/api/movies/${id}`)
        commit('setCurrentMovie', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response.data)
        throw error.response.data
      } finally {
        commit('setLoading', false)
      }
    }
  },
  getters: {
    allMovies: state => state.movies,
    currentMovie: state => state.currentMovie,
    isLoading: state => state.loading,
    error: state => state.error
  }
} 