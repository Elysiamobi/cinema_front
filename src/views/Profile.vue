<template>
  <div class="profile-page">
    <h1>个人中心</h1>
    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="8" :lg="7" :xl="6">
        <el-card class="user-info">
          <template #header>
            <div class="card-header">
              <span><i class="el-icon-user"></i> 个人信息</span>
            </div>
          </template>
          <div class="user-details">
            <p><strong>用户名：</strong>{{ userForm.username }}</p>
            <p><strong>邮箱：</strong>{{ userForm.email }}</p>
            <p><strong>注册时间：</strong>{{ formatDateTime(userForm.created_at) }}</p>
            <p><strong>账号类型：</strong>{{ userForm.is_admin ? '管理员' : '普通用户' }}</p>
          </div>
          <el-divider>修改信息</el-divider>
          <el-form :model="userForm" :rules="rules" ref="formRef" label-width="80px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="userForm.username" placeholder="3-20个字符"></el-input>
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入有效邮箱"></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="password">
              <el-input v-model="userForm.password" type="password" show-password placeholder="不修改请留空"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdate" :loading="loading" style="width: 100%">更新信息</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="16" :lg="17" :xl="18">
        <el-card class="order-history">
          <template #header>
            <div class="card-header">
              <span><i class="el-icon-tickets"></i> 订单历史</span>
            </div>
          </template>
          
          <!-- 添加搜索和筛选功能 -->
          <div class="search-filter-container">
            <el-input
              v-model="searchQuery"
              placeholder="搜索电影名称/订单号"
              clearable
              style="width: 220px; margin-right: 10px;"
              @input="handleSearch"
              prefix-icon="el-icon-search"
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
              style="width: 150px;"
              clearable
              @change="handleSearch"
            />
            <el-button 
              v-if="searchQuery || statusFilter || dateFilter"
              type="primary" 
              style="margin-left: 10px;"
              @click="resetFilters">
              重置
            </el-button>
          </div>
          
          <el-table :data="paginatedOrders" v-loading="loading" stripe border>
            <el-table-column prop="id" label="订单号" width="80" align="center"></el-table-column>
            <el-table-column label="电影" min-width="150">
              <template #default="{ row }">
                {{ row.movie ? row.movie.title : '未知电影' }}
              </template>
            </el-table-column>
            <el-table-column label="影院/影厅" min-width="180">
              <template #default="{ row }">
                <div v-if="row.screening">
                  <div>{{ row.screening.theater || '未知影院' }}</div>
                  <div class="hall-name">{{ row.screening.hall || '未知影厅' }}</div>
                </div>
                <div v-else>信息不可用</div>
              </template>
            </el-table-column>
            <el-table-column label="场次" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.screening?.screening_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="seats" label="座位" min-width="120" class-name="allow-wrap">
              <template #default="{ row }">
                {{ formatSeats(row.seats) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_price" label="总价" width="100" align="center">
              <template #default="{ row }">
                ¥{{ row.total_price }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" effect="dark">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-tooltip content="支付订单" placement="top">
                    <el-button 
                      v-if="row.status === 'pending'" 
                      type="success" 
                      circle
                      size="small"
                      @click="handlePayOrder(row)"
                      :loading="paymentLoading === row.id"
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
                      @click="handleCancelOrder(row)"
                      :loading="cancelLoading === row.id"
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
              :total="filteredOrders.length"
              :prev-text="'上一页'"
              :next-text="'下一页'"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="订单详情"
      width="600px"
      destroy-on-close
    >
      <div v-if="selectedOrder" class="order-details">
        <div class="movie-info">
          <img 
            :src="selectedOrder.movie?.poster_url || '/default-poster.jpg'" 
            :alt="selectedOrder.movie?.title" 
            class="movie-poster"
            @error="handleImageError"
          />
          <div class="movie-details">
            <h3>{{ selectedOrder.movie?.title || '未知电影' }}</h3>
            <p v-if="selectedOrder.movie?.director"><strong>导演：</strong>{{ selectedOrder.movie.director }}</p>
            <p v-if="selectedOrder.movie?.actors"><strong>主演：</strong>{{ selectedOrder.movie.actors }}</p>
            <p v-if="selectedOrder.movie?.duration"><strong>时长：</strong>{{ selectedOrder.movie.duration }}分钟</p>
          </div>
        </div>

        <div class="screening-info">
          <h4>放映信息</h4>
          <p>
            <span>放映时间</span>
            <span>{{ formatDateTime(selectedOrder.screening?.screening_time) }}</span>
          </p>
          <p>
            <span>影院</span>
            <span>{{ selectedOrder.screening?.theater || '未知影院' }}</span>
          </p>
          <p>
            <span>放映厅</span>
            <span>{{ selectedOrder.screening?.hall || '未知影厅' }}</span>
          </p>
        </div>

        <div class="order-info">
          <h4>订单信息</h4>
          <p>
            <span>订单号</span>
            <span>{{ selectedOrder.id }}</span>
          </p>
          <p>
            <span>下单时间</span>
            <span>{{ formatDateTime(selectedOrder.created_at) }}</span>
          </p>
          <p>
            <span>座位</span>
            <span>{{ formatSeats(selectedOrder.seats) }}</span>
          </p>
          <p>
            <span>状态</span>
            <span>
              <el-tag :type="getStatusType(selectedOrder.status)" effect="dark">
                {{ getStatusText(selectedOrder.status) }}
              </el-tag>
            </span>
          </p>
          <p>
            <span>总价</span>
            <span class="price">¥{{ selectedOrder.total_price }}</span>
          </p>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailsDialogVisible = false" icon="el-icon-close">关闭</el-button>
          <el-button 
            v-if="selectedOrder && selectedOrder.status === 'pending'" 
            type="success" 
            @click="handlePayOrder(selectedOrder); detailsDialogVisible = false"
            :loading="paymentLoading === selectedOrder?.id"
            icon="el-icon-check"
          >
            支付订单
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'ProfilePage',
  setup() {
    const store = useStore()
    const formRef = ref(null)
    const loading = ref(false)
    const orders = ref([])
    const paymentLoading = ref(null)  // 当前正在支付的订单ID
    const cancelLoading = ref(null)   // 当前正在取消的订单ID
    const detailsDialogVisible = ref(false)
    const selectedOrder = ref(null)
    
    // 分页参数
    const currentPage = ref(1)
    const pageSize = ref(10) // 每页10条订单记录
    
    // 搜索和筛选参数
    const searchQuery = ref('')
    const statusFilter = ref('')
    const dateFilter = ref('')

    const userForm = reactive({
      username: '',
      email: '',
      password: '',
      created_at: null,
      is_admin: false
    })

    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      password: [
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ]
    }
    
    // 根据搜索和筛选条件过滤订单列表
    const filteredOrders = computed(() => {
      let result = orders.value || []

      // 搜索电影名称或订单号
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(order => {
          const movieTitle = order.movie?.title?.toLowerCase() || ''
          const orderId = order.id?.toString() || ''
          return movieTitle.includes(query) || orderId.includes(query)
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

    // 重置筛选条件
    const resetFilters = () => {
      searchQuery.value = ''
      statusFilter.value = ''
      dateFilter.value = ''
      currentPage.value = 1
    }

    const handleUpdate = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        loading.value = true
        
        // 数据验证
        if (!userForm.id) {
          throw new Error('用户ID不存在')
        }

        if (!userForm.username || userForm.username.trim().length < 3) {
          throw new Error('用户名长度不能小于3个字符')
        }

        if (!userForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
          throw new Error('请输入有效的邮箱地址')
        }
        
        // 只发送必要的字段，避免格式错误
        const userData = {
          id: parseInt(userForm.id, 10),
          username: userForm.username.trim(),
          email: userForm.email.trim()
        }
        
        // 仅当密码字段有值时才发送
        if (userForm.password && userForm.password.trim() !== '') {
          if (userForm.password.length < 6) {
            throw new Error('密码长度不能小于6个字符')
          }
          userData.password = userForm.password
        }
        
        console.log('更新用户数据:', userData)
        const updatedUser = await store.dispatch('auth/updateUser', userData)
        
        if (updatedUser) {
          if (updatedUser.client_processed) {
            ElMessage.success('个人信息更新成功（客户端处理）')
            console.log('客户端处理的用户信息更新成功:', updatedUser)
          } else {
            ElMessage.success('个人信息更新成功')
            console.log('服务器处理的用户信息更新成功:', updatedUser)
          }
          userForm.password = ''  // 清空密码字段
        }
      } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error(error.message || '更新失败')
      } finally {
        loading.value = false
      }
    }

    // 支付订单
    const handlePayOrder = async (order) => {
      try {
        // 确认对话框
        await ElMessageBox.confirm(
          `确定要支付订单 #${order.id} 吗？总金额：¥${order.total_price}`,
          '支付订单',
          {
            confirmButtonText: '确认支付',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
        
        console.log('开始支付订单:', order.id)
        paymentLoading.value = order.id
        
        // 前端使用'paid'，API层负责转换为数据库接受的'confirmed'
        const result = await store.dispatch('orders/updateOrderStatus', {
          id: order.id,
          status: 'paid'
        })
        
        if (result) {
          // 检查是否是客户端处理的支付
          if (result.client_processed) {
            ElMessage.success('订单支付成功（客户端处理）')
            console.log('客户端处理的支付成功:', result)
          } else {
            ElMessage.success('订单支付成功')
            console.log('服务器处理的支付成功:', result)
          }
          
          // 刷新订单列表
          await fetchOrders()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('支付订单失败:', error)
          ElMessage.error(error.message || '支付失败，请稍后重试')
        }
      } finally {
        paymentLoading.value = null
      }
    }

    // 取消订单
    const handleCancelOrder = async (order) => {
      try {
        // 确认对话框
        await ElMessageBox.confirm(
          `确定要取消订单 #${order.id} 吗？此操作不可恢复。`,
          '取消订单',
          {
            confirmButtonText: '确认取消',
            cancelButtonText: '返回',
            type: 'warning'
          }
        )
        
        cancelLoading.value = order.id
        console.log('开始取消订单:', order.id)
        
        // 使用后端API接受的'cancelled'状态
        const result = await store.dispatch('orders/updateOrderStatus', {
          id: order.id,
          status: 'cancelled'
        })
        
        if (result) {
          // 检查是否是客户端处理的取消
          if (result.client_processed) {
            ElMessage.success('订单已取消（客户端处理）')
            console.log('客户端处理的取消成功:', result)
          } else {
            ElMessage.success('订单已取消')
            console.log('服务器处理的取消成功:', result)
          }
          
          // 刷新订单列表
          await fetchOrders()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('取消订单失败:', error)
          ElMessage.error(error.message || '取消失败，请稍后重试')
        }
      } finally {
        cancelLoading.value = null
      }
    }

    const showOrderDetails = (order) => {
      selectedOrder.value = order
      detailsDialogVisible.value = true
    }
    
    const handleImageError = (e) => {
      e.target.src = '/default-poster.jpg'
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

    // 格式化座位信息
    const formatSeats = (seatsString) => {
      try {
        if (!seatsString) return '无座位信息';
        
        // 尝试解析JSON字符串
        const seats = typeof seatsString === 'string' ? JSON.parse(seatsString) : seatsString;
        
        if (Array.isArray(seats)) {
          return seats.join(', ');
        }
        
        return String(seatsString);
      } catch (error) {
        console.error('座位数据解析错误:', error);
        return String(seatsString);
      }
    };

    const fetchUserData = async () => {
      try {
        const response = await store.dispatch('auth/fetchUserInfo');
        if (response && response.id) {
          userForm.id = parseInt(response.id, 10);
          userForm.username = String(response.username || '');
          userForm.email = String(response.email || '');
          userForm.is_admin = Boolean(response.is_admin);
          userForm.created_at = String(response.created_at || '');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        ElMessage.error('获取用户信息失败');
      }
    };

    // 获取订单列表
    const fetchOrders = async () => {
      try {
        const userOrders = await store.dispatch('orders/fetchUserOrders')
        console.log('获取到订单数据:', userOrders)
        
        if (Array.isArray(userOrders)) {
          orders.value = userOrders.map(order => ({
            id: parseInt(order.id),
            user_id: parseInt(order.user_id),
            screening_id: parseInt(order.screening_id),
            total_price: parseFloat(order.total_price || 0),
            seats: typeof order.seats === 'string' ? JSON.parse(order.seats) : (Array.isArray(order.seats) ? order.seats : []),
            status: String(order.status || 'pending'),
            created_at: order.created_at || null,
            screening: order.screening ? {
              id: parseInt(order.screening.id),
              theater: String(order.screening.theater || ''),
              hall: String(order.screening.hall || ''),
              screening_time: order.screening.screening_time,
              price: parseFloat(order.screening.price || 0)
            } : null,
            movie: order.movie ? {
              id: parseInt(order.movie.id),
              title: String(order.movie.title || '未知电影'),
              poster_url: String(order.movie.poster_url || '')
            } : { title: '未知电影' }
          }))
        } else {
          console.warn('未获取到用户订单或格式不正确')
          orders.value = []
        }
      } catch (orderError) {
        console.error('获取订单失败:', orderError)
        ElMessage.error(orderError.message || '获取订单历史失败')
        orders.value = []
      }
    }

    onMounted(async () => {
      try {
        loading.value = true
        console.log('正在获取用户信息...')
        
        // 获取当前用户信息
        await fetchUserData()
        
        // 获取用户订单
        await fetchOrders()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        ElMessage.error(error.message || '获取用户信息失败')
      } finally {
        loading.value = false
      }
    })

    return {
      userForm,
      formRef,
      rules,
      loading,
      orders,
      paymentLoading,
      cancelLoading,
      handleUpdate,
      handlePayOrder,
      handleCancelOrder,
      formatDateTime,
      getStatusType,
      getStatusText,
      formatSeats,
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
      resetFilters,
      detailsDialogVisible,
      selectedOrder,
      showOrderDetails,
      handleImageError
    }
  }
}
</script>

<style scoped>
.profile-page {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 25px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  padding-bottom: 10px;
  border-bottom: 2px solid #409EFF;
}

.user-info, .order-history {
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.user-details {
  padding: 10px 0;
}

.user-details p {
  margin: 15px 0;
  display: flex;
  justify-content: space-between;
}

.user-details p strong {
  color: #606266;
}

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.action-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 8px;
}

.el-table {
  --el-table-border-color: #EBEEF5;
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 10px;
  }
  
  .search-filter-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .pagination-container {
    justify-content: center;
  }
}

@media (max-width: 992px) {
  .user-info, .order-history {
    margin-bottom: 20px;
  }
}

@media (min-width: 1200px) {
  .user-info, .order-history {
    max-width: 1400px;
    margin: 0 auto 24px;
  }
}

.hall-name {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.movie-title {
  font-weight: 500;
  color: #303133;
}

.theater-hall {
  display: flex;
  flex-direction: column;
}

.theater-name {
  font-weight: 500;
  color: #303133;
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
.order-info {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.screening-info h4,
.order-info h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
}

.screening-info h4::before,
.order-info h4::before {
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
.order-info p {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;
  color: #606266;
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

/* Allow text wrapping for long content */
.allow-wrap {
  white-space: normal;
  word-break: break-word;
}
</style>