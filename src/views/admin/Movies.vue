<template>
  <div class="movies-management">
    <div class="page-header">
      <h2>电影管理</h2>
      <el-button type="primary" @click="showAddDialog">
        添加电影
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="movies"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="海报" width="120">
        <template #default="{ row }">
          <img :src="row.poster_url" :alt="row.title" class="movie-poster" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="director" label="导演" width="120" />
      <el-table-column prop="duration" label="时长" width="100">
        <template #default="{ row }">
          {{ row.duration }}分钟
        </template>
      </el-table-column>
      <el-table-column prop="release_date" label="上映日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.release_date) }}
        </template>
      </el-table-column>
      <el-table-column prop="rating" label="评分" width="120">
        <template #default="{ row }">
          <el-rate
            v-model="row.rating"
            disabled
            show-score
            text-color="#ff9900"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="showEditDialog(row)"
          >
            编辑
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

    <!-- 添加/编辑电影对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑电影' : '添加电影'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        
        <el-form-item label="导演" prop="director">
          <el-input v-model="form.director" />
        </el-form-item>

        <el-form-item label="主演" prop="actors">
          <el-input v-model="form.actors" />
        </el-form-item>

        <el-form-item label="时长" prop="duration">
          <el-input-number
            v-model="form.duration"
            :min="1"
            :max="300"
            label="分钟"
          />
        </el-form-item>

        <el-form-item label="上映日期" prop="release_date">
          <el-date-picker
            v-model="form.release_date"
            type="date"
            placeholder="选择日期"
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="海报URL" prop="poster_url">
          <el-input v-model="form.poster_url" />
        </el-form-item>

        <el-form-item label="评分" prop="rating">
          <el-rate
            v-model="form.rating"
            :max="5"
            :texts="['极差', '失望', '一般', '满意', '惊喜']"
            show-text
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'MoviesManagement',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const submitting = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const formRef = ref(null)
    const currentMovie = ref(null)

    const form = reactive({
      title: '',
      director: '',
      actors: '',
      duration: 120,
      release_date: '',
      description: '',
      poster_url: '',
      rating: 0
    })

    const rules = {
      title: [
        { required: true, message: '请输入电影标题', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      director: [
        { required: true, message: '请输入导演姓名', trigger: 'blur' }
      ],
      actors: [
        { required: true, message: '请输入主演信息', trigger: 'blur' }
      ],
      duration: [
        { required: true, message: '请输入电影时长', trigger: 'blur' }
      ],
      release_date: [
        { required: true, message: '请选择上映日期', trigger: 'change' }
      ],
      description: [
        { required: true, message: '请输入电影描述', trigger: 'blur' }
      ],
      poster_url: [
        { required: true, message: '请输入海报URL', trigger: 'blur' }
      ]
    }

    const movies = computed(() => store.getters['movies/allMovies'])

    const fetchMovies = async () => {
      loading.value = true
      try {
        await store.dispatch('movies/fetchMovies')
      } catch (err) {
        ElMessage.error('获取电影列表失败')
      } finally {
        loading.value = false
      }
    }

    const showAddDialog = () => {
      isEdit.value = false
      currentMovie.value = null
      Object.assign(form, {
        title: '',
        director: '',
        actors: '',
        duration: 120,
        release_date: '',
        description: '',
        poster_url: '',
        rating: 0
      })
      dialogVisible.value = true
    }

    const showEditDialog = (movie) => {
      isEdit.value = true
      currentMovie.value = movie
      Object.assign(form, movie)
      dialogVisible.value = true
    }

    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        submitting.value = true
        
        if (isEdit.value) {
          await store.dispatch('movies/updateMovie', {
            id: currentMovie.value.id,
            ...form
          })
          ElMessage.success('电影信息更新成功')
        } else {
          await store.dispatch('movies/createMovie', form)
          ElMessage.success('电影添加成功')
        }
        
        dialogVisible.value = false
        fetchMovies()
      } catch (err) {
        if (err.message) {
          ElMessage.error(err.message)
        }
      } finally {
        submitting.value = false
      }
    }

    const handleDelete = async (movie) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除电影"${movie.title}"吗？`,
          '删除电影',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await store.dispatch('movies/deleteMovie', movie.id)
        ElMessage.success('电影删除成功')
        fetchMovies()
      } catch (err) {
        if (err !== 'cancel') {
          ElMessage.error(err.message || '删除失败')
        }
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    onMounted(() => {
      fetchMovies()
    })

    return {
      movies,
      loading,
      submitting,
      dialogVisible,
      isEdit,
      formRef,
      form,
      rules,
      showAddDialog,
      showEditDialog,
      handleSubmit,
      handleDelete,
      formatDate
    }
  }
}
</script>

<style scoped>
.movies-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.movie-poster {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 