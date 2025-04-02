<template>
  <div class="screenings-management">
    <div class="page-header">
      <h2>排片管理</h2>
      <el-button type="primary" @click="handleAdd">添加排片</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="screenings"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="电影" min-width="150">
        <template #default="{ row }">
          {{ getMovieTitle(row.movie_id) }}
        </template>
      </el-table-column>
      <el-table-column prop="theater" label="影院" width="120" />
      <el-table-column prop="hall" label="影厅" width="100" />
      <el-table-column prop="screening_time" label="放映时间" width="180" />
      <el-table-column prop="price" label="票价" width="100">
        <template #default="{ row }">
          ¥{{ row.price }}
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

    <!-- 编辑排片对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'edit' ? '编辑排片' : '添加排片'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="电影" prop="movie_id">
          <el-select v-model="form.movie_id" placeholder="请选择电影">
            <el-option
              v-for="movie in movies"
              :key="movie.id"
              :label="movie.title"
              :value="movie.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="影院" prop="theater">
          <el-input v-model="form.theater" />
        </el-form-item>
        <el-form-item label="影厅" prop="hall">
          <el-input v-model="form.hall" />
        </el-form-item>
        <el-form-item label="放映时间" prop="screening_time">
          <el-date-picker
            v-model="form.screening_time"
            type="datetime"
            placeholder="选择放映时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :clearable="false"
          />
        </el-form-item>
        <el-form-item label="票价" prop="price">
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="2"
            :step="10"
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
  name: 'ScreeningsManagement',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogType = ref('add')
    const formRef = ref(null)
    const currentScreening = ref(null)

    const screenings = computed(() => store.getters['screenings/allScreenings'])
    const movies = computed(() => store.getters['movies/allMovies'])

    const form = ref({
      movie_id: '',
      theater: '',
      hall: '',
      screening_time: '',
      price: 0
    })

    const rules = {
      movie_id: [
        { required: true, message: '请选择电影', trigger: 'change' }
      ],
      theater: [
        { required: true, message: '请输入影院名称', trigger: 'blur' }
      ],
      hall: [
        { required: true, message: '请输入影厅名称', trigger: 'blur' }
      ],
      screening_time: [
        { required: true, message: '请选择放映时间', trigger: 'change' }
      ],
      price: [
        { required: true, message: '请输入票价', trigger: 'blur' }
      ]
    }

    const fetchScreenings = async () => {
      loading.value = true
      try {
        console.log('正在获取排片列表...')
        const response = await store.dispatch('screenings/fetchScreenings')
        
        if (!response || !Array.isArray(response)) {
          throw new Error('获取排片列表失败：返回数据格式不正确')
        }

        // 确保所有排片数据格式正确
        const processedScreenings = response.map(screening => ({
          id: parseInt(screening.id),
          movie_id: parseInt(screening.movie_id),
          theater: String(screening.theater || ''),
          hall: String(screening.hall || ''),
          screening_time: screening.screening_time || null,
          price: parseFloat(screening.price || 0),
          movie: screening.movie ? {
            id: parseInt(screening.movie.id),
            title: String(screening.movie.title || '')
          } : null
        }))

        await store.commit('screenings/SET_SCREENINGS', processedScreenings)
        console.log('处理后的排片列表:', processedScreenings)
      } catch (err) {
        console.error('获取排片列表失败:', err)
        ElMessage.error(err.message || '获取排片列表失败')
      } finally {
        loading.value = false
      }
    }

    const fetchMovies = async () => {
      try {
        console.log('正在获取电影列表...')
        const response = await store.dispatch('movies/fetchMovies')
        
        if (!response || !Array.isArray(response)) {
          throw new Error('获取电影列表失败：返回数据格式不正确')
        }

        // 确保所有电影数据格式正确
        const processedMovies = response.map(movie => ({
          id: parseInt(movie.id),
          title: String(movie.title || '')
        }))

        await store.commit('movies/SET_MOVIES', processedMovies)
        console.log('处理后的电影列表:', processedMovies)
      } catch (err) {
        console.error('获取电影列表失败:', err)
        ElMessage.error(err.message || '获取电影列表失败')
      }
    }

    const getMovieTitle = (movieId) => {
      const movie = movies.value.find(m => m.id === movieId)
      return movie ? movie.title : '未知电影'
    }

    const handleAdd = () => {
      form.value = {
        movie_id: '',
        theater: '',
        hall: '',
        screening_time: '',
        price: 0
      }
      dialogType.value = 'add'
      dialogVisible.value = true
    }

    const handleEdit = (row) => {
      if (row && row.id) {
        dialogType.value = 'edit'
        dialogVisible.value = true
        currentScreening.value = { ...row }
        console.log('正在编辑排片，ID:', row.id, '原始数据:', row)
        
        form.value = {
          id: parseInt(row.id, 10),
          movie_id: parseInt(row.movie_id || 0, 10),
          theater: String(row.theater || ''),
          hall: String(row.hall || ''),
          screening_time: String(row.screening_time || ''),
          price: parseFloat(row.price || 0)
        }
      }
    }

    const handleDelete = async (screening) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除该排片吗？此操作不可恢复。',
          '删除排片',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'danger'
          }
        )

        await store.dispatch('screenings/deleteScreening', screening.id)
        ElMessage.success('排片删除成功')
        await fetchScreenings()
      } catch (err) {
        if (err !== 'cancel') {
          console.error('删除排片失败:', err)
          ElMessage.error(err.message || '删除失败')
        }
      }
    }

    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        
        // 数据验证和格式化
        const screeningData = {
          movie_id: parseInt(form.value.movie_id || 0),
          theater: String(form.value.theater?.trim() || ''),
          hall: String(form.value.hall?.trim() || ''),
          screening_time: form.value.screening_time || null,
          price: parseFloat(form.value.price || 0)
        }

        if (!screeningData.movie_id) {
          throw new Error('请选择电影')
        }
        
        if (!screeningData.theater) {
          throw new Error('影院名称不能为空')
        }
        
        if (!screeningData.hall) {
          throw new Error('影厅不能为空')
        }
        
        if (!screeningData.screening_time) {
          throw new Error('请选择放映时间')
        }
        
        // 确保日期格式正确
        if (typeof screeningData.screening_time === 'string') {
          // 处理ISO格式日期（含有T的格式）
          if (screeningData.screening_time.includes('T')) {
            console.log('转换前的日期格式:', screeningData.screening_time);
            screeningData.screening_time = screeningData.screening_time.replace('T', ' ');
            console.log('转换后的日期格式:', screeningData.screening_time);
          }
          
          // 确保时间格式包含分钟
          if (screeningData.screening_time.match(/^\d{4}-\d{2}-\d{2} \d{2}$/)) {
            screeningData.screening_time += ':00';
            console.log('添加分钟后的日期格式:', screeningData.screening_time);
          }
        }
        
        if (!screeningData.price || screeningData.price <= 0) {
          throw new Error('请输入有效的票价')
        }

        if (dialogType.value === 'edit') {
          // 确保有ID并且是编辑模式
          if (!form.value.id) {
            throw new Error('编辑排片时ID不能为空')
          }
          
          console.log('更新排片，ID:', form.value.id, '数据:', screeningData)
          
          await store.dispatch('screenings/updateScreening', {
            id: form.value.id,
            data: screeningData
          })
          ElMessage.success('排片更新成功')
        } else {
          // 创建新排片
          console.log('创建新排片，数据:', screeningData)
          await store.dispatch('screenings/createScreening', screeningData)
          ElMessage.success('排片添加成功')
        }

        dialogVisible.value = false
        await fetchScreenings()
      } catch (err) {
        console.error('提交排片数据失败:', err)
        ElMessage.error(err.message || '提交失败')
      }
    }

    onMounted(async () => {
      await Promise.all([
        fetchScreenings(),
        fetchMovies()
      ])
    })

    return {
      screenings,
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
      handleSubmit,
      getMovieTitle
    }
  }
}
</script>

<style scoped>
.screenings-management {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>