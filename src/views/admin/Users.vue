<template>
  <div class="users-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="handleCreate">添加用户</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="users"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_admin ? 'danger' : 'info'">
            {{ row.is_admin ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            :type="row.is_admin ? 'warning' : 'success'"
            link
            @click="handleToggleRole(row)"
          >
            {{ row.is_admin ? '取消管理员' : '设为管理员' }}
          </el-button>
          <el-button
            type="danger"
            link
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'edit' ? '编辑用户' : '添加用户'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'create'">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'UsersManagement',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogType = ref('create')
    const currentUser = ref(null)
    const form = ref({
      username: '',
      email: '',
      password: ''
    })

    const users = computed(() => store.getters['users/allUsers'])

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
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
      ]
    }

    const fetchUsers = async () => {
      try {
        loading.value = true
        await store.dispatch('users/fetchUsers')
      } catch (error) {
        console.error('获取用户列表失败:', error)
        ElMessage.error('获取用户列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleCreate = () => {
      dialogType.value = 'create'
      form.value = {
        username: '',
        email: '',
        password: ''
      }
      dialogVisible.value = true
    }

    const handleEdit = (user) => {
      dialogType.value = 'edit'
      currentUser.value = user
      form.value = {
        username: user.username,
        email: user.email,
        password: ''
      }
      dialogVisible.value = true
    }

    const handleToggleRole = async (user) => {
      try {
        await ElMessageBox.confirm(
          `确定要${user.is_admin ? '取消' : '设置'}该用户的管理员权限吗？`,
          '更新用户角色',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await store.dispatch('users/updateUserRole', {
          id: user.id,
          isAdmin: !user.is_admin
        })
        
        ElMessage.success('用户角色更新成功')
        fetchUsers()
      } catch (err) {
        if (err !== 'cancel') {
          ElMessage.error(err.message || '更新失败')
        }
      }
    }

    const handleDelete = async (user) => {
      try {
        await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
          type: 'warning'
        })
        await store.dispatch('users/deleteUser', user.id)
        ElMessage.success('删除成功')
        await fetchUsers()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除用户失败:', error)
          ElMessage.error('删除用户失败')
        }
      }
    }

    const handleSubmit = async () => {
      try {
        if (dialogType.value === 'create') {
          await store.dispatch('users/createUser', form.value)
          ElMessage.success('创建成功')
        } else {
          await store.dispatch('users/updateUser', {
            id: currentUser.value.id,
            ...form.value
          })
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        await fetchUsers()
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('操作失败')
      }
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    onMounted(() => {
      fetchUsers()
    })

    onUnmounted(() => {
      store.commit('users/SET_CURRENT_USER', null)
      store.commit('users/SET_ERROR', null)
    })

    return {
      loading,
      users,
      dialogVisible,
      dialogType,
      currentUser,
      form,
      rules,
      handleCreate,
      handleEdit,
      handleDelete,
      handleToggleRole,
      handleSubmit,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.users-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>