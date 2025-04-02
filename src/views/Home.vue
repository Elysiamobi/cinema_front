<template>
  <div class="home">
    <h1>欢迎来到电影院</h1>
    <div class="movie-list">
      <el-row :gutter="20">
        <el-col v-for="movie in movies" :key="movie.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="movie-card" :body-style="{ padding: '0px' }">
            <img :src="movie.poster_url" class="movie-poster">
            <div class="movie-info">
              <h3>{{ movie.title }}</h3>
              <p>{{ movie.director }}</p>
              <el-button type="primary" @click="viewMovie(movie.id)">查看详情</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'HomePage',
  setup() {
    const store = useStore()
    const router = useRouter()

    const movies = computed(() => store.state.movies.movies)

    const viewMovie = (movieId) => {
      router.push(`/movie/${movieId}`)
    }

    onMounted(() => {
      store.dispatch('movies/fetchMovies')
    })

    return {
      movies,
      viewMovie
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
}

.movie-list {
  margin-top: 20px;
}

.movie-card {
  margin-bottom: 20px;
}

.movie-poster {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.movie-info {
  padding: 14px;
}

.movie-info h3 {
  margin: 0;
  font-size: 16px;
}

.movie-info p {
  margin: 8px 0;
  color: #666;
}
</style> 