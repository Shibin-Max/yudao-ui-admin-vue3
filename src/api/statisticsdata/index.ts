import request from '@/config/axios'

/** 单个系列的数据结构 */
export interface ChartSeriesItem {
  name: string // 维度值，例如 app、web、大阪
  data: number[] // 对应的数值序列
}

/** 柱状图响应结构 */
export interface ChartDataRespVO {
  categories: string[] // 横轴标签，例如日期
  series: ChartSeriesItem[] // 多个系列
}

/** 查询参数结构 */
export interface ChartQueryParams {
  startDate: string // 开始日期，格式：YYYY-MM-DD
  endDate: string   // 结束日期，格式：YYYY-MM-DD
  dimension?: string // 可选：维度类型（如 channel、region）
}

/** 通用统计图表 API */
export const StatisticsDataApi = {
  /** 获取柱状图数据 */
  getChartData: async (params: ChartQueryParams) => {
    return await request.get<ChartDataRespVO>({
      url: '/report/ekyc-face-check/bar-brush',
      params
    })
  }
}
