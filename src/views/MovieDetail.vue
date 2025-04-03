<template>
  <div class="movie-detail">
    <el-card v-if="movie" class="movie-card">
      <div class="movie-header">
        <div class="poster-container">
          <img :src="movie.poster_url || 'https://cdn.jsdelivr.net/gh/Elysiamobi/images/imageFiles/202503272303463.png'" 
               class="movie-poster"
               @error="handleImageError">
        </div>
        <div class="movie-info">
          <h1>{{ movie.title }}</h1>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">导演：</span>
              <span class="value">{{ movie.director }}</span>
            </div>
            <div class="info-item">
              <span class="label">主演：</span>
              <span class="value">{{ movie.actors }}</span>
            </div>
            <div class="info-item">
              <span class="label">片长：</span>
              <span class="value">{{ movie.duration }}分钟</span>
            </div>
            <div class="info-item">
              <span class="label">上映日期：</span>
              <span class="value">{{ movie.release_date }}</span>
            </div>
            <div class="info-item">
              <span class="label">评分：</span>
              <span class="value rating">
                <el-rate
                  v-model="movieRating"
                  disabled
                  text-color="#ff9900"
                  score-template="{value}"
                  :max="5"
                  show-score
                ></el-rate>
                <!-- <span>{{ movie.rating }}/5</span> -->
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="movie-description">
        <h2>剧情简介</h2>
        <p>{{ movie.description }}</p>
      </div>

      <div class="screenings">
        <h2>放映场次</h2>
        <el-table :data="screenings" v-loading="loading" stripe border>
          <el-table-column prop="screening_time" label="放映时间" min-width="160" align="center">
            <template #default="{ row }">
              {{ formatDateTime(row.screening_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="theater" label="影院" min-width="120" align="center"></el-table-column>
          <el-table-column prop="hall" label="影厅" min-width="100" align="center"></el-table-column>
          <el-table-column prop="price" label="价格" width="100" align="center">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                @click="handleBooking(row)" 
                size="small"
                icon="el-icon-shopping-cart-2"
              >
                购票
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <div v-else class="loading-container">
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-alert v-else-if="loading" title="正在加载电影信息..." type="info" :closable="false" />
      <el-alert v-else title="未找到电影信息" type="warning" :closable="false" />
    </div>
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
    const error = ref(null)
    const movieRating = ref(0)

    const formatDateTime = (datetime) => {
      if (!datetime) return '未设置'
      try {
        const date = new Date(datetime)
        return date.toLocaleString('zh-CN', {
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit'
        })
      } catch (error) {
        console.error('日期格式化错误:', error)
        return datetime
      }
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
        error.value = null
        
        // 获取电影信息
        const movieData = await store.dispatch('movies/fetchMovieById', movieId)
        movie.value = movieData
        
        // 设置评分
        if (movie.value && movie.value.rating) {
          movieRating.value = movie.value.rating  // 使用原始评分值，已经是5分制
        }
        
        // 获取该电影的放映场次并按时间排序
        const screeningsData = await store.dispatch('screenings/fetchScreeningsByMovie', movieId)
        
        // 确保数据是数组并排序
        if (Array.isArray(screeningsData)) {
          console.log('获取到的场次数据:', screeningsData)
          
          // 使用所有返回的放映场次，不再进行过滤
          // 因为 getScreenings(movieId) 已经返回了特定电影的场次
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
        error.value = '获取电影信息失败'
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
      handleImageError,
      movieRating
    }
  }
}
</script>

<style scoped>
.movie-detail {
  padding: 20px;
}

.movie-card {
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.movie-header {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.poster-container {
  flex-shrink: 0;
}

.movie-poster {
  width: 300px;
  height: 450px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s;
}

.movie-poster:hover {
  transform: scale(1.02);
}

.movie-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.movie-info h1 {
  margin: 0 0 25px 0;
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  position: relative;
  padding-bottom: 15px;
}

.movie-info h1::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 3px;
  background-color: #409EFF;
  border-radius: 3px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-weight: bold;
  color: #606266;
  font-size: 15px;
}

.value {
  color: #303133;
  font-size: 16px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 10px;
}

.movie-description {
  margin: 30px 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.movie-description h2 {
  margin-bottom: 15px;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.movie-description h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background-color: #409EFF;
  border-radius: 2px;
}

.movie-description p {
  line-height: 1.8;
  color: #606266;
  text-align: justify;
}

.screenings {
  margin-top: 20px;
}

.screenings h2 {
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.screenings h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background-color: #409EFF;
  border-radius: 2px;
}

.price {
  font-weight: bold;
  color: #f56c6c;
}

.loading-container {
  max-width: 600px;
  margin: 50px auto;
  text-align: center;
}

@media (max-width: 768px) {
  .movie-header {
    flex-direction: column;
    align-items: center;
  }
  
  .poster-container {
    margin-bottom: 20px;
  }
  
  .movie-info h1 {
    text-align: center;
  }
  
  .movie-info h1::after {
    left: 50%;
    transform: translateX(-50%);
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>