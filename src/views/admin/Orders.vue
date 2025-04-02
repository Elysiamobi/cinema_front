<template>
  <div class="orders-management">
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <el-table
      v-loading="loading"
      :data="orders"
      style="width: 100%"
    >
      <el-table-column prop="id" label="订单ID" width="100" />
      <el-table-column label="用户" width="120">
        <template #default="{ row }">
          {{ getUserName(row.user_id) }}
        </template>
      </el-table-column>
      <el-table-column label="电影" min-width="150">
        <template #default="{ row }">
          {{ getMovieTitle(row.screening_id) }}
        </template>
      </el-table-column>
      <el-table-column label="放映信息" min-width="200">
        <template #default="{ row }">
          {{ getScreeningInfo(row.screening_id) }}
        </template>
      </el-table-column>
      <el-table-column label="座位" width="120">
        <template #default="{ row }">
          {{ formatSeats(row.seats) }}
        </template>
      </el-table-column>
      <el-table-column prop="total_price" label="总价" width="100">
        <template #default="{ row }">
          ¥{{ row.total_price }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending'"
            type="success"
            link
            @click="handleUpdateStatus(row, 'paid')"
          >
            确认支付
          </el-button>
          <el-button
            v-if="row.status === 'pending'"
            type="danger"
            link
            @click="handleUpdateStatus(row, 'cancelled')"
          >
            取消订单
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="订单详情"
      width="500px"
    >
      <div v-if="currentOrder" class="order-details">
        <div class="movie-info">
          <img :src="currentOrder.movie.poster_url" :alt="currentOrder.movie.title" class="movie-poster" />
          <div class="movie-details">
            <h3>{{ currentOrder.movie.title }}</h3>
            <p>导演：{{ currentOrder.movie.director }}</p>
            <p>主演：{{ currentOrder.movie.actors }}</p>
          </div>
        </div>

        <div class="screening-info">
          <h4>场次信息</h4>
          <p>放映时间：{{ formatDateTime(currentOrder.screening.screening_time) }}</p>
          <p>影厅：{{ currentOrder.screening.theater }}</p>
          <p>放映厅：{{ currentOrder.screening.hall }}</p>
        </div>

        <div class="order-info">
          <h4>订单信息</h4>
          <p>订单号：{{ currentOrder.id }}</p>
          <p>下单时间：{{ formatDateTime(currentOrder.created_at) }}</p>
          <p>座位：{{ formatSeats(currentOrder.seats) }}</p>
          <p>总价：¥{{ currentOrder.total_price }}</p>
          <p>状态：{{ getStatusText(currentOrder.status) }}</p>
        </div>

        <div class="user-info">
          <h4>用户信息</h4>
          <p>用户名：{{ currentOrder.user.username }}</p>
          <p>邮箱：{{ currentOrder.user.email }}</p>
          <p>手机号：{{ currentOrder.user.phone }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'OrdersManagement',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const detailsDialogVisible = ref(false)
    const currentOrder = ref(null)

    const orders = computed(() => store.getters['orders/allOrders'])
    const users = computed(() => store.getters['users/allUsers'])
    const movies = computed(() => store.getters['movies/allMovies'])
    const screenings = computed(() => store.getters['screenings/allScreenings'])

    const fetchOrders = async () => {
      loading.value = true
      try {
        console.log('正在获取订单列表...')
        await store.dispatch('orders/fetchOrders')
        
        // 确保数据的完整性并格式化
        const ordersData = store.getters['orders/allOrders']
        if (Array.isArray(ordersData)) {
          const processedOrders = ordersData.map(order => {
            // 确保基本订单数据存在
            const result = {
              id: parseInt(order.id, 10) || 0,
              user_id: parseInt(order.user?.id || order.user_id, 10) || 0,
              screening_id: parseInt(order.screening?.id || order.screening_id, 10) || 0,
              seats: Array.isArray(order.seats) ? order.seats : 
                     (typeof order.seats === 'string' ? JSON.parse(order.seats || '[]') : []),
              total_price: parseFloat(order.total_price || 0),
              status: String(order.status || 'pending'),
              created_at: String(order.created_at || '')
            }
            
            // 添加用户信息
            if (order.user) {
              result.user = {
                id: parseInt(order.user.id, 10) || 0,
                username: String(order.user.username || '未知用户'),
                email: String(order.user.email || '')
              }
            }
            
            // 添加放映场次信息
            if (order.screening) {
              result.screening = {
                id: parseInt(order.screening.id, 10) || 0,
                theater: String(order.screening.theater || '未知影院'),
                hall: String(order.screening.hall || '未知影厅'),
                screening_time: String(order.screening.screening_time || ''),
                price: parseFloat(order.screening.price || 0)
              }
            }
            
            // 添加电影信息
            if (order.movie) {
              result.movie = {
                id: parseInt(order.movie.id, 10) || 0,
                title: String(order.movie.title || '未知电影'),
                poster_url: String(order.movie.poster_url || '')
              }
            }
            
            return result
          })
          
          console.log('处理后的订单列表:', processedOrders)
          store.commit('orders/SET_ORDERS', processedOrders)
        }
      } catch (err) {
        console.error('获取订单列表失败:', err)
        ElMessage.error(err.message || '获取订单列表失败')
      } finally {
        loading.value = false
      }
    }

    const fetchUsers = async () => {
      try {
        await store.dispatch('users/fetchUsers')
      } catch (err) {
        ElMessage.error('获取用户列表失败')
      }
    }

    const fetchMovies = async () => {
      try {
        await store.dispatch('movies/fetchMovies')
      } catch (err) {
        ElMessage.error('获取电影列表失败')
      }
    }

    const fetchScreenings = async () => {
      try {
        await store.dispatch('screenings/fetchScreenings')
      } catch (err) {
        ElMessage.error('获取排片列表失败')
      }
    }

    const getUserName = (userId) => {
      if (!userId) return '未知用户'
      const user = users.value.find(u => u.id === userId)
      return user ? user.username : '未知用户'
    }

    const getMovieTitle = (screeningId) => {
      if (!screeningId) return '未知电影'
      
      const screening = screenings.value.find(s => s.id === screeningId)
      if (!screening) return '未知电影'
      
      const movie = movies.value.find(m => m.id === screening.movie_id)
      return movie ? movie.title : '未知电影'
    }

    const getScreeningInfo = (screeningId) => {
      if (!screeningId) return '未知场次'
      
      const screening = screenings.value.find(s => s.id === screeningId)
      if (!screening) return '未知场次'
      
      return `${screening.theater || '未知影院'} - ${screening.hall || '未知影厅'} - ${screening.screening_time || '未知时间'}`
    }

    const getStatusType = (status) => {
      const types = {
        pending: 'warning',
        paid: 'success',
        confirmed: 'success',
        completed: 'success',
        cancelled: 'danger'
      }
      return types[status] || 'info'
    }

    const getStatusText = (status) => {
      const texts = {
        pending: '待支付',
        paid: '已支付',
        confirmed: '已确认',
        completed: '已完成',
        cancelled: '已取消'
      }
      return texts[status] || status
    }

    const handleUpdateStatus = async (order, status) => {
      const action = status === 'paid' ? '确认支付' : '取消订单'
      try {
        await ElMessageBox.confirm(
          `确定要${action}该订单吗？`,
          action,
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: status === 'paid' ? 'success' : 'warning'
          }
        )

        console.log(`正在更新订单状态，ID: ${order.id}, 新状态: ${status}`)
        
        // 使用后端API接受的状态值: "pending", "paid", "cancelled"
        // API层会将前端提交的状态与数据库状态之间进行必要的映射
        await store.dispatch('orders/updateOrderStatus', {
          id: order.id,
          status
        })
        
        ElMessage.success(`${action}成功`)
        await fetchOrders()
      } catch (err) {
        if (err !== 'cancel') {
          console.error('更新订单状态失败:', err)
          ElMessage.error(err.message || '更新订单状态失败')
        }
      }
    }

    const handleViewDetails = (order) => {
      currentOrder.value = order
      detailsDialogVisible.value = true
    }

    const formatDateTime = (datetime) => {
      if (!datetime) return ''
      const date = new Date(datetime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatSeats = (seats) => {
      if (!seats) return '无座位信息'
      try {
        const seatArray = Array.isArray(seats) ? seats : JSON.parse(seats)
        return seatArray.join(', ')
      } catch (error) {
        console.error('座位数据解析错误:', error)
        return String(seats)
      }
    }

    onMounted(async () => {
      await Promise.all([
        fetchOrders(),
        fetchUsers(),
        fetchMovies(),
        fetchScreenings()
      ])
    })

    return {
      orders,
      loading,
      detailsDialogVisible,
      currentOrder,
      getUserName,
      getMovieTitle,
      getScreeningInfo,
      getStatusType,
      getStatusText,
      handleUpdateStatus,
      handleViewDetails,
      formatDateTime,
      formatSeats
    }
  }
}
</script>

<style scoped>
.orders-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.movie-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.movie-poster {
  width: 120px;
  height: 180px;
  object-fit: cover;
  border-radius: 4px;
}

.movie-details h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.movie-details p {
  margin: 5px 0;
  color: #606266;
}

.screening-info,
.order-info,
.user-info {
  margin-bottom: 20px;
}

.screening-info h4,
.order-info h4,
.user-info h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.screening-info p,
.order-info p,
.user-info p {
  margin: 5px 0;
  color: #606266;
}
</style>