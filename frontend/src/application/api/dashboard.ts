import api from './client'

export interface DashboardSummary {
  total_assets: number
  active_assets: number
  open_work_orders: number
  completed_last_30_days: number
  preventive_plans: number
  overdue_plans: number
  low_stock_parts: number
  inventory_valuation: number
}

export interface WorkOrderStatusItem {
  status: string
  count: number
}

export interface WorkOrderPriorityItem {
  priority: string
  count: number
}

export interface MaintenanceComplianceItem {
  date: string
  generated: number
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get('/dashboard/summary')
  return data
}

export async function getWorkOrdersByStatus(): Promise<WorkOrderStatusItem[]> {
  const { data } = await api.get('/dashboard/work-orders-by-status')
  return data
}

export async function getWorkOrdersByPriority(): Promise<WorkOrderPriorityItem[]> {
  const { data } = await api.get('/dashboard/work-orders-by-priority')
  return data
}

export async function getMaintenanceCompliance(): Promise<MaintenanceComplianceItem[]> {
  const { data } = await api.get('/dashboard/maintenance-compliance')
  return data
}
