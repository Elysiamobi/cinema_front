<template>
  <div class="home">
    <h1>铸就“常识”与“反常识”的螺旋</h1>
    <h3 style="text-align: center; color: #606266;">“没错，就是我。螺旋工坊最年轻的主人，对凯文武装的开发者、黄昏纪元的魔术王、俯瞰群星之人，维尔薇！”</h3>
    <!-- 搜索和筛选功能 -->
    <div class="search-filter-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索电影标题/导演"
        clearable
        style="width: 220px; margin-right: 10px;"
        @input="handleSearch"
      />
      <el-select
        v-model="yearFilter"
        placeholder="按年份筛选"
        clearable
        style="width: 150px; margin-right: 10px;"
        @change="handleSearch"
      >
        <el-option 
          v-for="year in availableYears" 
          :key="year" 
          :label="year + '年'" 
          :value="year" 
        />
      </el-select>
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
    
    <div class="movie-list">
      <el-row :gutter="20">
        <el-col v-for="movie in paginatedMovies" :key="movie.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="movie-card" :body-style="{ padding: '0px' }">
            <img :src="movie.poster_url" class="movie-poster">
            <div class="movie-info">
              <h3 class="movie-title">{{ movie.title }}</h3>
              <p class="movie-director">导演: {{ movie.director }}</p>
              <p class="movie-rating">评分: {{ movie.rating }}分</p>
              <el-button type="primary" @click="viewMovie(movie.id)">查看详情</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 36, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredMovies.length"
        :prev-text="'上一页'"
        :next-text="'下一页'"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'HomePage',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    // 分页参数
    const currentPage = ref(1)
    const pageSize = ref(12) // 每页12个电影
    
    // 搜索和筛选参数
    const searchQuery = ref('')
    const yearFilter = ref('')
    const ratingFilter = ref('')

    const movies = computed(() => store.state.movies.movies)
    
    // 提取所有可用的年份
    const availableYears = computed(() => {
      const yearsSet = new Set()
      movies.value.forEach(movie => {
        if (movie.release_date) {
          const year = movie.release_date.substring(0, 4)
          if (year) yearsSet.add(year)
        }
      })
      return Array.from(yearsSet).sort((a, b) => b - a) // 降序排列
    })
    
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

    const viewMovie = (movieId) => {
      router.push(`/movie/${movieId}`)
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

    onMounted(() => {
      store.dispatch('movies/fetchMovies')
    })

    return {
      movies,
      viewMovie,
      currentPage,
      pageSize,
      searchQuery,
      yearFilter,
      ratingFilter,
      availableYears,
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
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #409EFF;
  font-size: 32px;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.movie-list {
  margin-top: 20px;
}

.movie-card {
  margin-bottom: 30px;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.movie-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.movie-poster {
  width: 100%;
  height: 320px;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.movie-card:hover .movie-poster {
  transform: scale(1.05);
}

.movie-info {
  padding: 16px;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

.movie-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.movie-director {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.movie-rating {
  margin: 12px 0;
  color: #ff9900;
  font-weight: bold;
  font-size: 16px;
}

.pagination-container {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

/* Button styling */
.movie-info .el-button {
  margin-top: 10px;
  width: 100%;
  border-radius: 4px;
  font-weight: bold;
  transition: all 0.3s;
}

.movie-info .el-button:hover {
  transform: scale(1.03);
  opacity: 0.9;
}

/* 自定义分页组件文本 */
:deep(.el-pagination .el-pagination__total) {
  font-size: 14px;
}

:deep(.el-pagination button.btn-prev),
:deep(.el-pagination button.btn-next) {
  font-size: 14px;
}

:deep(.el-pagination .el-pagination__sizes) {
  margin-right: 15px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-filter-container {
    flex-direction: column;
  }
  
  .search-filter-container .el-input,
  .search-filter-container .el-select,
  .search-filter-container .el-date-picker {
    width: 100% !important;
    margin-right: 0 !important;
  }
}
</style> 