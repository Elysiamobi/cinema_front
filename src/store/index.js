import { createStore } from 'vuex'
import auth from './modules/auth'
import movies from './modules/movies'
import screenings from './modules/screenings'
import orders from './modules/orders'
import users from './modules/users'

export default createStore({
  modules: {
    auth,
    movies,
    screenings,
    orders,
    users
  }
})