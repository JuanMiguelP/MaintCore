import { useState } from 'react'
import { Typography, Box, Tabs, Tab, Grid, Card, CardContent, Paper, CircularProgress, Alert, LinearProgress, Button } from '@mui/material'
import {
  Inventory2, Assignment, Build, Warning, CheckCircle,
  AttachMoney, TrendingUp, Download, Report as ReportIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { getParts, getLowStockParts, getInventoryValuation } from '@/application/api/inventory'
import { getWorkOrders } from '@/application/api/work_orders'
import { getMaintenancePlans, getOverduePlans, getUpcomingPlans } from '@/application/api/preventive_maintenance'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#1976d2', ASSIGNED: '#7b1fa2', IN_PROGRESS: '#f57c00',
  ON_HOLD: '#ff9800', COMPLETED: '#2e7d32', CANCELLED: '#d32f2f',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#4caf50', MEDIUM: '#ff9800', HIGH: '#f57c00', CRITICAL: '#d32f2f',
}

function KPICard({ title, value, icon, color, subtitle }: { title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  )
}

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

export default function ReportsPage() {
  const [tab, setTab] = useState(0)

  const { data: parts, isLoading: p1 } = useQuery({ queryKey: ['inventory-parts'], queryFn: () => getParts({ page_size: 500 }) })
  const { data: lowStockParts, isLoading: p2 } = useQuery({ queryKey: ['low-stock-parts'], queryFn: getLowStockParts })
  const { data: valuation, isLoading: p3 } = useQuery({ queryKey: ['inventory-valuation'], queryFn: getInventoryValuation })
  const { data: workOrders, isLoading: w1 } = useQuery({ queryKey: ['work-orders-report'], queryFn: () => getWorkOrders({ page_size: 500 }) })
  const { data: overduePlans, isLoading: m1 } = useQuery({ queryKey: ['overdue-plans'], queryFn: () => getOverduePlans({ page_size: 500 }) })
  const { data: upcomingPlans, isLoading: m2 } = useQuery({ queryKey: ['upcoming-plans'], queryFn: () => getUpcomingPlans({ days_ahead: 30, page_size: 500 }) })
  const { data: allPlans, isLoading: m3 } = useQuery({ queryKey: ['all-plans'], queryFn: () => getMaintenancePlans({ page_size: 500 }) })

  const loading = p1 || p2 || p3 || w1 || m1 || m2 || m3

  // Inventory calculations
  const totalParts = parts?.total || 0
  const totalValue = valuation?.total_value || 0
  const lowStockCount = lowStockParts?.length || 0
  const outOfStockCount = parts?.items?.filter((p: any) => p.current_stock === 0).length || 0

  // Work Orders calculations
  const openWOs = workOrders?.items?.filter((wo: any) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(wo.status)).length || 0
  const completedWOs = workOrders?.items?.filter((wo: any) => wo.status === 'COMPLETED').length || 0
  const cancelledWOs = workOrders?.items?.filter((wo: any) => wo.status === 'CANCELLED').length || 0

  // Preventive calculations
  const activePlans = allPlans?.items?.filter((p: any) => p.is_active).length || 0
  const overdueCount = overduePlans?.total || 0
  const upcomingCount = upcomingPlans?.total || 0

  // Chart data
  const inventoryBySupplier = valuation?.by_supplier?.map((s: any) => ({ name: s.supplier, value: s.total_value })) || []
  const topParts = (parts?.items || [])
    .sort((a: any, b: any) => (b.current_stock * b.unit_cost) - (a.current_stock * a.unit_cost))
    .slice(0, 10)
    .map((p: any) => ({ name: p.name.substring(0, 20), value: p.current_stock * p.unit_cost }))

  const woByStatus = Object.entries(
    (workOrders?.items || []).reduce((acc: any, wo: any) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1
      return acc
    }, {})
  ).map(([status, count]) => ({ status, count }))

  const woByPriority = Object.entries(
    (workOrders?.items || []).reduce((acc: any, wo: any) => {
      acc[wo.priority] = (acc[wo.priority] || 0) + 1
      return acc
    }, {})
  ).map(([priority, count]) => ({ priority, count }))

  const plansByFrequency = (allPlans?.items || []).reduce((acc: any, p: any) => {
    acc[p.frequency_type] = (acc[p.frequency_type] || 0) + 1
    return acc
  }, {})
  const frequencyChartData = Object.entries(plansByFrequency).map(([type, count]) => ({ name: type, count }))

  if (loading) return <Box sx={{ width: '100%', mt: 4 }}><LinearProgress /></Box>

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reportes y Exportaciones</Typography>
        <Button variant="outlined" startIcon={<Download />} onClick={() => exportToCSV(parts?.items || [], 'inventory-parts')}>
          Exportar CSV
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Inventario" icon={<Inventory2 />} iconPosition="start" />
        <Tab label="Órdenes de Trabajo" icon={<Assignment />} iconPosition="start" />
        <Tab label="Mantenimiento Preventivo" icon={<Build />} iconPosition="start" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar los reportes.</Alert>}

      {/* INVENTORY TAB */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Total Repuestos" value={totalParts} icon={<Inventory2 sx={{ fontSize: 40 }} />} color="#1976d2" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Valor Inventario" value={`€${totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} icon={<AttachMoney sx={{ fontSize: 40 }} />} color="#00796b" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Stock Bajo" value={lowStockCount} icon={<Warning sx={{ fontSize: 40 }} />} color="#dc004e" subtitle={`${outOfStockCount} agotados`} /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Top Repuesto" value={(topParts[0]?.name || '-').substring(0, 15)} icon={<TrendingUp sx={{ fontSize: 40 }} />} color="#2e7d32" subtitle={`€${(topParts[0]?.value || 0).toLocaleString('es-ES')} valor`} /></Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Valor por Proveedor</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryBySupplier}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`€${value.toLocaleString('es-ES')}`, 'Valor']} />
                    <Bar dataKey="value" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Top 10 Repuestos por Valor</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topParts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip formatter={(value: number) => [`€${value.toLocaleString('es-ES')}`, 'Valor']} />
                    <Bar dataKey="value" fill="#00796b" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* WORK ORDERS TAB */}
      {tab === 1 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Órdenes Abiertas" value={openWOs} icon={<Assignment sx={{ fontSize: 40 }} />} color="#f57c00" subtitle="Pendientes" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Completadas" value={completedWOs} icon={<CheckCircle sx={{ fontSize: 40 }} />} color="#2e7d32" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Canceladas" value={cancelledWOs} icon={<Warning sx={{ fontSize: 40 }} />} color="#d32f2f" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Total Órdenes" value={workOrders?.total || 0} icon={<ReportIcon sx={{ fontSize: 40 }} />} color="#7b1fa2" /></Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Órdenes por Estado</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={woByStatus} cx="50%" cy="50%" labelLine={false} label={({ status, count }) => `${status}: ${count}`} outerRadius={100} fill="#8884d8" dataKey="count">
                      {woByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#1976d2'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Órdenes por Prioridad</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={woByPriority} cx="50%" cy="50%" labelLine={false} label={({ priority, count }) => `${priority}: ${count}`} outerRadius={100} fill="#82ca9d" dataKey="count">
                      {woByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#1976d2'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* PREVENTIVE MAINTENANCE TAB */}
      {tab === 2 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Planes Activos" value={activePlans} icon={<Build sx={{ fontSize: 40 }} />} color="#1976d2" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Vencidos" value={overdueCount} icon={<Warning sx={{ fontSize: 40 }} />} color="#d32f2f" subtitle="Requieren atención" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KPICard title="Próximos (30d)" value={upcomingCount} icon={<TrendingUp sx={{ fontSize: 40 }} />} color="#f57c00" /></Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}><Box sx={{ color: '#7b1fa2', display: 'flex', alignItems: 'center' }}><CheckCircle sx={{ fontSize: 40 }} /></Box><Typography variant="body2" color="text.secondary">Cumplimiento</Typography></Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: activePlans > 0 && overdueCount === 0 ? '#2e7d32' : '#f57c00' }}>
                    {activePlans > 0 ? Math.round(((activePlans - overdueCount) / activePlans) * 100) : 100}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Planes por Frecuencia</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={frequencyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7b1fa2" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Estado de Planes</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Activos</Typography>
                    <Typography variant="h6" color="#1976d2">{activePlans}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Vencidos</Typography>
                    <Typography variant="h6" color="#d32f2f">{overdueCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Próximos</Typography>
                    <Typography variant="h6" color="#f57c00">{upcomingCount}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  )
}
