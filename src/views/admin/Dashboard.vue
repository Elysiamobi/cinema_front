<template>
  <div class="admin-dashboard">
    <h1>管理后台</h1>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户管理</span>
            </div>
          </template>
          <el-button type="primary" @click="$router.push('/admin/users')">用户列表</el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>电影管理</span>
            </div>
          </template>
          <el-button type="primary" @click="$router.push('/admin/movies')">电影列表</el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>排片管理</span>
            </div>
          </template>
          <el-button type="primary" @click="$router.push('/admin/screenings')">排片列表</el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单管理</span>
            </div>
          </template>
          <el-button type="primary" @click="$router.push('/admin/orders')">订单列表</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard'
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-card {
  margin-bottom: 20px;
}

.el-button {
  width: 100%;
}
</style> 