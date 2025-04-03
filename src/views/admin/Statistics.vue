<template>
  <admin-page-layout title="统计数据">
    <template #search-filters>
      <div class="search-filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索电影"
          prefix-icon="Search"
          style="width: 200px; margin-right: 15px"
          @input="handleSearch"
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="margin-right: 15px"
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </template>

    <div class="charts-container">
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>票房收入比例</span>
              </div>
            </template>
            <v-chart :option="pieChartOption" autoresize class="chart" />
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>售票数量比例</span>
              </div>
            </template>
            <v-chart :option="ticketPieChartOption" autoresize class="chart" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>热门电影票房（前5名）</span>
              </div>
            </template>
            <v-chart :option="barChartOption" autoresize class="chart" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-card class="statistics-table">
      <template #header>
        <div class="card-header">
          <span>电影销售统计明细</span>
        </div>
      </template>
      <el-table
        :data="paginatedMovieStats"
        style="width: 100%"
        border
        stripe
        v-loading="loading"
      >
        <el-table-column prop="movieId" label="电影ID" width="80" sortable />
        <el-table-column prop="title" label="电影名称" min-width="180" />
        <el-table-column label="票房收入" width="150" sortable>
          <template #default="{ row }">
            {{ formatCurrency(row.boxOffice) }}
          </template>
        </el-table-column>
        <el-table-column label="售票数量" width="120" sortable>
          <template #default="{ row }">
            {{ row.ticketsSold }} 张
          </template>
        </el-table-column>
        <el-table-column label="票房占比" width="120">
          <template #default="{ row }">
            {{ formatPercent(row.boxOfficePercentage) }}
          </template>
        </el-table-column>
        <el-table-column label="场次数" width="100" sortable>
          <template #default="{ row }">
            {{ row.screeningsCount }} 场
          </template>
        </el-table-column>
        <el-table-column label="上座率" width="100">
          <template #default="{ row }">
            {{ formatPercent(row.occupancyRate) }}
          </template>
        </el-table-column>
        <el-table-column label="平均票价" width="120">
          <template #default="{ row }">
            {{ formatCurrency(row.averageTicketPrice) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredMovieStats.length"
          :prev-text="'上一页'"
          :next-text="'下一页'"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </admin-page-layout>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import AdminPageLayout from '@/components/AdminPageLayout.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

export default {
  name: 'StatisticsPage',
  components: {
    AdminPageLayout,
    VChart
  },
  setup() {
    const store = useStore()
    const loading = ref(true)
    
    // 分页参数
    const currentPage = ref(1)
    const pageSize = ref(10)

    // 搜索和筛选参数
    const searchQuery = ref('')
    const dateRange = ref([])

    const orders = computed(() => store.getters['orders/allOrders'] || [])
    const movies = computed(() => store.getters['movies/allMovies'] || [])
    const screenings = computed(() => store.getters['screenings/allScreenings'] || [])

    // 统计数据
    const movieStats = computed(() => {
      if (!orders.value.length || !movies.value.length || !screenings.value.length) {
        console.log('缺少数据:', {
          orders: orders.value.length,
          movies: movies.value.length,
          screenings: screenings.value.length
        })
        return []
      }

      console.log('开始统计数据，订单数量:', orders.value.length)

      const stats = {}
      let totalBoxOffice = 0
      let totalTickets = 0
      let validOrdersCount = 0

      // 初始化电影统计数据
      movies.value.forEach(movie => {
        stats[movie.id] = {
          movieId: movie.id,
          title: movie.title,
          boxOffice: 0,
          ticketsSold: 0,
          screeningsCount: 0,
          occupancyRate: 0,
          averageTicketPrice: 0,
          boxOfficePercentage: 0,
          ticketPercentage: 0
        }
      })

      // 统计每部电影的场次数
      screenings.value.forEach(screening => {
        if (stats[screening.movie_id]) {
          stats[screening.movie_id].screeningsCount++
        }
      })

      // 统计订单数据
      orders.value.forEach(order => {
        console.log(`处理订单: ID=${order.id}, 状态=${order.status}`)
        
        // 只统计已支付和已确认的订单 - 使用逻辑或，任一状态均为有效
        if (order.status === 'paid' || order.status === 'confirmed') {
          let screeningId = order.screening_id

          // 如果订单包含嵌套的screening对象，提取ID
          if (order.screening && order.screening.id) {
            screeningId = order.screening.id
          }

          // 查找订单对应的场次和电影
          const screening = screenings.value.find(s => s.id === screeningId)
          if (!screening) {
            console.log(`找不到场次: ID=${screeningId}`)
            return
          }

          const movieId = screening.movie_id
          if (!stats[movieId]) {
            console.log(`找不到电影: ID=${movieId}`)
            return
          }

          // 处理座位信息，确保是数组格式
          let seats = []
          try {
            if (Array.isArray(order.seats)) {
              seats = order.seats
            } else if (typeof order.seats === 'string') {
              seats = JSON.parse(order.seats || '[]')
            }
          } catch (e) {
            console.error('解析座位数据错误:', e)
          }
          
          // 计算票数（座位数）
          const ticketCount = seats.length
          
          // 累加票房和票数
          const totalPrice = parseFloat(order.total_price || 0)
          stats[movieId].boxOffice += totalPrice
          stats[movieId].ticketsSold += ticketCount
          totalBoxOffice += totalPrice
          totalTickets += ticketCount
          validOrdersCount++
          
          console.log(`有效订单: ID=${order.id}, 电影=${stats[movieId].title}, 票价=${totalPrice}, 票数=${ticketCount}`)
        } else {
          console.log(`跳过未付款订单: ID=${order.id}, 状态=${order.status}`)
        }
      })

      console.log(`统计完成: 有效订单=${validOrdersCount}, 总票房=${totalBoxOffice}, 总票数=${totalTickets}`)

      // 计算百分比和平均票价
      Object.values(stats).forEach(stat => {
        stat.boxOfficePercentage = totalBoxOffice > 0 ? stat.boxOffice / totalBoxOffice : 0
        stat.ticketPercentage = totalTickets > 0 ? stat.ticketsSold / totalTickets : 0
        stat.averageTicketPrice = stat.ticketsSold > 0 ? stat.boxOffice / stat.ticketsSold : 0
        stat.occupancyRate = 0.75  // 假设每场次平均上座率，实际应按座位总数计算
      })

      return Object.values(stats)
    })

    // 筛选后的统计数据
    const filteredMovieStats = computed(() => {
      let result = [...movieStats.value]

      // 按电影名称搜索
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(stat => 
          stat.title.toLowerCase().includes(query) || 
          stat.movieId.toString().includes(query)
        )
      }

      // 按票房降序排列
      result.sort((a, b) => b.boxOffice - a.boxOffice)

      return result
    })

    // 分页后的统计数据
    const paginatedMovieStats = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredMovieStats.value.slice(start, end)
    })

    // 饼图配置 - 票房比例
    const pieChartOption = computed(() => {
      const data = filteredMovieStats.value
        .filter(stat => stat.boxOffice > 0)
        .map(stat => ({
          name: stat.title,
          value: stat.boxOffice
        }))
        .sort((a, b) => b.value - a.value)

      // 只显示前5名，其余归为"其他"
      let otherValue = 0
      const topData = []
      data.forEach((item, index) => {
        if (index < 5) {
          topData.push(item)
        } else {
          otherValue += item.value
        }
      })

      if (otherValue > 0) {
        topData.push({
          name: '其他电影',
          value: otherValue
        })
      }

      return {
        title: {
          text: '票房收入比例',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} 元 ({d}%)'
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 10,
          top: 20,
          bottom: 20,
        },
        series: [
          {
            name: '票房收入',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: topData
          }
        ]
      }
    })

    // 饼图配置 - 售票数量比例
    const ticketPieChartOption = computed(() => {
      const data = filteredMovieStats.value
        .filter(stat => stat.ticketsSold > 0)
        .map(stat => ({
          name: stat.title,
          value: stat.ticketsSold
        }))
        .sort((a, b) => b.value - a.value)

      // 只显示前5名，其余归为"其他"
      let otherValue = 0
      const topData = []
      data.forEach((item, index) => {
        if (index < 5) {
          topData.push(item)
        } else {
          otherValue += item.value
        }
      })

      if (otherValue > 0) {
        topData.push({
          name: '其他电影',
          value: otherValue
        })
      }

      return {
        title: {
          text: '售票数量比例',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} 张 ({d}%)'
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 10,
          top: 20,
          bottom: 20,
        },
        series: [
          {
            name: '售票数量',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: topData
          }
        ]
      }
    })

    // 柱状图配置 - 热门电影票房
    const barChartOption = computed(() => {
      // 取票房前5的电影数据
      const topMovies = filteredMovieStats.value
        .filter(stat => stat.boxOffice > 0)
        .sort((a, b) => b.boxOffice - a.boxOffice)
        .slice(0, 5)

      const movieNames = topMovies.map(movie => movie.title)
      const boxOfficeData = topMovies.map(movie => movie.boxOffice)
      const ticketData = topMovies.map(movie => movie.ticketsSold)

      return {
        title: {
          text: '热门电影票房与售票量对比',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['票房（元）', '售票数量（张）'],
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: movieNames,
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '票房（元）',
            position: 'left'
          },
          {
            type: 'value',
            name: '售票数量（张）',
            position: 'right'
          }
        ],
        series: [
          {
            name: '票房（元）',
            type: 'bar',
            yAxisIndex: 0,
            data: boxOfficeData,
            itemStyle: {
              color: '#5470C6'
            }
          },
          {
            name: '售票数量（张）',
            type: 'bar',
            yAxisIndex: 1,
            data: ticketData,
            itemStyle: {
              color: '#91CC75'
            }
          }
        ]
      }
    })

    // 当筛选条件改变时，重置页码
    watch([searchQuery, dateRange], () => {
      currentPage.value = 1
    })

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

    // 重置筛选条件
    const resetFilters = () => {
      searchQuery.value = ''
      dateRange.value = []
      currentPage.value = 1
    }

    // 格式化货币
    const formatCurrency = (value) => {
      return `¥ ${parseFloat(value).toFixed(2)}`
    }

    // 格式化百分比
    const formatPercent = (value) => {
      return `${(value * 100).toFixed(2)}%`
    }

    // 加载数据
    const fetchData = async () => {
      loading.value = true
      try {
        console.log('开始加载数据...')
        await Promise.all([
          store.dispatch('movies/fetchMovies'),
          store.dispatch('orders/fetchOrders'),
          store.dispatch('screenings/fetchScreenings')
        ])
        console.log('数据加载完成')
        console.log('订单数量:', store.getters['orders/allOrders']?.length || 0)
        console.log('电影数量:', store.getters['movies/allMovies']?.length || 0)
        console.log('场次数量:', store.getters['screenings/allScreenings']?.length || 0)
      } catch (error) {
        console.error('获取统计数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchData)

    return {
      loading,
      currentPage,
      pageSize,
      searchQuery,
      dateRange,
      filteredMovieStats,
      paginatedMovieStats,
      pieChartOption,
      ticketPieChartOption,
      barChartOption,
      handleSizeChange,
      handleCurrentChange,
      handleSearch,
      resetFilters,
      formatCurrency,
      formatPercent
    }
  }
}
</script>

<style scoped>
.charts-container {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.statistics-table {
  margin-bottom: 20px;
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

.pagination-container {
  margin-top: 20px;
  padding: 15px 0;
  display: flex;
  justify-content: flex-end;
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
  
  .chart {
    height: 300px;
  }
}
</style> 