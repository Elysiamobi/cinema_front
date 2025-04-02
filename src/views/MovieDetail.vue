<template>
  <div class="movie-detail">
    <el-card v-if="movie" class="movie-card">
      <div class="movie-header">
        <div class="poster-container">
          <img :src="movie.poster_url || 'https://cdn.jsdelivr.net/gh/Elysiamobi/images/imageFiles/202503272303463.png'" 
               class="movie-poster"
               @error="handleImageError">
          <div class="movie-rating">
            <span>{{ movie.rating }}</span>
          </div>
        </div>
        <div class="movie-info">
          <h1>{{ movie.title }}</h1>
          <div class="movie-meta">
            <span class="release-badge">{{ formatYear(movie.release_date) }}</span>
            <span class="duration-badge">{{ movie.duration }}分钟</span>
            <span class="rating-text">{{ movie.rating }}分</span>
          </div>
          
          <div class="info-section">
            <div class="info-label">导演</div>
            <div class="info-content">{{ movie.director }}</div>
          </div>
          
          <div class="info-section">
            <div class="info-label">主演</div>
            <div class="info-content">{{ movie.actors }}</div>
          </div>
          
          <div class="info-section">
            <div class="info-label">上映日期</div>
            <div class="info-content">{{ formatDate(movie.release_date) }}</div>
          </div>
          
          <div class="action-buttons">
            <el-button type="primary" size="large" round icon="Ticket">选择场次购票</el-button>
            <el-button type="info" plain round icon="Star">收藏</el-button>
          </div>
        </div>
      </div>
      
      <div class="movie-description">
        <h2>剧情简介</h2>
        <div class="description-content">
          <p>{{ movie.description || '暂无简介' }}</p>
        </div>
      </div>

      <div class="screenings">
        <h2>放映场次</h2>
        <div class="screenings-date">
          <p>{{ formatDate(new Date()) }} (今日)</p>
        </div>
        
        <div class="screenings-list">
          <el-table 
            :data="screenings" 
            v-loading="loading"
            class="screenings-table"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
          >
            <el-table-column prop="screening_time" label="放映时间" min-width="180">
              <template #default="{ row }">
                <div class="time-info">
                  <span class="time">{{ formatTime(row.screening_time) }}</span>
                  <span class="date">{{ formatDate(row.screening_time) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="影院信息" min-width="200">
              <template #default="{ row }">
                <div class="theater-info">
                  <span class="theater-name">{{ row.theater }}</span>
                  <span class="hall-name">{{ row.hall }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="120">
              <template #default="{ row }">
                <div class="price">¥{{ row.price }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" round @click="handleBooking(row)">购票</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 空状态 -->
          <div v-if="screenings.length === 0 && !loading" class="empty-screenings">
            <el-icon><Calendar /></el-icon>
            <p>暂无可用场次</p>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 加载中状态 -->
    <div v-else-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>正在加载电影信息...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else class="error-container">
      <el-icon><WarningFilled /></el-icon>
      <p>无法加载电影信息</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
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

    const formatDateTime = (datetime) => {
      if (!datetime) return '未知'
      return new Date(datetime).toLocaleString()
    }

    const formatTime = (datetime) => {
      if (!datetime) return '未知'
      const date = new Date(datetime)
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }

    const formatDate = (datetime) => {
      if (!datetime) return '未知'
      const date = new Date(datetime)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const formatYear = (datetime) => {
      if (!datetime) return '未知'
      const date = new Date(datetime)
      return date.getFullYear()
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
      formatTime,
      formatDate,
      formatYear,
      handleBooking,
      handleImageError
    }
  }
}
</script>

<style scoped>
.movie-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.movie-card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.movie-header {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid rgba(235, 238, 245, 0.6);
}

.poster-container {
  position: relative;
  flex-shrink: 0;
}

.movie-poster {
  width: 240px;
  height: 360px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.movie-poster:hover {
  transform: scale(1.03);
}

.movie-rating {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(230, 162, 60, 0.9);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.movie-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.movie-info h1 {
  margin: 0 0 15px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.movie-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.release-badge, .duration-badge {
  padding: 4px 10px;
  background-color: #f0f2f5;
  border-radius: 20px;
  font-size: 14px;
  color: #606266;
}

.rating-text {
  color: #E6A23C;
  font-weight: bold;
  font-size: 16px;
}

.info-section {
  display: flex;
  margin-bottom: 15px;
}

.info-label {
  width: 80px;
  font-weight: 500;
  color: #909399;
}

.info-content {
  flex: 1;
  color: #303133;
}

.action-buttons {
  margin-top: auto;
  display: flex;
  gap: 15px;
}

.movie-description {
  margin: 30px 0;
  padding: 20px;
  background-color: rgba(245, 247, 250, 0.5);
  border-radius: 8px;
}

.movie-description h2 {
  margin-bottom: 15px;
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
}

.description-content {
  color: #606266;
  line-height: 1.6;
}

.screenings {
  margin-top: 30px;
}

.screenings h2 {
  margin-bottom: 15px;
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
}

.screenings-date {
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(235, 238, 245, 0.6);
}

.screenings-date p {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.screenings-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.time-info, .theater-info {
  display: flex;
  flex-direction: column;
}

.time {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.date {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.theater-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.hall-name {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.price {
  font-weight: 600;
  color: #F56C6C;
  font-size: 16px;
}

.empty-screenings, .loading-container, .error-container {
  text-align: center;
  padding: 50px 0;
  color: #909399;
}

.empty-screenings .el-icon, 
.loading-container .el-icon, 
.error-container .el-icon {
  font-size: 50px;
  margin-bottom: 15px;
}

.loading-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .movie-detail {
    padding: 15px;
  }
  
  .movie-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .poster-container {
    align-self: center;
  }
  
  .movie-poster {
    width: 200px;
    height: 300px;
  }
  
  .movie-info h1 {
    font-size: 24px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 10px;
  }
}
</style>