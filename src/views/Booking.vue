<template>
  <div class="booking-page">
    <h1>订票</h1>
    <el-card v-if="screening" class="booking-card">
      <div class="movie-info">
        <h2>{{ movieTitle }}</h2>
        <p>放映时间：{{ formatDateTime(screening.screening_time) }}</p>
        <p>影院：{{ screening.theater || '未知影院' }}</p>
        <p>影厅：{{ screening.hall || '未知影厅' }}</p>
        <p>价格：¥{{ screening.price || 0 }}</p>
      </div>
      
      <div class="seat-selection">
        <h3>选择座位</h3>
        <div class="seat-legend">
          <div class="legend-item">
            <div class="seat available"></div>
            <span>可选</span>
          </div>
          <div class="legend-item">
            <div class="seat selected"></div>
            <span>已选</span>
          </div>
          <div class="legend-item">
            <div class="seat occupied"></div>
            <span>已售</span>
          </div>
        </div>
        <div class="seat-grid">
          <div v-for="row in 8" :key="row" class="seat-row">
            <div v-for="col in 10" :key="col" 
                 class="seat"
                 :class="{ 
                   'selected': isSeatSelected(row, col),
                   'occupied': isSeatOccupied(row, col)
                 }"
                 @click="toggleSeat(row, col)">
              {{ row }}-{{ col }}
            </div>
          </div>
        </div>
      </div>

      <div class="booking-summary">
        <p>已选座位：{{ selectedSeats.join(', ') || '未选择' }}</p>
        <p>总价：¥{{ totalPrice }}</p>
        <el-button type="primary" @click="handleBooking" :disabled="!selectedSeats.length">
          确认订票
        </el-button>
      </div>
    </el-card>
    <div v-else class="loading-container">
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-alert v-else-if="loading" title="正在加载放映信息..." type="info" :closable="false" />
      <el-alert v-else title="未找到放映信息" type="warning" :closable="false" />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getScreeningOccupiedSeats } from '@/api/screenings'

export default {
  name: 'BookingPage',
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const screening = ref(null)
    const selectedSeats = ref([])
    const occupiedSeats = ref([]) // 存储已售座位
    const loading = ref(false)
    const error = ref(null)

    // 计算属性：电影标题
    const movieTitle = computed(() => {
      if (screening.value && screening.value.movie && screening.value.movie.title) {
        return screening.value.movie.title
      } else if (screening.value && screening.value.movie_id) {
        const movies = store.getters['movies/allMovies']
        const movie = movies.find(m => m.id === screening.value.movie_id)
        return movie ? movie.title : '未知电影'
      }
      return '未知电影'
    })

    const totalPrice = computed(() => {
      return selectedSeats.value.length * (screening.value?.price || 0)
    })

    const isSeatSelected = (row, col) => {
      return selectedSeats.value.includes(`${row}-${col}`)
    }

    const isSeatOccupied = (row, col) => {
      const seatId = `${row}-${col}`
      
      // 检查各种可能的座位格式
      const isOccupied = occupiedSeats.value.some(seat => 
        seat === seatId || 
        seat === `${row},${col}` ||
        (typeof seat === 'object' && seat.row === row && seat.col === col)
      )
      
      return isOccupied
    }

    const toggleSeat = (row, col) => {
      const seat = `${row}-${col}`
      
      // 如果座位已被占用，不允许选择
      if (isSeatOccupied(row, col)) {
        ElMessage.warning('该座位已被占用')
        return
      }
      
      const index = selectedSeats.value.indexOf(seat)
      if (index === -1) {
        selectedSeats.value.push(seat)
      } else {
        selectedSeats.value.splice(index, 1)
      }
    }

    const formatDateTime = (datetime) => {
      if (!datetime) return '未设置'
      try {
        const date = new Date(datetime)
        if (isNaN(date.getTime())) {
          return datetime // 如果无法解析，则返回原始字符串
        }
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

    const getOccupiedSeats = async (screeningId) => {
      console.log('开始获取占用座位，放映场次ID:', screeningId)
      try {
        // 直接调用API获取已占座位，避免权限问题
        const occupied = await getScreeningOccupiedSeats(screeningId)
        
        if (Array.isArray(occupied)) {
          console.log('获取到已售座位:', occupied)
          
          // 标准化座位格式为"行-列"
          const formattedSeats = occupied.map(seat => {
            // 如果座位已经是"行-列"格式
            if (typeof seat === 'string' && seat.includes('-')) {
              return seat;
            }
            // 如果座位是"行,列"格式
            else if (typeof seat === 'string' && seat.includes(',')) {
              const [row, col] = seat.split(',');
              return `${row}-${col}`;
            }
            // 其他情况保持原样
            return seat;
          });
          
          // 去重，防止重复座位
          occupiedSeats.value = [...new Set(formattedSeats)]
          console.log('最终占用座位列表:', occupiedSeats.value)
        } else {
          console.warn('获取到的座位数据不是数组:', occupied)
          occupiedSeats.value = []
        }
      } catch (err) {
        console.error('获取已售座位失败:', err)
        ElMessage.warning('无法获取已售座位信息，请刷新页面重试')
        occupiedSeats.value = []
      }
    }

    const handleBooking = async () => {
      try {
        // 检查用户登录状态
        const isLoggedIn = store.getters['auth/isAuthenticated']
        if (!isLoggedIn) {
          ElMessage.warning('请先登录后再购票')
          router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
          return
        }
        
        if (!screening.value) {
          throw new Error('放映信息不存在')
        }

        if (!screening.value.id) {
          throw new Error('放映场次ID无效')
        }

        if (!selectedSeats.value.length) {
          throw new Error('请选择座位')
        }

        // 确保数据格式正确
        const orderData = {
          screening_id: parseInt(screening.value.id, 10),
          seats: selectedSeats.value, // 直接使用数组，拦截器会处理转换
          total_price: parseFloat(totalPrice.value.toFixed(2))
        }

        console.log('提交订单数据:', orderData);
        
        // 创建订单
        const orderId = await store.dispatch('orders/createOrder', orderData);
        
        if (orderId) {
          ElMessage.success('订票成功，即将跳转到支付页面');
          
          // 给用户一个视觉反馈
          setTimeout(() => {
            // 直接带用户去个人中心支付刚创建的订单
            router.push('/profile');
          }, 1500);
        } else {
          ElMessage.success('订票成功');
          router.push('/profile');
        }
      } catch (error) {
        console.error('订票失败:', error)
        ElMessage.error(error.message || '订票失败，请稍后重试')
      }
    }

    const fetchMovies = async () => {
      try {
        if (store.getters['movies/allMovies'].length === 0) {
          await store.dispatch('movies/fetchMovies')
        }
      } catch (err) {
        console.warn('获取电影列表失败:', err)
      }
    }

    onMounted(async () => {
      const screeningId = route.params.screeningId
      if (!screeningId) {
        error.value = '缺少放映场次ID'
        return
      }
      
      try {
        loading.value = true
        error.value = null
        console.log('获取放映场次，ID:', screeningId)
        
        // 确保 ID 是有效的整数
        const id = parseInt(screeningId, 10)
        if (isNaN(id)) {
          throw new Error('无效的放映场次ID')
        }
        
        // 先获取电影列表，以便显示电影详情
        await fetchMovies()
        
        // 获取放映场次
        const result = await store.dispatch('screenings/fetchScreeningById', id)
        console.log('获取到放映场次:', result)
        
        if (!result) {
          throw new Error('未找到该放映场次')
        }
        
        // 简化验证，只需要基本信息
        if (!result.id) {
          throw new Error('放映场次ID无效')
        }
        
        // 存储数据
        screening.value = result
        
        // 获取已售座位（使用直接API方式，避免权限问题）
        await getOccupiedSeats(id)
        
        // 检查用户登录状态
        const isLoggedIn = store.getters['auth/isAuthenticated']
        if (!isLoggedIn) {
          ElMessage.warning('您尚未登录，请先登录后再购票')
        }
      } catch (err) {
        console.error('获取放映信息失败:', err)
        error.value = err.message || '获取放映信息失败，请稍后重试'
      } finally {
        loading.value = false
      }
    })

    return {
      screening,
      selectedSeats,
      occupiedSeats, 
      totalPrice,
      loading,
      error,
      movieTitle,
      isSeatSelected,
      isSeatOccupied,
      toggleSeat,
      formatDateTime,
      handleBooking
    }
  }
}
</script>

<style scoped>
.booking-page {
  padding: 20px;
}

.booking-card {
  max-width: 800px;
  margin: 0 auto;
}

.movie-info {
  margin-bottom: 20px;
}

.seat-selection {
  margin: 20px 0;
}

.seat-legend {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seat-row {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.seat {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  user-select: none;
}

.seat.available {
  background-color: white;
}

.seat.selected {
  background-color: #409eff;
  color: white;
}

.seat.occupied {
  background-color: #f56c6c;
  color: white;
  cursor: not-allowed;
}

.booking-summary {
  margin-top: 20px;
  text-align: right;
}

.el-button {
  margin-top: 10px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>