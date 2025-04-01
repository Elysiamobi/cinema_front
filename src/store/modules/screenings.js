import axios from 'axios'

export default {
  namespaced: true,
  state: {
    screenings: [],
    currentScreening: null,
    loading: false,
    error: null
  },
  mutations: {
    setScreenings(state, screenings) {
      state.screenings = screenings
    },
    setCurrentScreening(state, screening) {
      state.currentScreening = screening
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    }
  },
  actions: {
    async fetchScreeningsByMovie({ commit }, movieId) {
      commit('setLoading', true)
      try {
        const response = await axios.get(`http://localhost:5000/api/screenings/${movieId}`)
        commit('setScreenings', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response.data)
        throw error.response.data
      } finally {
        commit('setLoading', false)
      }
    },
    async fetchScreeningById({ commit }, id) {
      commit('setLoading', true)
      try {
        const response = await axios.get(`http://localhost:5000/api/screenings/${id}`)
        commit('setCurrentScreening', response.data)
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
    allScreenings: state => state.screenings,
    currentScreening: state => state.currentScreening,
    isLoading: state => state.loading,
    error: state => state.error
  }
} 