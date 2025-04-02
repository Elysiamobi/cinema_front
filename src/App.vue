<template>
  <div class="app">
    <el-container>
      <el-header>
        <nav class="nav">
          <router-link to="/" class="logo">
            <el-icon><Film /></el-icon>
            <span>星光影院</span>
          </router-link>
          <div class="nav-links">
            <router-link to="/" class="nav-link">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </router-link>
            <template v-if="isAuthenticated">
              <router-link to="/profile" class="nav-link">
                <el-icon><User /></el-icon>
                <span>个人中心</span>
              </router-link>
              <template v-if="isAdmin">
                <router-link to="/admin" class="nav-link admin-link">
                  <el-icon><Setting /></el-icon>
                  <span>管理后台</span>
                </router-link>
              </template>
              <el-button type="primary" size="small" plain round @click="handleLogout" class="logout-btn">
                <el-icon><SwitchButton /></el-icon>
                退出
              </el-button>
            </template>
            <template v-else>
              <router-link to="/login" class="nav-link">
                <el-icon><Key /></el-icon>
                <span>登录</span>
              </router-link>
              <router-link to="/register" class="nav-link">
                <el-icon><Plus /></el-icon>
                <span>注册</span>
              </router-link>
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
        <div class="footer-content">
          <div class="footer-links">
            <a href="#" class="footer-link">关于我们</a>
            <a href="#" class="footer-link">使用条款</a>
            <a href="#" class="footer-link">隐私政策</a>
            <a href="#" class="footer-link">联系我们</a>
          </div>
          <p class="copyright">&copy; 2024 星光影院. All rights reserved.</p>
        </div>
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
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.el-container {
  min-height: 100vh;
}

.el-header {
  background-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(235, 238, 245, 0.6);
}

.nav {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #409EFF;
  font-size: 24px;
  font-weight: bold;
  transition: all 0.3s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo .el-icon {
  margin-right: 10px;
  font-size: 28px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #606266;
  font-size: 15px;
  padding: 6px 10px;
  border-radius: 20px;
  transition: all 0.3s;
}

.nav-link .el-icon {
  margin-right: 4px;
  font-size: 16px;
}

.nav-link:hover {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
}

.nav-link.router-link-active {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
  font-weight: 500;
}

.admin-link {
  color: #E6A23C;
}

.admin-link:hover, 
.admin-link.router-link-active {
  color: #E6A23C;
  background-color: rgba(230, 162, 60, 0.1);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.el-main {
  padding: 30px;
  background-color: transparent;
}

.el-footer {
  background-color: rgba(255, 255, 255, 0.85);
  color: #909399;
  text-align: center;
  padding: 24px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid rgba(235, 238, 245, 0.6);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 15px;
}

.footer-link {
  color: #606266;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-link:hover {
  color: #409EFF;
}

.copyright {
  color: #909399;
  margin: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 768px) {
  .el-header {
    padding: 0 10px;
  }
  
  .nav {
    padding: 0 10px;
  }
  
  .logo span {
    font-size: 20px;
  }
  
  .nav-links {
    gap: 12px;
  }
  
  .nav-link {
    font-size: 14px;
    padding: 4px 8px;
  }
  
  .nav-link span {
    display: none;
  }
  
  .nav-link .el-icon {
    margin-right: 0;
    font-size: 18px;
  }
  
  .logout-btn {
    padding: 5px 10px;
  }
  
  .logout-btn span {
    display: none;
  }
  
  .el-main {
    padding: 20px 10px;
  }
  
  .footer-links {
    flex-wrap: wrap;
    gap: 15px;
  }
}
</style>
