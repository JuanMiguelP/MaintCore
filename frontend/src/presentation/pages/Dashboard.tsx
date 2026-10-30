import { Typography, Grid, Card, CardContent, Box, LinearProgress, Paper } from '@mui/material'
import { Inventory2, Assignment, Build, Warning, CheckCircle, Schedule, AttachMoney } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getWorkOrdersByStatus, getWorkOrdersByPriority, getMaintenanceCompliance } from '@/application/api/dashboard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const STATUS_COLORS: Record<string, string> = { OPEN: '#1976d2', ASSIGNED: '#7b1fa2', IN_PROGRESS: '#f57c00', ON_HOLD: '#ff9800', COMPLETED: '#2e7d32', CANCELLED: '#d32f2f' }
const PRIORITY_COLORS: Record<string, string> = { LOW: '#4caf50', MEDIUM: '#ff9800', HIGH: '#f57c00', CRITICAL: '#d32f2f' }

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
export default function DashboardPage() {
  const { data: summary, isLoading: s1 } = useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary })
  const { data: woByStatus, isLoading: s2 } = useQuery({ queryKey: ['wo-by-status'], queryFn: getWorkOrdersByStatus })
  const { data: woByPriority, isLoading: s3 } = useQuery({ queryKey: ['wo-by-priority'], queryFn: getWorkOrdersByPriority })
  const { data: compliance, isLoading: s4 } = useQuery({ queryKey: ['maintenance-compliance'], queryFn: getMaintenanceCompliance })

  const loading = s1 || s2 || s3 || s4
  const complianceRate = summary && summary.preventive_plans > 0 ? Math.round(((summary.preventive_plans - summary.overdue_plans) / summary.preventive_plans) * 100) : 0

  if (loading) return <Box sx={{ width: '100%', mt: 4 }}><LinearProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>Dashboard Ejecutivo</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Total Activos" value={summary?.total_assets || 0} icon={<Inventory2 sx={{ fontSize: 40 }} />} color="#1976d2" subtitle={`${summary?.active_assets || 0} activos`} /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Órdenes Abiertas" value={summary?.open_work_orders || 0} icon={<Assignment sx={{ fontSize: 40 }} />} color="#f57c00" subtitle="OPEN, ASSIGNED, IN_PROGRESS, ON_HOLD" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Completadas (30d)" value={summary?.completed_last_30_days || 0} icon={<CheckCircle sx={{ fontSize: 40 }} />} color="#2e7d32" subtitle="Últimos 30 días" /></Grid>
        <Grid item xs={12} sm={6} md={3}><KPICard title="Valor Inventario" value={`€${(summary?.inventory_valuation || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} icon={<AttachMoney sx={{ fontSize: 40 }} />} color="#00796b" /></Grid>
      </Grid>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}><KPICard title="Planes Vencidos" value={summary?.overdue_plans || 0} icon={<Warning sx={{ fontSize: 40 }} />} color="#d32f2f" subtitle={`${summary?.preventive_plans || 0} planes activos`} /></Grid>
        <Grid item xs={12} sm={6} md={4}><KPICard title="Stock Bajo" value={summary?.low_stock_parts || 0} icon={<Build sx={{ fontSize: 40 }} />} color="#dc004e" subtitle="Parts <= minimum_stock" /></Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}><Box sx={{ color: '#7b1fa2', display: 'flex', alignItems: 'center' }}><Schedule sx={{ fontSize: 40 }} /></Box><Typography variant="body2" color="text.secondary">Cumplimiento Preventivo</Typography></Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: complianceRate >= 80 ? '#2e7d32' : complianceRate >= 50 ? '#f57c00' : '#d32f2f' }}>{complianceRate}%</Typography>
              <LinearProgress variant="determinate" value={complianceRate} sx={{ mt: 1, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { backgroundColor: complianceRate >= 80 ? '#2e7d32' : complianceRate >= 50 ? '#f57c00' : '#d32f2f' } }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}><Paper sx={{ p: 2 }}><Typography variant="h6" gutterBottom>Órdenes por Estado</Typography><ResponsiveContainer width="100%" height={300}><BarChart data={woByStatus || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="status" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count">{(woByStatus || []).map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#1976d2'} />)}</Bar></BarChart></ResponsiveContainer></Paper></Grid>
        <Grid item xs={12} md={6}><Paper sx={{ p: 2 }}><Typography variant="h6" gutterBottom>Órdenes por Prioridad</Typography><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={woByPriority || []} cx="50%" cy="50%" labelLine={false} label={({ priority, count }) => `${priority}: ${count}`} outerRadius={100} fill="#8884d8" dataKey="count">{(woByPriority || []).map((entry, index) => <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#1976d2'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Paper></Grid>
        <Grid item xs={12}><Paper sx={{ p: 2 }}><Typography variant="h6" gutterBottom>Generación de Órdenes Preventivas (Últimos 7 días)</Typography><ResponsiveContainer width="100%" height={250}><LineChart data={compliance || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip formatter={(value: number) => [value, 'Generadas']} /><Line type="monotone" dataKey="generated" stroke="#1976d2" strokeWidth={2} dot={{ fill: '#1976d2' }} /></LineChart></ResponsiveContainer></Paper></Grid>
      </Grid>
    </Box>
  )
}
