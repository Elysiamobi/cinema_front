<template>
  <div class="movies-management">
    <div class="page-header">
      <h2>电影管理</h2>
      <el-button type="primary" @click="handleAdd">添加电影</el-button>
    </div>

    <!-- 添加搜索和筛选功能 -->
    <div class="search-filter-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索电影标题/导演"
        clearable
        style="width: 220px; margin-right: 10px;"
        @input="handleSearch"
      />
      <el-date-picker
        v-model="yearFilter"
        type="year"
        placeholder="按年份筛选"
        format="YYYY"
        value-format="YYYY"
        style="width: 120px; margin-right: 10px;"
        clearable
        @change="handleSearch"
      />
      <el-select
        v-model="ratingFilter"
        placeholder="按评分筛选"
        clearable
        style="width: 150px;"
        @change="handleSearch"
      >
        <el-option label="4.5分以上" :value="4.5" />
        <el-option label="4分以上" :value="4" />
        <el-option label="3分以上" :value="3" />
        <el-option label="2分以上" :value="2" />
      </el-select>
    </div>

    <el-table
      v-loading="loading"
      :data="paginatedMovies"
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column prop="id" label="ID" width="80" sortable />
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
      <el-table-column prop="duration" label="时长" width="100" sortable>
        <template #default="{ row }">
          {{ row.duration }}分钟
        </template>
      </el-table-column>
      <el-table-column prop="release_date" label="上映日期" width="120" sortable />
      <el-table-column prop="rating" label="评分" width="100" sortable>
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

    <!-- 添加分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredMovies.length"
        :prev-text="'上一页'"
        :next-text="'下一页'"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

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
import { ref, computed, onMounted, watch } from 'vue'
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

    // 分页参数
    const currentPage = ref(1)
    const pageSize = ref(10)

    // 搜索和筛选参数
    const searchQuery = ref('')
    const yearFilter = ref('')
    const ratingFilter = ref('')

    const movies = computed(() => store.getters['movies/allMovies'])

    // 根据搜索和筛选条件过滤电影列表
    const filteredMovies = computed(() => {
      let result = movies.value || []

      // 搜索标题或导演
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(m => 
          (m.title && m.title.toLowerCase().includes(query)) || 
          (m.director && m.director.toLowerCase().includes(query))
        )
      }

      // 按年份筛选
      if (yearFilter.value) {
        result = result.filter(m => {
          if (!m.release_date) return false
          return m.release_date.startsWith(yearFilter.value)
        })
      }

      // 按评分筛选
      if (ratingFilter.value) {
        const minRating = parseFloat(ratingFilter.value)
        result = result.filter(m => m.rating >= minRating)
      }

      return result
    })

    // 分页后的电影列表
    const paginatedMovies = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredMovies.value.slice(start, end)
    })

    // 当筛选条件改变时，重置页码
    watch([searchQuery, yearFilter, ratingFilter], () => {
      currentPage.value = 1
    })

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

        // 按ID升序排序
        processedMovies.sort((a, b) => a.id - b.id)

        await store.commit('movies/SET_MOVIES', processedMovies)
        console.log('处理后的电影列表:', processedMovies)
      } catch (err) {
        console.error('获取电影列表失败:', err)
        ElMessage.error(err.message || '获取电影列表失败')
      } finally {
        loading.value = false
      }
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

    const handleEdit = (movie) => {
      dialogType.value = 'edit'
      dialogVisible.value = true
      
      form.value = {
        id: movie.id,
        title: movie.title,
        director: movie.director,
        actors: movie.actors,
        duration: movie.duration,
        release_date: movie.release_date,
        poster_url: movie.poster_url,
        rating: movie.rating,
        description: movie.description
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
        
        // 确保所有字段都被正确处理
        const movieData = {
          id: form.value.id,
          title: String(form.value.title || '').trim(),
          director: String(form.value.director || '').trim(),
          actors: String(form.value.actors || '').trim(),
          duration: parseInt(form.value.duration || 0, 10),
          release_date: String(form.value.release_date || ''),
          poster_url: String(form.value.poster_url || '').trim(),
          rating: parseFloat(form.value.rating || 0),
          description: String(form.value.description || '').trim()
        }

        console.log('准备提交的电影数据:', movieData)

        if (dialogType.value === 'edit') {
          await store.dispatch('movies/updateMovie', movieData)
          ElMessage.success('电影更新成功')
        } else {
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

    onMounted(() => {
      fetchMovies()
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
      handleSubmit,
      // 分页和过滤相关
      currentPage,
      pageSize,
      searchQuery,
      yearFilter,
      ratingFilter,
      filteredMovies,
      paginatedMovies,
      handleSizeChange,
      handleCurrentChange,
      handleSearch
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

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.movie-poster {
  width: 60px;
  height: 90px;
  object-fit: cover;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>