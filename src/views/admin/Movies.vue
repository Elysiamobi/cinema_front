<template>
  <div class="movies-management">
    <div class="page-header">
      <h2>电影管理</h2>
      <el-button type="primary" @click="handleAdd">添加电影</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="movies"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="海报" width="120">
        <template #default="{ row }">
          <el-image
            :src="row.poster_url"
            :alt="row.title"
            class="movie-poster"
            fit="cover"
          />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="director" label="导演" width="120" />
      <el-table-column prop="duration" label="时长" width="100">
        <template #default="{ row }">
          {{ row.duration }}分钟
        </template>
      </el-table-column>
      <el-table-column prop="release_date" label="上映日期" width="120" />
      <el-table-column prop="rating" label="评分" width="100">
        <template #default="{ row }">
          <el-rate
            v-model="row.rating"
            disabled
            show-score
            text-color="#ff9900"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="handleEdit(row)"
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

    <!-- 编辑电影对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'edit' ? '编辑电影' : '添加电影'"
      width="600px"
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
          <el-input v-model="form.actors" type="textarea" />
        </el-form-item>
        <el-form-item label="时长" prop="duration">
          <el-input-number v-model="form.duration" :min="1" :max="300" />
        </el-form-item>
        <el-form-item label="上映日期" prop="release_date">
          <el-date-picker
            v-model="form.release_date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
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
        <el-form-item label="简介" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入电影简介"
          />
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
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'MoviesManagement',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogType = ref('add')
    const formRef = ref(null)

    const movies = computed(() => store.getters['movies/allMovies'])

    const form = ref({
      title: '',
      director: '',
      actors: '',
      duration: 120,
      release_date: '',
      poster_url: '',
      rating: 0,
      description: ''
    })

    const rules = {
      title: [
        { required: true, message: '请输入电影标题', trigger: 'blur' },
        { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      director: [
        { required: true, message: '请输入导演姓名', trigger: 'blur' }
      ],
      duration: [
        { required: true, message: '请输入电影时长', trigger: 'blur' }
      ],
      release_date: [
        { required: true, message: '请选择上映日期', trigger: 'change' }
      ],
      poster_url: [
        { required: true, message: '请输入海报URL', trigger: 'blur' }
      ]
    }

    const fetchMovies = async () => {
      loading.value = true
      try {
        console.log('正在获取电影列表...')
        const response = await store.dispatch('movies/fetchMovies')
        
        if (!response || !Array.isArray(response)) {
          throw new Error('获取电影列表失败：返回数据格式不正确')
        }

        // 确保所有电影数据格式正确
        const processedMovies = response.map(movie => ({
          id: parseInt(movie.id),
          title: String(movie.title || ''),
          director: String(movie.director || ''),
          actors: String(movie.actors || ''),
          duration: parseInt(movie.duration || 0),
          release_date: movie.release_date || null,
          poster_url: String(movie.poster_url || ''),
          rating: parseFloat(movie.rating || 0),
          description: String(movie.description || '')
        }))

        await store.commit('movies/SET_MOVIES', processedMovies)
        console.log('处理后的电影列表:', processedMovies)
      } catch (err) {
        console.error('获取电影列表失败:', err)
        ElMessage.error(err.message || '获取电影列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleAdd = () => {
      form.value = {
        title: '',
        director: '',
        actors: '',
        duration: 120,
        release_date: '',
        poster_url: '',
        rating: 0,
        description: ''
      }
      dialogType.value = 'add'
      dialogVisible.value = true
    }

    const handleEdit = (row) => {
      if (row && row.id) {
        dialogType.value = 'edit'
        dialogVisible.value = true
        form.value = {
          id: parseInt(row.id, 10),
          title: String(row.title || ''),
          description: String(row.description || ''),
          director: String(row.director || ''),
          actors: String(row.actors || ''),
          duration: parseInt(row.duration || 0, 10),
          release_date: String(row.release_date || ''),
          poster_url: String(row.poster_url || ''),
          rating: parseFloat(row.rating || 0)
        }
      }
    }

    const handleDelete = async (movie) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除该电影吗？此操作不可恢复。',
          '删除电影',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'danger'
          }
        )

        await store.dispatch('movies/deleteMovie', movie.id)
        ElMessage.success('电影删除成功')
        await fetchMovies()
      } catch (err) {
        if (err !== 'cancel') {
          console.error('删除电影失败:', err)
          ElMessage.error(err.message || '删除失败')
        }
      }
    }

    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        
        // 验证和格式化数据
        const movieData = {
          title: form.value.title?.trim() || '',
          description: form.value.description?.trim() || '',
          director: form.value.director?.trim() || '',
          actors: form.value.actors?.trim() || '',
          duration: parseInt(form.value.duration || 0),
          release_date: form.value.release_date || '',
          poster_url: form.value.poster_url?.trim() || '',
          rating: parseFloat(form.value.rating || 0)
        }
        
        // 验证必填字段
        if (!movieData.title) {
          throw new Error('电影标题不能为空')
        }
        
        if (!movieData.director) {
          throw new Error('导演不能为空')
        }
        
        if (!movieData.release_date) {
          throw new Error('上映日期不能为空')
        }
        
        if (dialogType.value === 'edit') {
          // 确保有ID
          if (!form.value.id) {
            throw new Error('编辑电影时ID不能为空')
          }
          
          // 添加ID到请求数据中
          movieData.id = form.value.id
          
          console.log('更新电影，ID:', form.value.id, '数据:', movieData)
          await store.dispatch('movies/updateMovie', movieData)
          ElMessage.success('电影更新成功')
        } else {
          console.log('创建新电影，数据:', movieData)
          await store.dispatch('movies/createMovie', movieData)
          ElMessage.success('电影添加成功')
        }
        
        dialogVisible.value = false
        await fetchMovies()
      } catch (err) {
        console.error('提交电影数据失败:', err)
        ElMessage.error(err.message || '提交失败')
      }
    }

    onMounted(async () => {
      await fetchMovies()
    })

    return {
      movies,
      loading,
      dialogVisible,
      dialogType,
      formRef,
      form,
      rules,
      handleAdd,
      handleEdit,
      handleDelete,
      handleSubmit
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
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>