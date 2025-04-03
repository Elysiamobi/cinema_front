<template>
  <div class="app">
    <el-container>
      <el-header>
        <nav class="nav">
          <router-link to="/" class="logo">
            <el-icon><Film /></el-icon>
            <span>螺旋剧场</span>
          </router-link>
          <div class="nav-links">
            <router-link to="/">首页</router-link>
            <template v-if="isAuthenticated">
              <router-link to="/profile">个人中心</router-link>
              <template v-if="isAdmin">
                <router-link to="/admin">管理后台</router-link>
              </template>
              <el-button type="text" @click="handleLogout">退出</el-button>
            </template>
            <template v-else>
              <router-link to="/login">登录</router-link>
              <router-link to="/register">注册</router-link>
            </template>
          </div>
        </nav>
      </el-header>
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
      <el-footer>
        <p>&copy; 2025 螺旋剧场. All rights reserved.</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    const router = useRouter()

    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
    const isAdmin = computed(() => {
      // 先从本地存储获取用户信息以防store还未完全初始化
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}')
      // 然后从store中获取用户信息
      const userFromStore = store.getters['auth/currentUser']
      
      // 优先使用store中的数据，如果不存在则使用localStorage中的数据
      return (userFromStore && userFromStore.is_admin === true) || 
             (userFromStorage && userFromStorage.is_admin === true)
    })
    const currentUser = computed(() => store.getters['auth/currentUser'])

    const handleLogout = async () => {
      try {
        await store.dispatch('auth/logout')
        router.push('/login')
        ElMessage.success('已退出登录')
      } catch (error) {
        console.error('登出失败:', error)
        ElMessage.error('退出登录失败')
      }
    }

    return {
      isAuthenticated,
      isAdmin,
      currentUser,
      handleLogout
    }
  }
}
</script>

<style>
.app {
  min-height: 100vh;
}

.el-container {
  min-height: 100vh;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
}

.nav {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #409EFF;
  font-size: 24px;
  font-weight: bold;
}

.logo .el-icon {
  margin-right: 8px;
  font-size: 28px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links a {
  text-decoration: none;
  color: #606266;
  font-size: 16px;
}

.nav-links a:hover {
  color: #409EFF;
}

.nav-links a.router-link-active {
  color: #409EFF;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
}

.el-footer {
  background-color: #fff;
  color: #909399;
  text-align: center;
  padding: 20px;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
