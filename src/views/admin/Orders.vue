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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-tooltip content="确认支付" placement="top">
              <el-button
                v-if="row.status === 'pending'"
                type="success"
                circle
                size="small"
                @click="handleUpdateStatus(row, 'paid')"
                icon="el-icon-check"
              >
              </el-button>
            </el-tooltip>
            <el-tooltip content="取消订单" placement="top">
              <el-button
                v-if="row.status === 'pending'"
                type="danger"
                circle
                size="small"
                @click="handleUpdateStatus(row, 'cancelled')"
                icon="el-icon-close"
              >
              </el-button>
            </el-tooltip>
            <el-tooltip content="查看详情" placement="top">
              <el-button
                type="primary"
                circle
                size="small"
                @click="showOrderDetails(row)"
                icon="el-icon-view"
              >
              </el-button>
            </el-tooltip>
          </div>
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
        :total="filteredOrders?.length || 0"
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
      width="600px"
      destroy-on-close
    >
      <div v-if="currentOrder" class="order-details">
        <div class="movie-info">
          <img 
            :src="currentOrder.movie?.poster_url || '/default-poster.jpg'" 
            :alt="currentOrder.movie?.title" 
            class="movie-poster"
            @error="handleImageError"
          />
          <div class="movie-details">
            <h3>{{ getMovieTitle(currentOrder.screening_id) }}</h3>
            <p v-if="movies.find(m => m.id === screenings.find(s => s.id === currentOrder.screening_id)?.movie_id)?.director">
              <strong>导演：</strong>{{ movies.find(m => m.id === screenings.find(s => s.id === currentOrder.screening_id)?.movie_id)?.director }}
            </p>
            <p v-if="movies.find(m => m.id === screenings.find(s => s.id === currentOrder.screening_id)?.movie_id)?.actors">
              <strong>主演：</strong>{{ movies.find(m => m.id === screenings.find(s => s.id === currentOrder.screening_id)?.movie_id)?.actors }}
            </p>
            <p v-if="movies.find(m => m.id === screenings.find(s => s.id === currentOrder.screening_id)?.movie_id)?.duration">
              <strong>时长：</strong>{{ movies.find(m => m.id === screenings.find(s => s.id === currentOrder.screening_id)?.movie_id)?.duration }}分钟
            </p>
          </div>
        </div>

        <div class="screening-info">
          <h4>放映信息</h4>
          <p>
            <span>放映时间</span>
            <span>{{ formatDateTime(screenings.find(s => s.id === currentOrder.screening_id)?.screening_time) }}</span>
          </p>
          <p>
            <span>影院</span>
            <span>{{ screenings.find(s => s.id === currentOrder.screening_id)?.theater || '未知影院' }}</span>
          </p>
          <p>
            <span>放映厅</span>
            <span>{{ screenings.find(s => s.id === currentOrder.screening_id)?.hall || '未知影厅' }}</span>
          </p>
        </div>

        <div class="order-info">
          <h4>订单信息</h4>
          <p>
            <span>订单号</span>
            <span>{{ currentOrder.id }}</span>
          </p>
          <p>
            <span>下单时间</span>
            <span>{{ formatDateTime(currentOrder.created_at) }}</span>
          </p>
          <p>
            <span>座位</span>
            <span>{{ formatSeats(currentOrder.seats) }}</span>
          </p>
          <p>
            <span>状态</span>
            <span>
              <el-tag :type="getStatusType(currentOrder.status)" effect="dark">
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </span>
          </p>
          <p>
            <span>总价</span>
            <span class="price">¥{{ currentOrder.total_price }}</span>
          </p>
        </div>

        <div class="user-info">
          <h4>用户信息</h4>
          <p>
            <span>用户名</span>
            <span>{{ getUserName(currentOrder.user_id) }}</span>
          </p>
          <p>
            <span>邮箱</span>
            <span>{{ users.find(u => u.id === currentOrder.user_id)?.email || '无' }}</span>
          </p>
          <p>
            <span>手机号</span>
            <span>{{ users.find(u => u.id === currentOrder.user_id)?.phone || '无' }}</span>
          </p>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailsDialogVisible = false" icon="el-icon-close">关闭</el-button>
          <el-button 
            v-if="currentOrder && currentOrder.status === 'pending'" 
            type="success" 
            @click="handleUpdateStatus(currentOrder, 'paid'); detailsDialogVisible = false"
            icon="el-icon-check"
          >
            确认支付
          </el-button>
          <el-button 
            v-if="currentOrder && currentOrder.status === 'pending'" 
            type="danger" 
            @click="handleUpdateStatus(currentOrder, 'cancelled'); detailsDialogVisible = false"
            icon="el-icon-close"
          >
            取消订单
          </el-button>
        </div>
      </template>
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
      if (!orders.value || !Array.isArray(orders.value)) {
        return []
      }
      
      let result = orders.value

      // 搜索订单号、用户名或电影名
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(order => {
          try {
            // 订单号搜索
            if (order.id.toString().includes(query)) return true
            
            // 用户名搜索
            const userName = getUserName(order.user_id).toLowerCase()
            if (userName.includes(query)) return true
            
            // 电影名搜索
            const movieTitle = getMovieTitle(order.screening_id).toLowerCase()
            if (movieTitle.includes(query)) return true
          } catch (err) {
            console.error('搜索订单时出错:', err)
          }
          
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
      if (!filteredOrders.value || !Array.isArray(filteredOrders.value)) {
        return []
      }
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
            try {
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
              
              return result;
            } catch (error) {
              console.error('处理订单数据出错:', error, order);
              // 返回一个基本的订单对象避免整个列表失败
              return {
                id: parseInt(order.id, 10) || 0,
                user_id: 0,
                screening_id: 0,
                seats: [],
                total_price: 0,
                status: 'pending',
                created_at: ''
              };
            }
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
      if (!users.value || !Array.isArray(users.value)) return '未知用户'
      const user = users.value.find(u => u.id === userId)
      return user ? user.username : '未知用户'
    }

    const getMovieTitle = (screeningId) => {
      if (!screeningId) return '未知电影'
      if (!screenings.value || !Array.isArray(screenings.value)) return '未知电影'
      const screening = screenings.value.find(s => s.id === screeningId)
      if (!screening) return '未知电影'
      
      if (!movies.value || !Array.isArray(movies.value)) return '未知电影'
      const movie = movies.value.find(m => m.id === screening.movie_id)
      return movie ? movie.title : '未知电影'
    }

    const getScreeningInfo = (screeningId) => {
      if (!screeningId) return '未知场次'
      if (!screenings.value || !Array.isArray(screenings.value)) return '未知场次'
      const screening = screenings.value.find(s => s.id === screeningId)
      if (!screening) return '未知场次'
      
      const screeningTime = formatDateTime(screening.screening_time)
      return `${screening.theater || '未知影院'} ${screening.hall || '未知影厅'} ${screeningTime}`
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

    const handleUpdateStatus = async (order, status) => {
      try {
        ElMessageBox.confirm(
          `确定要将订单 #${order.id} 的状态修改为"${getStatusText(status)}"吗？`,
          '修改订单状态',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(async () => {
          loading.value = true
          const result = await store.dispatch('orders/updateOrderStatus', {
            id: order.id,
            status
          })
          
          if (result) {
            ElMessage.success(`订单状态已更新为"${getStatusText(status)}"`)
            fetchOrders()
          }
        }).catch(() => {
          ElMessage.info('已取消操作')
        })
      } catch (err) {
        console.error('更新订单状态失败:', err)
        ElMessage.error(err.message || '更新订单状态失败')
      } finally {
        loading.value = false
      }
    }

    const showOrderDetails = (order) => {
      currentOrder.value = order
      detailsDialogVisible.value = true
    }
    
    const handleImageError = (e) => {
      e.target.src = '/default-poster.jpg'
    }

    onMounted(async () => {
      loading.value = true;
      try {
        console.log('正在初始化订单管理页面...');
        
        // 并行加载所有需要的数据
        await Promise.all([
          fetchOrders(),
          fetchUsers(),
          fetchMovies(),
          fetchScreenings()
        ]);
        
        console.log('订单管理页面数据加载完成');
      } catch (error) {
        console.error('初始化订单管理页面失败:', error);
        ElMessage.error('加载数据失败，请刷新页面重试');
      } finally {
        loading.value = false;
      }
    })

    return {
      loading,
      detailsDialogVisible,
      currentOrder,
      paginatedOrders,
      currentPage,
      pageSize,
      searchQuery,
      statusFilter,
      dateFilter,
      getUserName,
      getMovieTitle,
      getScreeningInfo,
      formatSeats,
      formatDateTime,
      getStatusText,
      getStatusType,
      handleSizeChange,
      handleCurrentChange,
      handleSearch,
      handleUpdateStatus,
      showOrderDetails,
      handleImageError,
      users,
      movies,
      screenings
    }
  }
}
</script>

<style scoped>
.orders-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 25px;
}

.page-header h2 {
  font-size: 26px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  padding-bottom: 15px;
  position: relative;
}

.page-header h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 3px;
  background-color: #409EFF;
  border-radius: 3px;
}

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.el-pagination {
  padding: 0;
}

.price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}

.order-details {
  padding: 10px;
}

.movie-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.movie-poster {
  width: 150px;
  height: 225px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.movie-details h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.movie-details p {
  margin: 8px 0;
  color: #606266;
}

.screening-info,
.order-info,
.user-info {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.screening-info h4,
.order-info h4,
.user-info h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
}

.screening-info h4::before,
.order-info h4::before,
.user-info h4::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: #409EFF;
  border-radius: 2px;
}

.screening-info p,
.order-info p,
.user-info p {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;
  color: #606266;
}

.user-info {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
}

@media (max-width: 768px) {
  .search-filter-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .movie-info {
    flex-direction: column;
  }
  
  .movie-poster {
    width: 100%;
    max-width: 200px;
    margin: 0 auto 20px;
  }
  
  .pagination-container {
    justify-content: center;
  }

  .action-buttons {
    flex-direction: row;
  }
}
</style>