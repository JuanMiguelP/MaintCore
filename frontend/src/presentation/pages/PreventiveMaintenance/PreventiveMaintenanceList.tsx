import {
  Typography, Box, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip,
  TextField, CircularProgress, Alert, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, Grid,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as ViewIcon, Build as PlanIcon, Warning as OverdueIcon,
  Event as UpcomingIcon, Assignment as WoIcon, Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getMaintenancePlans, deleteMaintenancePlan, updateMaintenancePlan, createMaintenancePlan, generateFromPlan, autoGenerateOverdue, getOverduePlans, getUpcomingPlans, MaintenancePlanResponse } from '@/application/api/preventive_maintenance'
import { getAssets } from '@/application/api/assets'
import PreventiveMaintenanceForm from './PreventiveMaintenanceForm'
import PreventiveMaintenanceDetailDialog from './PreventiveMaintenanceDetailDialog'

const freqColors: Record<string, string> = {
  DAILY: '#1976d2', WEEKLY: '#7b1fa2', MONTHLY: '#f57c00', QUARTERLY: '#00796b', YEARLY: '#4caf50',
}
const priorityColors: Record<string, string> = {
  LOW: '#4caf50', MEDIUM: '#ff9800', HIGH: '#f57c00', CRITICAL: '#d32f2f',
}

export default function PreventiveMaintenanceList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [assetFilter, setAssetFilter] = useState('')
  const [freqFilter, setFreqFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [tab, setTab] = useState<'all' | 'overdue' | 'upcoming'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MaintenancePlanResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailPlan, setDetailPlan] = useState<MaintenancePlanResponse | null>(null)
  const [generateConfirm, setGenerateConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const { data: assetsData } = useQuery({ queryKey: ['assets'], queryFn: () => getAssets({ page_size: 500 }) })
  const assets = assetsData?.items || []

  const { data, isLoading, error } = useQuery({
    queryKey: ['preventive-maintenance', tab, page, pageSize, search, assetFilter, freqFilter, activeFilter],
    queryFn: () => {
      if (tab === 'overdue') return getOverduePlans({ page: page + 1, page_size: pageSize })
      if (tab === 'upcoming') return getUpcomingPlans({ days_ahead: 30, page: page + 1, page_size: pageSize })
      return getMaintenancePlans({ page: page + 1, page_size: pageSize, search: search || undefined, asset_id: assetFilter || undefined, frequency_type: freqFilter || undefined, is_active: activeFilter ? activeFilter === 'true' : undefined })
    },
  })

  const deleteM = useMutation({ mutationFn: (id: string) => deleteMaintenancePlan(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['preventive-maintenance'] }); setDeleteConfirm(null) } })
  const createM = useMutation({ mutationFn: (p: any) => createMaintenancePlan(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ['preventive-maintenance'] }); setFormOpen(false); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })
  const updateM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updateMaintenancePlan(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['preventive-maintenance'] }); setFormOpen(false); setEditingPlan(null); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })
  const generateM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: { scheduled_date: string } }) => generateFromPlan(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['preventive-maintenance'] }); setGenerateConfirm(null); setGenerateError(null) }, onError: (e: any) => setGenerateError(e?.response?.data?.detail || 'Error') })
  const autoGenM = useMutation({ mutationFn: autoGenerateOverdue, onSuccess: () => { qc.invalidateQueries({ queryKey: ['preventive-maintenance'] }) } })

  const handleCreate = () => { setEditingPlan(null); setFormError(null); setFormOpen(true) }
  const handleEdit = (p: MaintenancePlanResponse) => { setEditingPlan(p); setFormError(null); setFormOpen(true) }
  const handleView = (p: MaintenancePlanResponse) => { setDetailPlan(p); setDetailOpen(true) }
  const handleSave = (payload: any) => { editingPlan ? updateM.mutate({ id: editingPlan.id, payload }) : createM.mutate(payload) }
  const handleDeleteRequest = (id: string) => setDeleteConfirm(id)
  const handleDeleteConfirm = () => { if (deleteConfirm) deleteM.mutate(deleteConfirm) }
  const handleGenerateRequest = (id: string) => { setGenerateConfirm(id); setGenerateError(null) }
  const handleGenerateConfirm = () => { if (generateConfirm) generateM.mutate({ id: generateConfirm, payload: { scheduled_date: new Date().toISOString().split('T')[0] } }) }

  const totalItems = data?.total || 0
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Mantenimiento Preventivo</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nuevo Plan</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button variant={tab === 'all' ? 'contained' : 'outlined'} onClick={() => { setTab('all'); setPage(0) }}>Todos</Button>
        <Button variant={tab === 'overdue' ? 'contained' : 'outlined'} onClick={() => { setTab('overdue'); setPage(0) }} startIcon={<OverdueIcon />}>Vencidos ({data?.total || 0})</Button>
        <Button variant={tab === 'upcoming' ? 'contained' : 'outlined'} onClick={() => { setTab('upcoming'); setPage(0) }} startIcon={<UpcomingIcon />}>Próximos</Button>
      </Box>

      {tab === 'overdue' && (
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" color="warning" onClick={() => autoGenM.mutate()} startIcon={<PlanIcon />} disabled={autoGenM.isPending}>
            {autoGenM.isPending ? 'Generando...' : 'Generar Ejecuciones Vencidas'}
          </Button>
        </Box>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Activo</InputLabel>
          <Select value={activeFilter} label="Activo" onChange={e => setActiveFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Activos</MenuItem>
            <MenuItem value="false">Inactivos</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Frecuencia</InputLabel>
          <Select value={freqFilter} label="Frecuencia" onChange={e => setFreqFilter(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="DAILY">Diario</MenuItem>
            <MenuItem value="WEEKLY">Semanal</MenuItem>
            <MenuItem value="MONTHLY">Mensual</MenuItem>
            <MenuItem value="QUARTERLY">Trimestral</MenuItem>
            <MenuItem value="YEARLY">Anual</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar los planes.</Alert>}

      {!isLoading && data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Total: {totalItems} planes | Página {data.page} de {data.total_pages}
            {tab === 'overdue' && ' (Vencidos)'}
            {tab === 'upcoming' && ' (Próximos 30 días)'}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell><TableCell>Nombre</TableCell><TableCell>Activo</TableCell>
                  <TableCell>Frecuencia</TableCell><TableCell>Próxima ejecución</TableCell><TableCell>Prioridad</TableCell>
                  <TableCell>Estado</TableCell><TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <PlanIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, display: 'block' }} />
                    <Typography variant="h6" color="text.secondary">No hay planes preventivos</Typography>
                    <Typography variant="body2" color="text.secondary">{tab === 'overdue' ? 'No hay planes vencidos' : tab === 'upcoming' ? 'No hay planes próximos' : 'Crea un nuevo plan para comenzar'}</Typography>
                  </TableCell></TableRow>
                ) : data.items.map(plan => {
                  const isOverdue = plan.next_due_date && new Date(plan.next_due_date) < new Date()
                  return (
                    <TableRow key={plan.id} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{plan.code}</Typography></TableCell>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>{plan.asset_name || '-'}</TableCell>
                      <TableCell><Chip label={`${plan.frequency_value}x ${plan.frequency_type}`} size="small" sx={{ backgroundColor: freqColors[plan.frequency_type] || '#757575', color: 'white' }} /></TableCell>
                      <TableCell sx={{ color: isOverdue ? '#d32f2f' : 'inherit', fontWeight: isOverdue ? 600 : 'inherit' }}>{plan.next_due_date ? new Date(plan.next_due_date).toLocaleDateString('es-ES') : '-'}{isOverdue && ' ⚠️'}</TableCell>
                      <TableCell><Chip label={plan.priority} size="small" sx={{ backgroundColor: priorityColors[plan.priority] || '#757575', color: 'white' }} /></TableCell>
                      <TableCell><Chip label={plan.is_active ? 'Activo' : 'Inactivo'} size="small" sx={{ backgroundColor: plan.is_active ? '#2e7d32' : '#757575', color: 'white' }} /></TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Ver detalle"><IconButton size="small" color="primary" onClick={() => handleView(plan)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Generar OT"><IconButton size="small" color="info" onClick={() => handleGenerateRequest(plan.id)} disabled={generateM.isPending}><WoIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleEdit(plan)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDeleteRequest(plan.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={totalItems} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={pageSize} onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPage(0) }} rowsPerPageOptions={[10, 20, 50, 100]} />
        </Box>
      )}

      <PreventiveMaintenanceForm open={formOpen} onClose={() => { setFormOpen(false); setEditingPlan(null); setFormError(null) }} onSave={handleSave} initialData={editingPlan} assets={assets.map(a => ({ id: a.id, name: a.name }))} error={formError} />

      {deleteConfirm && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDeleteConfirm(null)}>
          <Box sx={{ backgroundColor: 'background.paper', p: 4, borderRadius: 2, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmar eliminación</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>¿Estás seguro de que quieres eliminar este plan preventivo?</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteM.isPending}>{deleteM.isPending ? 'Eliminando...' : 'Eliminar'}</Button>
            </Box>
          </Box>
        </Box>
      )}

      {generateConfirm && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setGenerateConfirm(null)}>
          <Box sx={{ backgroundColor: 'background.paper', p: 4, borderRadius: 2, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 2 }}>Generar Orden de Trabajo</Typography>
            {generateError && <Alert severity="error" sx={{ mb: 2 }}>{generateError}</Alert>}
            <Typography variant="body2" sx={{ mb: 3 }}>¿Quieres generar una OT manualmente para este plan preventivo?</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setGenerateConfirm(null)}>Cancelar</Button>
              <Button variant="contained" color="primary" onClick={handleGenerateConfirm} disabled={generateM.isPending}>{generateM.isPending ? 'Generando...' : 'Generar OT'}</Button>
            </Box>
          </Box>
        </Box>
      )}

      <PreventiveMaintenanceDetailDialog open={detailOpen} onClose={() => { setDetailOpen(false); setDetailPlan(null) }} plan={detailPlan} />
    </Box>
  )
}
