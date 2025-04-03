<template>
  <div class="admin-layout">
    <div class="admin-sidebar">
      <div class="admin-logo">
        <el-icon><VideoPlay /></el-icon>
        <h2 class="admin-title">影院管理系统</h2>
      </div>
      <el-menu
        class="admin-menu"
        :router="true"
        :default-active="activeMenuItem"
      >
        <el-menu-item index="/admin/movies">
          <el-icon><Film /></el-icon>
          <span>电影管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/screenings">
          <el-icon><Calendar /></el-icon>
          <span>排片管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><Tickets /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/statistics">
          <el-icon><TrendCharts /></el-icon>
          <span>统计数据</span>
        </el-menu-item>
      </el-menu>
      <div class="admin-footer">
        <el-button class="back-to-home" link @click="goHome">
          <el-icon><Back /></el-icon>
          <span>返回前台</span>
        </el-button>
      </div>
    </div>
    <div class="admin-content">
      <div class="admin-header">
        <div class="header-left">
          <el-icon class="toggle-icon" @click="toggleSidebar"><Menu /></el-icon>
          <h2 class="page-title">{{ getPageTitle() }}</h2>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="admin-user">
              <el-avatar :size="32" />
              <span class="username">{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToProfile">个人资料</el-dropdown-item>
                <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="admin-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { 
  TrendCharts, 
  Film, 
  Calendar, 
  Tickets, 
  User, 
  Menu, 
  Back, 
  ArrowDown, 
  VideoPlay
} from '@element-plus/icons-vue'
import '../../assets/styles/admin-tables.css'

export default {
  name: 'AdminLayout',
  components: {
    TrendCharts,
    Film,
    Calendar,
    Tickets,
    User,
    Menu,
    Back,
    ArrowDown,
    VideoPlay
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    
    const sidebarCollapsed = ref(false)
    const username = ref('')
    
    const activeMenuItem = computed(() => {
      return route.path
    })
    
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
      document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed.value)
    }
    
    const getPageTitle = () => {
      const pathMap = {
        '/admin/movies': '电影管理',
        '/admin/screenings': '排片管理',
        '/admin/orders': '订单管理',
        '/admin/users': '用户管理',
        '/admin/statistics': '统计数据'
      }
      return pathMap[route.path] || '管理后台'
    }
    
    const goHome = () => {
      router.push('/')
    }
    
    const goToProfile = () => {
      router.push('/profile')
    }
    
    const logout = async () => {
      try {
        await store.dispatch('auth/logout')
        router.push('/login')
      } catch (error) {
        console.error('退出登录失败:', error)
      }
    }
    
    onMounted(() => {
      const currentUser = store.getters['auth/currentUser']
      if (currentUser) {
        username.value = currentUser.username || '管理员'
      }
    })

    return {
      activeMenuItem,
      sidebarCollapsed,
      username,
      toggleSidebar,
      getPageTitle,
      goHome,
      goToProfile,
      logout,
    }
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.admin-sidebar {
  width: 250px;
  background-color: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 1000;
}

.admin-logo {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background-color: #002140;
  height: 64px;
}

.admin-logo .el-icon {
  font-size: 24px;
  color: #409EFF;
  margin-right: 10px;
}

.admin-title {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.admin-menu {
  flex: 1;
  border-right: none;
  background-color: #001529;
}

.admin-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  color: rgba(255, 255, 255, 0.65);
}

.admin-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background-color: #1890ff;
}

.admin-menu :deep(.el-menu-item:hover) {
  color: #fff;
  background-color: #1890ff;
}

.admin-menu :deep(.el-menu-item [class^="el-icon"]) {
  margin-right: 10px;
  width: 24px;
  text-align: center;
  font-size: 18px;
}

.admin-footer {
  padding: 16px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.back-to-home {
  color: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.back-to-home:hover {
  color: #fff;
}

.back-to-home .el-icon {
  margin-right: 5px;
}

.admin-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  height: 64px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: relative;
  z-index: 999;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.toggle-icon {
  font-size: 20px;
  margin-right: 15px;
  cursor: pointer;
  color: #515a6e;
}

.page-title {
  margin: 0;
  font-size: 20px;
  color: #515a6e;
  font-weight: 600;
}

.admin-user {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.admin-user:hover {
  background-color: #f5f7fa;
}

.username {
  margin: 0 8px;
  color: #515a6e;
  font-size: 14px;
}

.admin-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1001;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar-collapsed .admin-sidebar {
    transform: translateY(0);
  }
  
  .admin-content {
    margin-top: 64px;
  }
  
  .admin-main {
    padding: 16px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .username {
    display: none;
  }
}
</style> 