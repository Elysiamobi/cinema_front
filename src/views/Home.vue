<template>
  <div class="home">
    <div class="home-header">
      <h1>欢迎来到星光影院</h1>
      <p class="home-subtitle">探索精彩电影世界，享受视觉盛宴</p>
    </div>
    
    <!-- 搜索和筛选功能 -->
    <div class="search-filter-container">
      <div class="search-input">
        <el-input
          v-model="searchQuery"
          placeholder="搜索电影标题/导演"
          clearable
          prefix-icon="Search"
          @input="handleSearch"
        />
      </div>
      <div class="filter-selects">
        <el-select
          v-model="yearFilter"
          placeholder="按年份筛选"
          clearable
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
          @change="handleSearch"
        >
          <el-option label="4.5分以上" :value="4.5" />
          <el-option label="4分以上" :value="4" />
          <el-option label="3分以上" :value="3" />
          <el-option label="2分以上" :value="2" />
        </el-select>
      </div>
    </div>
    
    <transition-group name="movie-fade" tag="div" class="movie-list">
      <el-row :gutter="20">
        <el-col v-for="movie in paginatedMovies" :key="movie.id" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="movie-card-wrapper">
            <el-card class="movie-card" :body-style="{ padding: '0px' }" @click="viewMovie(movie.id)">
              <div class="poster-container">
                <img :src="movie.poster_url" class="movie-poster" :alt="movie.title">
                <div class="movie-rating-badge">
                  <span>{{ movie.rating }}</span>
                </div>
              </div>
              <div class="movie-info">
                <h3 class="movie-title">{{ movie.title }}</h3>
                <p class="movie-director">导演: {{ movie.director }}</p>
                <p class="movie-release">上映: {{ formatDate(movie.release_date) }}</p>
                <el-button type="primary" class="view-details-btn" size="small" round>查看详情</el-button>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </transition-group>
    
    <!-- 空态提示 -->
    <div v-if="filteredMovies.length === 0" class="empty-state">
      <el-icon><VideoCamera /></el-icon>
      <p>暂无符合条件的电影</p>
      <el-button type="primary" plain @click="resetFilters">重置筛选条件</el-button>
    </div>
    
    <!-- 分页组件 -->
    <div class="pagination-container" v-if="filteredMovies.length > 0">
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

    // 日期格式化
    const formatDate = (dateString) => {
      if (!dateString) return '未知';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    }

    // 重置筛选条件
    const resetFilters = () => {
      searchQuery.value = '';
      yearFilter.value = '';
      ratingFilter.value = '';
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
      handleSearch,
      formatDate,
      resetFilters
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

.home-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #409EFF;
  font-size: 36px;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

.home-subtitle {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-selects {
  display: flex;
  gap: 10px;
}

.filter-selects .el-select {
  width: 150px;
}

.movie-list {
  margin-top: 20px;
}

.movie-card-wrapper {
  margin-bottom: 30px;
  height: 100%;
}

.movie-card {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.movie-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.poster-container {
  position: relative;
  overflow: hidden;
}

.movie-poster {
  width: 100%;
  height: 300px;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.movie-card:hover .movie-poster {
  transform: scale(1.08);
}

.movie-rating-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(230, 162, 60, 0.9);
  color: white;
  border-radius: 20px;
  padding: 4px 10px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.movie-info {
  padding: 16px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9));
  height: 150px;
  display: flex;
  flex-direction: column;
}

.movie-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  /* 文本溢出显示省略号 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.movie-director, .movie-release {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-details-btn {
  margin-top: auto;
  align-self: center;
  padding: 8px 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  margin: 20px 0;
}

.empty-state .el-icon {
  font-size: 60px;
  color: #909399;
  margin-bottom: 20px;
}

.empty-state p {
  color: #606266;
  font-size: 16px;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 30px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

/* 电影卡片动画 */
.movie-fade-enter-active,
.movie-fade-leave-active {
  transition: all 0.5s ease;
}

.movie-fade-enter-from,
.movie-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .home {
    padding: 15px;
  }
  
  h1 {
    font-size: 28px;
  }
  
  .search-filter-container {
    flex-direction: column;
    padding: 15px;
  }
  
  .filter-selects {
    flex-direction: column;
  }
  
  .filter-selects .el-select {
    width: 100%;
  }
  
  .movie-poster {
    height: 250px;
  }
  
  .movie-info {
    height: 160px;
  }
}
</style> 