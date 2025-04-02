<template>
  <div class="profile-page">
    <h1>个人中心</h1>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="user-info">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
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
              <el-input v-model="userForm.username"></el-input>
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email"></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="password">
              <el-input v-model="userForm.password" type="password" show-password></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdate" :loading="loading">更新信息</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card class="order-history">
          <template #header>
            <div class="card-header">
              <span>订单历史</span>
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
          </div>
          
          <el-table :data="paginatedOrders" v-loading="loading">
            <el-table-column prop="id" label="订单号" width="100"></el-table-column>
            <el-table-column prop="movie.title" label="电影"></el-table-column>
            <el-table-column prop="screening.screening_time" label="放映时间">
              <template #default="{ row }">
                {{ formatDateTime(row.screening.screening_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="seats" label="座位">
              <template #default="{ row }">
                {{ formatSeats(row.seats) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_price" label="总价">
              <template #default="{ row }">
                ¥{{ row.total_price }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'pending'" 
                  type="success" 
                  size="small" 
                  @click="handlePayOrder(row)"
                  :loading="paymentLoading === row.id"
                >
                  支付
                </el-button>
                <el-button 
                  v-if="row.status === 'pending'" 
                  type="danger" 
                  size="small" 
                  @click="handleCancelOrder(row)"
                  :loading="cancelLoading === row.id"
                >
                  取消
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
        </el-card>
      </el-col>
    </el-row>
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
          ElMessage.success('更新成功')
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
          ElMessage.success('订单支付成功')
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
        // 使用后端API接受的'cancelled'状态
        const result = await store.dispatch('orders/updateOrderStatus', {
          id: order.id,
          status: 'cancelled'
        })
        
        if (result) {
          ElMessage.success('订单已取消')
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
      handleSearch
    }
  }
}
</script>

<style scoped>
.profile-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 30px;
  color: #409EFF;
  font-size: 28px;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}

.user-info,
.order-history {
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.user-info:hover,
.order-history:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f7fa;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-header span {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.user-details {
  margin: 20px;
  padding-bottom: 20px;
}

.user-details p {
  margin: 12px 0;
  font-size: 15px;
  color: #606266;
  display: flex;
}

.user-details p strong {
  width: 80px;
  color: #303133;
}

:deep(.el-divider) {
  margin: 25px 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-button--primary) {
  transition: all 0.3s;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

:deep(.el-table) {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: bold;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafafa;
}

:deep(.el-tag) {
  font-weight: 500;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-pagination) {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 自定义分页组件文本 */
:deep(.el-pagination .el-pagination__total) {
  font-size: 14px;
}

:deep(.el-pagination button.btn-prev),
:deep(.el-pagination button.btn-next) {
  font-size: 14px;
}

:deep(.el-pagination .el-pagination__sizes) {
  margin-right: 15px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-filter-container {
    flex-direction: column;
  }
  
  .search-filter-container .el-input,
  .search-filter-container .el-select,
  .search-filter-container .el-date-picker {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .el-col {
    width: 100% !important;
  }
}
</style>