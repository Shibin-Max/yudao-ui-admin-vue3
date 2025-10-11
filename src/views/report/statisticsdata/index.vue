<template>
  <ContentWrap>
    <div ref="chartRef" style="width: 100%; height: 500px"></div>
  </ContentWrap>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, ref } from 'vue'
import { StatisticsDataApi, ChartQueryParams } from '@/api/report/statisticsdata'

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

// 获取最近 N 天的日期范围
const getRecentDateRange = (days: number): { startDate: string; endDate: string } => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  }
}

// 转换后端数据为图表格式
const transformChartData = (raw: {
  date: string[]
  statusSeries: Record<string, number[]>
}): {
  categories: string[]
  series: { name: string; data: number[] }[]
} => {
  return {
    categories: raw.date,
    series: Object.entries(raw.statusSeries).map(([name, data]) => ({
      name,
      data
    }))
  }
}

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
  }
}

// 渲染图表数据
const renderChart = (data: { categories: string[]; series: { name: string; data: number[] }[] }) => {
  if (!chartInstance) return

  const emphasisStyle = {
    itemStyle: {
      shadowBlur: 10,
      shadowColor: 'rgba(0,0,0,0.3)'
    }
  }

  const option: echarts.EChartsOption = {
    title: { text: '每日状态分布图' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: data.series.map(s => s.name),
      left: '10%'
    },
    brush: {
      toolbox: ['rect', 'polygon', 'lineX', 'lineY', 'keep', 'clear'],
      xAxisIndex: 0
    },
    toolbox: {
      feature: {
        magicType: { type: ['stack'] },
        dataView: {}
      }
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      name: '日期',
      axisLabel: {
        rotate: 45,
        formatter: (val: string) => val.slice(5) // 显示 MM-DD
      },
      axisLine: { onZero: true },
      splitLine: { show: false },
      splitArea: { show: false }
    },
    yAxis: {},
    grid: { bottom: 100 },
    series: data.series.map(s => ({
      name: s.name,
      type: 'bar',
      stack: '状态',
      emphasis: emphasisStyle,
      data: s.data
    }))
  }

  chartInstance.setOption(option)

  chartInstance.on('brushSelected', function (params: any) {
    const brushed: string[] = []
    const brushComponent = params.batch[0]
    for (let sIdx = 0; sIdx < brushComponent.selected.length; sIdx++) {
      const rawIndices = brushComponent.selected[sIdx].dataIndex
      brushed.push(`[系列 ${sIdx}] ${rawIndices.join(', ')}`)
    }
  })
}

// 获取图表数据并渲染
const fetchChartData = async () => {
  const query: ChartQueryParams = getRecentDateRange(31)

  try {
    const res = await StatisticsDataApi.getChartData(query)
    if (res?.date && res?.statusSeries) {
      const chartData = transformChartData(res)
      renderChart(chartData)
    } else {
      console.warn('数据结构异常:', res)
    }
  } catch (err) {
    console.error('请求异常:', err)
  }
}

onMounted(() => {
  initChart()
  fetchChartData()
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>
