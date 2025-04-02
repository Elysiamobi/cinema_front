<template>
  <div class="screenings-management">
    <div class="page-header">
      <h2>排片管理</h2>
      <el-button type="primary" @click="handleAdd">添加排片</el-button>
    </div>

    <!-- 添加搜索和筛选功能 -->
    <div class="search-filter-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索影院/影厅"
        clearable
        style="width: 220px; margin-right: 10px;"
        @input="handleSearch"
      />
      <el-select
        v-model="movieFilter"
        placeholder="按电影筛选"
        clearable
        style="width: 220px; margin-right: 10px;"
        @change="handleSearch"
      >
        <el-option
          v-for="movie in movies"
          :key="movie.id"
          :label="movie.title"
          :value="movie.id"
        />
      </el-select>
      <el-date-picker
        v-model="dateFilter"
        type="date"
        placeholder="按日期筛选"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        style="width: 220px; margin-right: 10px;"
        clearable
        @change="handleSearch"
      />
    </div>

    <el-table
      v-loading="loading"
      :data="paginatedScreenings"
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column label="电影" min-width="150">
        <template #default="{ row }">
          {{ getMovieTitle(row.movie_id) }}
        </template>
      </el-table-column>
      <el-table-column prop="theater" label="影院" width="120" />
      <el-table-column prop="hall" label="影厅" width="100" />
      <el-table-column prop="screening_time" label="放映时间" width="180" sortable />
      <el-table-column prop="price" label="票价" width="100" sortable>
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

    <!-- 添加分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredScreenings.length"
        :prev-text="'上一页'"
        :next-text="'下一页'"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

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
import { ref, computed, onMounted, watch } from 'vue'
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

    // 分页参数
    const currentPage = ref(1)
    const pageSize = ref(10)

    // 搜索和筛选参数
    const searchQuery = ref('')
    const movieFilter = ref('')
    const dateFilter = ref('')

    const screenings = computed(() => store.getters['screenings/allScreenings'])
    const movies = computed(() => store.getters['movies/allMovies'])

    // 根据搜索和筛选条件过滤场次列表
    const filteredScreenings = computed(() => {
      let result = screenings.value || []

      // 搜索影院或影厅
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(s => 
          (s.theater && s.theater.toLowerCase().includes(query)) || 
          (s.hall && s.hall.toLowerCase().includes(query))
        )
      }

      // 按电影筛选
      if (movieFilter.value) {
        result = result.filter(s => s.movie_id === movieFilter.value)
      }

      // 按日期筛选
      if (dateFilter.value) {
        result = result.filter(s => {
          // 截取场次时间的日期部分进行比较
          const screeningDate = s.screening_time ? s.screening_time.split(' ')[0] : ''
          return screeningDate === dateFilter.value
        })
      }

      return result
    })

    // 分页后的场次列表
    const paginatedScreenings = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredScreenings.value.slice(start, end)
    })

    // 当筛选条件改变时，重置页码
    watch([searchQuery, movieFilter, dateFilter], () => {
      currentPage.value = 1
    })

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

    // 分页处理函数
    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
    }

    const handleCurrentChange = (page) => {
      currentPage.value = page
    }

    // 搜索处理函数
    const handleSearch = () => {
      currentPage.value = 1
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
      getMovieTitle,
      // 分页和过滤相关
      currentPage,
      pageSize,
      searchQuery,
      movieFilter,
      dateFilter,
      filteredScreenings,
      paginatedScreenings,
      handleSizeChange,
      handleCurrentChange,
      handleSearch
    }
  }
}
</script>

<style scoped>
.screenings-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.page-header h2 {
  margin: 0;
  color: #409EFF;
  font-size: 24px;
  font-weight: 600;
  position: relative;
}

.page-header h2::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: #409EFF;
  border-radius: 3px;
}

.page-header .el-button {
  padding: 10px 20px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.el-table :deep(th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
  padding: 12px 0;
}

.el-table :deep(td) {
  padding: 12px 0;
}

.el-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.el-table :deep(.el-table__row:nth-child(even)) {
  background-color: #fafafa;
}

.pagination-container {
  margin-top: 20px;
  padding: 15px 0;
  display: flex;
  justify-content: flex-end;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.el-dialog :deep(.el-dialog__header) {
  padding: 20px;
  margin: 0;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.el-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  color: #303133;
}

.el-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.el-dialog :deep(.el-dialog__footer) {
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.el-form-item :deep(.el-form-item__label) {
  font-weight: 500;
}

.el-date-picker {
  width: 100%;
}

.el-input-number {
  width: 100%;
}

@media (max-width: 768px) {
  .search-filter-container {
    flex-direction: column;
  }
  
  .el-input, .el-select, .el-date-picker {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>