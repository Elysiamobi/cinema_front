<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">登录</el-button>
          <el-button @click="$router.push('/register')">注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoginPage',
  setup() {
    const store = useStore()
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)

    const form = reactive({
      username: '',
      password: ''
    })

    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
      ]
    }

    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        loading.value = true
        await formRef.value.validate()
        
        console.log('尝试登录，用户名:', form.username)
        const response = await store.dispatch('auth/login', {
          username: form.username,
          password: form.password
        })
        
        console.log('登录成功，用户数据:', response)
        
        // 保存token和用户信息
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify({
          id: response.user_id,
          username: response.username,
          email: response.email,
          is_admin: response.is_admin
        }))
        
        // 更新store中的用户状态
        await store.commit('auth/SET_USER', {
          id: response.user_id,
          username: response.username,
          email: response.email,
          is_admin: response.is_admin
        })
        await store.commit('auth/SET_TOKEN', response.access_token)
        
        // 根据用户角色跳转到不同页面
        if (response.is_admin) {
          await router.push('/admin')
        } else {
          await router.push('/')
        }
        
        ElMessage.success('登录成功')
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error(error.response?.data?.error || '登录失败')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      rules,
      formRef,
      loading,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}

.el-button {
  width: 100%;
  margin-bottom: 10px;
}
</style>