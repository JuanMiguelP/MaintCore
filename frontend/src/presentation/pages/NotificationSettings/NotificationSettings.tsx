import {
  Typography, Box, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip,
  TextField, CircularProgress, Alert, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as ViewIcon, Notifications as NotifIcon, Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getNotificationRules, deleteNotificationRule, updateNotificationRule,
  createNotificationRule, NotificationRuleResponse,
} from '@/application/api/notifications'
import NotificationRuleForm from './NotificationRuleForm'
import NotificationRuleDetailDialog from './NotificationRuleDetailDialog'

const EVENT_LABELS: Record<string, string> = {
  LOW_STOCK: 'Stock Bajo',
  OUT_OF_STOCK: 'Sin Stock',
  STOCK_RECOVERED: 'Stock Recuperado',
  WORK_ORDER_ASSIGNED: 'OT Asignada',
  WORK_ORDER_COMPLETED: 'OT Completada',
  WORK_ORDER_CANCELLED: 'OT Cancelada',
  PREVENTIVE_OVERDUE: 'Preventivo Vencido',
  CRITICAL_WORK_ORDER: 'OT Crítica',
}

const EVENT_COLORS: Record<string, string> = {
  LOW_STOCK: '#ff9800', OUT_OF_STOCK: '#d32f2f', STOCK_RECOVERED: '#4caf50',
  WORK_ORDER_ASSIGNED: '#1976d2', WORK_ORDER_COMPLETED: '#2e7d32',
  WORK_ORDER_CANCELLED: '#757575', PREVENTIVE_OVERDUE: '#f57c00',
  CRITICAL_WORK_ORDER: '#b71c1c',
}

export default function NotificationSettings() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [enabledFilter, setEnabledFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<NotificationRuleResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRule, setDetailRule] = useState<NotificationRuleResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['notification-rules', page, pageSize, search, eventFilter, enabledFilter],
    queryFn: () => getNotificationRules({ page: page + 1, page_size: pageSize, event_type: eventFilter || undefined }),
  })

  const deleteM = useMutation({ mutationFn: (id: string) => deleteNotificationRule(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notification-rules'] }); setDeleteConfirm(null) } })
  const createM = useMutation({ mutationFn: (p: any) => createNotificationRule(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notification-rules'] }); setFormOpen(false); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })
  const updateM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updateNotificationRule(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['notification-rules'] }); setFormOpen(false); setEditingRule(null); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })

  const handleCreate = () => { setEditingRule(null); setFormError(null); setFormOpen(true) }
  const handleEdit = (r: NotificationRuleResponse) => { setEditingRule(r); setFormError(null); setFormOpen(true) }
  const handleView = (r: NotificationRuleResponse) => { setDetailRule(r); setDetailOpen(true) }
  const handleSave = (payload: any) => { editingRule ? updateM.mutate({ id: editingRule.id, payload }) : createM.mutate(payload) }
  const handleDeleteRequest = (id: string) => setDeleteConfirm(id)
  const handleDeleteConfirm = () => { if (deleteConfirm) deleteM.mutate(deleteConfirm) }

  const totalItems = data?.total || 0
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Configuración de Notificaciones</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nueva Regla</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={eventFilter} label="Tipo" onChange={e => setEventFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="LOW_STOCK">Stock Bajo</MenuItem>
            <MenuItem value="OUT_OF_STOCK">Sin Stock</MenuItem>
            <MenuItem value="STOCK_RECOVERED">Stock Recuperado</MenuItem>
            <MenuItem value="WORK_ORDER_ASSIGNED">OT Asignada</MenuItem>
            <MenuItem value="WORK_ORDER_COMPLETED">OT Completada</MenuItem>
            <MenuItem value="WORK_ORDER_CANCELLED">OT Cancelada</MenuItem>
            <MenuItem value="PREVENTIVE_OVERDUE">Preventivo Vencido</MenuItem>
            <MenuItem value="CRITICAL_WORK_ORDER">OT Crítica</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={enabledFilter} label="Estado" onChange={e => setEnabledFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Activas</MenuItem>
            <MenuItem value="false">Inactivas</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar las reglas.</Alert>}

      {!isLoading && data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Total: {totalItems} reglas</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell><TableCell>Tipo</TableCell><TableCell>Destinatarios</TableCell>
                  <TableCell>Frecuencia</TableCell><TableCell>Estado</TableCell><TableCell>Fecha creación</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <NotifIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, display: 'block' }} />
                    <Typography variant="h6" color="text.secondary">No hay reglas de notificación</Typography>
                    <Typography variant="body2" color="text.secondary">{search || eventFilter ? 'Sin resultados con los filtros aplicados' : 'Crea una nueva regla para comenzar'}</Typography>
                  </TableCell></TableRow>
                ) : data.items.map(rule => (
                  <TableRow key={rule.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{rule.name}</Typography></TableCell>
                    <TableCell>
                      <Chip label={EVENT_LABELS[rule.event_type] || rule.event_type} size="small" sx={{ backgroundColor: EVENT_COLORS[rule.event_type] || '#757575', color: 'white' }} />
                    </TableCell>
                    <TableCell>{rule.recipients.join(', ')}</TableCell>
                    <TableCell>{rule.frequency || '-'}</TableCell>
                    <TableCell>
                      <Chip label={rule.enabled ? 'Activa' : 'Inactiva'} size="small" sx={{ backgroundColor: rule.enabled ? '#2e7d32' : '#9e9e9e', color: 'white' }} />
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Ver detalle"><IconButton size="small" color="primary" onClick={() => handleView(rule)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleEdit(rule)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDeleteRequest(rule.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={totalItems} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={pageSize} onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPage(0) }} rowsPerPageOptions={[10, 20, 50, 100]} />
        </Box>
      )}

      <NotificationRuleForm open={formOpen} onClose={() => { setFormOpen(false); setEditingRule(null); setFormError(null) }} onSave={handleSave} initialData={editingRule} error={formError} />

      {deleteConfirm && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDeleteConfirm(null)}>
          <Box sx={{ backgroundColor: 'background.paper', p: 4, borderRadius: 2, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmar eliminación</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>¿Estás seguro de que quieres eliminar esta regla de notificación?</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteM.isPending}>{deleteM.isPending ? 'Eliminando...' : 'Eliminar'}</Button>
            </Box>
          </Box>
        </Box>
      )}

      <NotificationRuleDetailDialog open={detailOpen} onClose={() => { setDetailOpen(false); setDetailRule(null) }} rule={detailRule} />
    </Box>
  )
}
