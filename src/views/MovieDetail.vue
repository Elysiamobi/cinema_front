<template>
  <div class="movie-detail">
    <el-card v-if="movie" class="movie-card">
      <div class="movie-header">
        <img :src="movie.poster_url || 'https://cdn.jsdelivr.net/gh/Elysiamobi/images/imageFiles/202503272303463.png'" 
             class="movie-poster"
             @error="handleImageError">
        <div class="movie-info">
          <h1>{{ movie.title }}</h1>
          <p class="director">导演：{{ movie.director }}</p>
          <p class="actors">主演：{{ movie.actors }}</p>
          <p class="duration">片长：{{ movie.duration }}分钟</p>
          <p class="release-date">上映日期：{{ movie.release_date }}</p>
          <p class="rating">评分：{{ movie.rating }}</p>
        </div>
      </div>
      
      <div class="movie-description">
        <h2>剧情简介</h2>
        <p>{{ movie.description }}</p>
      </div>

      <div class="screenings">
        <h2>放映场次</h2>
        <el-table :data="screenings" v-loading="loading">
          <el-table-column prop="screening_time" label="放映时间">
            <template #default="{ row }">
              {{ formatDateTime(row.screening_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="hall" label="影厅"></el-table-column>
          <el-table-column prop="price" label="价格">
            <template #default="{ row }">
              ¥{{ row.price }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" @click="handleBooking(row)">购票</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'MovieDetailPage',
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const movie = ref(null)
    const screenings = ref([])
    const loading = ref(false)

    const formatDateTime = (datetime) => {
      return new Date(datetime).toLocaleString()
    }

    const handleBooking = (screening) => {
      console.log('点击购票, screening:', screening); // 添加日志
      if (!screening || !screening.id) {
        ElMessage.error('无效的放映场次')
        return
      }
      router.push(`/booking/${screening.id}`)
    }

    const handleImageError = (e) => {
      e.target.src = 'https://cdn.jsdelivr.net/gh/Elysiamobi/images/imageFiles/202503272303463.png'
    }

    onMounted(async () => {
      const movieId = route.params.id
      try {
        loading.value = true
        
        // 获取电影信息
        const movieData = await store.dispatch('movies/fetchMovieById', movieId)
        movie.value = movieData
        
        // 获取该电影的放映场次并按时间排序
        const screeningsData = await store.dispatch('screenings/fetchScreeningsByMovie', movieId)
        console.log('原始场次数据:', screeningsData);
        
        // 确保数据是数组并排序
        if (Array.isArray(screeningsData)) {
          // 由于后端可能没有设置movie_id，简单显示所有场次
          // 不再过滤场次，直接显示API返回的所有场次数据
          // 按放映时间升序排序
          screenings.value = screeningsData.sort((a, b) => {
            const timeA = new Date(a.screening_time || 0)
            const timeB = new Date(b.screening_time || 0)
            return timeA - timeB
          })
          
          console.log('处理后的放映场次:', screenings.value)
        } else {
          screenings.value = []
          console.error('获取到的放映场次数据不是数组:', screeningsData)
        }
      } catch (error) {
        console.error('获取电影信息失败:', error)
        ElMessage.error('获取电影信息失败')
      } finally {
        loading.value = false
      }
    })

    return {
      movie,
      screenings,
      loading,
      formatDateTime,
      handleBooking,
      handleImageError
    }
  }
}
</script>

<style scoped>
.movie-detail {
  padding: 20px;
}

.movie-card {
  max-width: 1200px;
  margin: 0 auto;
}

.movie-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.movie-poster {
  width: 300px;
  height: 450px;
  object-fit: cover;
}

.movie-info {
  flex: 1;
}

.movie-info h1 {
  margin: 0 0 20px 0;
  font-size: 24px;
}

.movie-info p {
  margin: 10px 0;
  color: #666;
}

.movie-description {
  margin: 20px 0;
}

.movie-description h2 {
  margin-bottom: 10px;
}

.screenings {
  margin-top: 20px;
}

.screenings h2 {
  margin-bottom: 20px;
}
</style>