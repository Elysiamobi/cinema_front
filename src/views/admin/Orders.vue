<template>
  <div class="orders-management">
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <!-- 添加搜索和筛选功能 -->
    <div class="search-filter-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索订单号/用户/电影"
        clearable
        style="width: 220px; margin-right: 10px;"
        @input="handleSearch"
      />
      <el-select
        v-model="statusFilter"
        placeholder="按状态筛选"
        clearable
        style="width: 150px; margin-right: 10px;"
        @change="handleSearch"
      >
        <el-option label="待付款" value="pending" />
        <el-option label="已付款" value="paid" />
        <el-option label="已确认" value="confirmed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-date-picker
        v-model="dateFilter"
        type="date"
        placeholder="按日期筛选"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        style="width: 220px;"
        clearable
        @change="handleSearch"
      />
    </div>

    <el-table
      v-loading="loading"
      :data="paginatedOrders"
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column prop="id" label="订单ID" width="100" sortable />
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
      <el-table-column prop="total_price" label="总价" width="100" sortable>
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
      <el-table-column label="创建时间" width="180" sortable>
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

    <!-- 添加分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredOrders.length"
        :prev-text="'上一页'"
        :next-text="'下一页'"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

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
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'OrdersManagement',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const detailsDialogVisible = ref(false)
    const currentOrder = ref(null)

    // 分页参数
    const currentPage = ref(1)
    const pageSize = ref(10)

    // 搜索和筛选参数
    const searchQuery = ref('')
    const statusFilter = ref('')
    const dateFilter = ref('')

    const orders = computed(() => store.getters['orders/allOrders'])
    const users = computed(() => store.getters['users/allUsers'])
    const movies = computed(() => store.getters['movies/allMovies'])
    const screenings = computed(() => store.getters['screenings/allScreenings'])

    // 根据搜索和筛选条件过滤订单列表
    const filteredOrders = computed(() => {
      let result = orders.value || []

      // 搜索订单号、用户名或电影名
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(order => {
          // 订单号搜索
          if (order.id.toString().includes(query)) return true
          
          // 用户名搜索
          const userName = getUserName(order.user_id).toLowerCase()
          if (userName.includes(query)) return true
          
          // 电影名搜索
          const movieTitle = getMovieTitle(order.screening_id).toLowerCase()
          if (movieTitle.includes(query)) return true
          
          return false
        })
      }

      // 按状态筛选
      if (statusFilter.value) {
        result = result.filter(order => order.status === statusFilter.value)
      }

      // 按日期筛选
      if (dateFilter.value) {
        result = result.filter(order => {
          if (!order.created_at) return false
          return order.created_at.startsWith(dateFilter.value)
        })
      }

      return result
    })

    // 分页后的订单列表
    const paginatedOrders = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredOrders.value.slice(start, end)
    })

    // 当筛选条件改变时，重置页码
    watch([searchQuery, statusFilter, dateFilter], () => {
      currentPage.value = 1
    })

    // 分页处理函数
    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
    }

    const handleCurrentChange = (page) => {
      currentPage.value = page
    }

    // 搜索处理函数
    const handleSearch = () => {
      currentPage.value = 1
    }

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
          
          // 按ID升序排序
          processedOrders.sort((a, b) => a.id - b.id)
          
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
        console.error('获取用户列表失败:', err)
      }
    }

    const fetchMovies = async () => {
      try {
        await store.dispatch('movies/fetchMovies')
      } catch (err) {
        console.error('获取电影列表失败:', err)
      }
    }

    const fetchScreenings = async () => {
      try {
        await store.dispatch('screenings/fetchScreenings')
      } catch (err) {
        console.error('获取场次列表失败:', err)
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
      
      const screeningTime = formatDateTime(screening.screening_time)
      return `${screening.theater} ${screening.hall} ${screeningTime}`
    }

    const formatSeats = (seats) => {
      try {
        if (!seats) return '无座位'
        if (typeof seats === 'string') {
          seats = JSON.parse(seats)
        }
        if (Array.isArray(seats)) {
          return seats.join(', ')
        }
        return '无效座位'
      } catch (err) {
        console.error('格式化座位信息失败:', err)
        return '无效座位'
      }
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      return new Date(dateTime).toLocaleString()
    }

    const getStatusText = (status) => {
      const statusMap = {
        'pending': '待付款',
        'paid': '已付款',
        'confirmed': '已确认',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return statusMap[status] || status
    }

    const getStatusType = (status) => {
      const statusTypeMap = {
        'pending': 'warning',
        'paid': 'success',
        'confirmed': 'success',
        'completed': 'success',
        'cancelled': 'danger'
      }
      return statusTypeMap[status] || 'info'
    }

    const handleUpdateStatus = async (order, newStatus) => {
      try {
        await ElMessageBox.confirm(
          `确定要将订单#${order.id}状态更新为${getStatusText(newStatus)}吗？`,
          '更新订单状态',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await store.dispatch('orders/updateOrderStatus', {
          id: order.id,
          status: newStatus
        })
        
        ElMessage.success('订单状态更新成功')
        await fetchOrders()
      } catch (err) {
        if (err !== 'cancel') {
          console.error('更新订单状态失败:', err)
          ElMessage.error(err.message || '更新失败')
        }
      }
    }

    const handleViewDetails = (order) => {
      currentOrder.value = order
      detailsDialogVisible.value = true
    }

    onMounted(async () => {
      try {
        await Promise.all([
          fetchOrders(),
          fetchUsers(),
          fetchMovies(),
          fetchScreenings()
        ])
      } catch (err) {
        console.error('初始化数据失败:', err)
        ElMessage.error('加载数据失败')
      }
    })

    return {
      orders,
      loading,
      detailsDialogVisible,
      currentOrder,
      getUserName,
      getMovieTitle,
      getScreeningInfo,
      formatSeats,
      formatDateTime,
      getStatusText,
      getStatusType,
      handleUpdateStatus,
      // 分页和过滤相关
      currentPage,
      pageSize,
      searchQuery,
      statusFilter,
      dateFilter,
      filteredOrders,
      paginatedOrders,
      handleSizeChange,
      handleCurrentChange,
      handleSearch,
      handleViewDetails
    }
  }
}
</script>

<style scoped>
.orders-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.page-header h2 {
  margin: 0;
  color: #409EFF;
  font-size: 24px;
  font-weight: 600;
  position: relative;
}

.page-header h2::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: #409EFF;
  border-radius: 3px;
}

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.el-table :deep(th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
  padding: 12px 0;
}

.el-table :deep(td) {
  padding: 12px 0;
}

.el-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.el-table :deep(.el-table__row:nth-child(even)) {
  background-color: #fafafa;
}

.pagination-container {
  margin-top: 20px;
  padding: 15px 0;
  display: flex;
  justify-content: flex-end;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.el-dialog :deep(.el-dialog__header) {
  padding: 20px;
  margin: 0;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.el-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  color: #303133;
}

.el-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.order-details {
  padding: 15px;
}

.movie-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.movie-poster {
  width: 120px;
  height: 180px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.movie-poster:hover {
  transform: scale(1.03);
}

.movie-details h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 18px;
}

.movie-details p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}

.screening-info, .order-info, .user-info {
  background-color: #f8fafc;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

h4 {
  margin-top: 5px;
  margin-bottom: 15px;
  color: #409EFF;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

@media (max-width: 768px) {
  .search-filter-container {
    flex-direction: column;
  }
  
  .el-input, .el-select, .el-date-picker {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .pagination-container {
    justify-content: center;
  }
  
  .movie-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>