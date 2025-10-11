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
const getRecentDateRange = (days: number): ChartQueryParams => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  }
}

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
  }
}

// 渲染图表
const renderChart = (data: { categories: string[]; series: echarts.SeriesOption[] }) => {
  if (!chartInstance) return

  const emphasisStyle = {
    itemStyle: {
      shadowBlur: 10,
      shadowColor: 'rgba(0,0,0,0.3)'
    }
  }

  const option: echarts.EChartsOption = {
    title: { text: 'Daily Status Distribution' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: data.series.map(s => s.name as string),
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
      name: 'Date',
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
      ...s,
      type: 'bar',
      stack: 'status',
      emphasis: emphasisStyle
    }))
  }

  chartInstance.setOption(option)

  chartInstance.on('brushSelected', function (params: any) {
    const brushed: string[] = []
    const brushComponent = params.batch[0]
    for (let sIdx = 0; sIdx < brushComponent.selected.length; sIdx++) {
      const rawIndices = brushComponent.selected[sIdx].dataIndex
      brushed.push(`[Series ${sIdx}] ${rawIndices.join(', ')}`)
    }
    console.log('Selected indices:', brushed.join('\n'))
  })
}

// 获取图表数据并渲染
const fetchChartData = async () => {
  const query = getRecentDateRange(31)

  try {
    const res = await StatisticsDataApi.getChartData(query)
    if (res?.categories && res?.series) {
      renderChart(res)
    } else {
      console.warn('Unexpected response structure:', res)
    }
  } catch (err) {
    console.error('Request failed:', err)
  }
}

onMounted(() => {
  initChart()
  fetchChartData()
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>
