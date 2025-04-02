<template>
  <div class="admin-layout">
    <div class="admin-sidebar">
      <h2 class="admin-title">管理后台</h2>
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
      </el-menu>
    </div>
    <div class="admin-content">
      <router-view />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import '../../assets/styles/admin-tables.css'

export default {
  name: 'AdminLayout',
  setup() {
    const route = useRoute()
    
    const activeMenuItem = computed(() => {
      return route.path
    })

    return {
      activeMenuItem
    }
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - 140px);
}

.admin-sidebar {
  width: 220px;
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  margin-right: 20px;
  padding: 20px 0;
}

.admin-title {
  padding: 0 20px;
  margin-top: 0;
  margin-bottom: 20px;
  color: #409EFF;
  font-size: 20px;
  font-weight: 600;
}

.admin-menu {
  border-right: none;
}

.admin-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.el-menu-item [class^="el-icon"] {
  margin-right: 5px;
  width: 24px;
  text-align: center;
  font-size: 18px;
}

.el-menu-item.is-active {
  background-color: #ecf5ff;
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    margin-right: 0;
    margin-bottom: 20px;
  }
  
  .admin-menu {
    display: flex;
    flex-wrap: wrap;
  }
  
  .el-menu--horizontal>.el-menu-item {
    height: 50px;
    line-height: 50px;
    flex: 1;
    min-width: 80px;
    text-align: center;
  }
}
</style> 