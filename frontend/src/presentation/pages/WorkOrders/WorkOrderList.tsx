import {
  Typography, Box, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, TextField,
  CircularProgress, Alert, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, DialogContentText,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Assignment as WoIcon, Search as SearchIcon, Build as BuildIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getWorkOrders, deleteWorkOrder, updateWorkOrder, createWorkOrder, changeStatus, getStatusHistory, getWorkOrderParts, getAssets } from '@/application/api/work_orders'
import { WorkOrderResponse, WorkOrderPartResponse, StatusHistoryEntry } from '@/application/api/work_orders'
import WorkOrderForm from './WorkOrderForm'
import WorkOrderDetailDialog from './WorkOrderDetailDialog'
import StatusHistoryDialog from './StatusHistoryDialog'

const statusColors: Record<string, string> = {
  OPEN: '#1976d2', ASSIGNED: '#7b1fa2', IN_PROGRESS: '#f57c00',
  ON_HOLD: '#ff9800', COMPLETED: '#2e7d32', CANCELLED: '#d32f2f',
}
const priorityColors: Record<string, string> = {
  LOW: '#4caf50', MEDIUM: '#ff9800', HIGH: '#f57c00', CRITICAL: '#d32f2f',
}

export default function WorkOrderList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assetFilter, setAssetFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingWO, setEditingWO] = useState<WorkOrderResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailWO, setDetailWO] = useState<WorkOrderResponse | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyWO, setHistoryWO] = useState<WorkOrderResponse | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusWO, setStatusWO] = useState<WorkOrderResponse | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [parts, setParts] = useState<WorkOrderPartResponse[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["work-orders", page, pageSize, search, statusFilter, priorityFilter, assetFilter],
    queryFn: () => getWorkOrders({ page: page + 1, page_size: pageSize, search: search || undefined, status: statusFilter || undefined, priority: priorityFilter || undefined, asset_id: assetFilter || undefined }),
  })

  const { data: assetsData } = useQuery({ queryKey: ["assets"], queryFn: () => getAssets({ page_size: 500 }) })
  const assets = assetsData?.items || []

  const deleteM = useMutation({ mutationFn: (id: string) => deleteWorkOrder(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["work-orders"] }); setDeleteConfirm(null) } })
  const createM = useMutation({ mutationFn: (p: any) => createWorkOrder(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ["work-orders"] }); setFormOpen(false); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || "Error") })
  const updateM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updateWorkOrder(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ["work-orders"] }); setFormOpen(false); setEditingWO(null); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || "Error") })
  const changeStatusM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: { new_status: string } }) => changeStatus(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ["work-orders"] }); setStatusDialogOpen(false); setStatusError(null) }, onError: (e: any) => setStatusError(e?.response?.data?.detail || "Error") })

  const handleCreate = () => { setEditingWO(null); setFormError(null); setFormOpen(true) }
  const handleEdit = (wo: WorkOrderResponse) => { setEditingWO(wo); setFormError(null); setFormOpen(true) }
  const handleView = (wo: WorkOrderResponse) => { setDetailWO(wo); setDetailOpen(true); setDetailLoading(true); setParts([]); setStatusHistory([]); Promise.all([getWorkOrderParts(wo.id), getStatusHistory(wo.id)]).then(([p, s]) => { setParts(p); setStatusHistory(s); setDetailLoading(false) }).catch(() => setDetailLoading(false)) }
  const handleHistory = (wo: WorkOrderResponse) => { setHistoryWO(wo); setHistoryOpen(true); setStatusHistory([]); getStatusHistory(wo.id).then(s => setStatusHistory(s)).catch(() => {}) }
  const handleStatusChange = (wo: WorkOrderResponse) => { setStatusWO(wo); setNewStatus(""); setStatusError(null); setStatusDialogOpen(true) }
  const handleSave = (payload: any) => { editingWO ? updateM.mutate({ id: editingWO.id, payload }) : createM.mutate(payload) }
  const handleDeleteRequest = (id: string) => setDeleteConfirm(id)
  const handleDeleteConfirm = () => { if (deleteConfirm) deleteM.mutate(deleteConfirm) }
  const handleStatusConfirm = () => { if (statusWO && newStatus) changeStatusM.mutate({ id: statusWO.id, payload: { new_status: newStatus } }) }

  const totalItems = data?.total || 0
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Ã“rdenes de Trabajo</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nueva Orden</Button>
      </Box>

      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField size="small" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} /> }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={statusFilter} label="Estado" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="ASSIGNED">Assigned</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Prioridad</InputLabel>
          <Select value={priorityFilter} label="Prioridad" onChange={e => setPriorityFilter(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="CRITICAL">Critical</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Activo</InputLabel>
          <Select value={assetFilter} label="Activo" onChange={e => setAssetFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {assets.map(a => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}
          </Select>
        </FormControl>
      </Box>

      {isLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar las Ã³rdenes.</Alert>}

      {!isLoading && data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Total: {totalItems} Ã³rdenes | PÃ¡gina {data.page} de {data.total_pages}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>WO Number</TableCell><TableCell>TÃ­tulo</TableCell><TableCell>Activo</TableCell><TableCell>Prioridad</TableCell>
                  <TableCell>Estado</TableCell><TableCell>TÃ©cnico</TableCell><TableCell>Programada</TableCell><TableCell>Creada</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 4 }}>
                    <WoIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2, display: "block" }} />
                    <Typography variant="h6" color="text.secondary">No hay Ã³rdenes</Typography>
                    <Typography variant="body2" color="text.secondary">{search || statusFilter || priorityFilter || assetFilter ? "Sin resultados con los filtros aplicados" : "Crea una nueva orden para comenzar"}</Typography>
                  </TableCell></TableRow>
                ) : data.items.map(wo => (
                  <TableRow key={wo.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>{wo.wo_number}</Typography></TableCell>
                    <TableCell>{wo.title}</TableCell>
                    <TableCell>{wo.asset_name || "-"}</TableCell>
                    <TableCell><Chip label={wo.priority} size="small" sx={{ backgroundColor: priorityColors[wo.priority] || "#757575", color: "white" }} /></TableCell>
                    <TableCell><Chip label={wo.status} size="small" sx={{ backgroundColor: statusColors[wo.status] || "#757575", color: "white" }} /></TableCell>
                    <TableCell>{wo.technician_name || "-"}</TableCell>
                    <TableCell>{wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString("es-ES") : "-"}</TableCell>
                    <TableCell>{new Date(wo.created_at).toLocaleDateString("es-ES")}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <Tooltip title="Ver detalle"><IconButton size="small" color="primary" onClick={() => handleView(wo)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleEdit(wo)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Cambiar estado"><IconButton size="small" color="info" onClick={() => handleStatusChange(wo)}><BuildIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDeleteRequest(wo.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      <WorkOrderForm open={formOpen} onClose={() => { setFormOpen(false); setEditingWO(null); setFormError(null) }} onSave={handleSave} initialData={editingWO} assets={assets.map(a => ({ id: a.id, name: a.name }))} technicians={[]} error={formError} />

      {deleteConfirm && (
        <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setDeleteConfirm(null)}>
          <Box sx={{ backgroundColor: "background.paper", p: 4, borderRadius: 2, maxWidth: 400, width: "100%" }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmar eliminaciÃ³n</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>Â¿EstÃ¡s seguro de que quieres eliminar esta orden?</Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteM.isPending}>{deleteM.isPending ? "Eliminando..." : "Eliminar"}</Button>
            </Box>
          </Box>
        </Box>
      )}

      {statusWO && statusDialogOpen && (
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cambiar estado</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>WO {statusWO.wo_number}: {statusWO.title}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Estado actual: <Chip label={statusWO.status} size="small" sx={{ backgroundColor: statusColors[statusWO.status] || "#757575", color: "white" }} /></Typography>
            {statusError && <Alert severity="error" sx={{ mt: 1 }}>{statusError}</Alert>}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
              {statusWO.status === "OPEN" && (<Button variant={newStatus === "ASSIGNED" ? "contained" : "outlined"} onClick={() => setNewStatus("ASSIGNED")}>Assign</Button>)}
              {(statusWO.status === "ASSIGNED" || statusWO.status === "OPEN") && (<Button variant={newStatus === "IN_PROGRESS" ? "contained" : "outlined"} onClick={() => setNewStatus("IN_PROGRESS")}>In Progress</Button>)}
              {statusWO.status === "IN_PROGRESS" && (<Button variant={newStatus === "COMPLETED" ? "contained" : "outlined"} onClick={() => setNewStatus("COMPLETED")}>Complete</Button>)}
              {(statusWO.status === "OPEN" || statusWO.status === "ASSIGNED" || statusWO.status === "IN_PROGRESS") && (<Button variant={newStatus === "CANCELLED" ? "contained" : "outlined"} color="error" onClick={() => setNewStatus("CANCELLED")}>Cancel</Button>)}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleStatusConfirm} disabled={!newStatus || changeStatusM.isPending}>{changeStatusM.isPending ? "Cambiando..." : "Cambiar"}</Button>
          </DialogActions>
        </Dialog>
      )}

      <WorkOrderDetailDialog open={detailOpen} onClose={() => { setDetailOpen(false); setDetailWO(null) }} wo={detailWO} parts={parts} statusHistory={statusHistory} />
      <StatusHistoryDialog open={historyOpen} onClose={() => { setHistoryOpen(false); setHistoryWO(null) }} entries={statusHistory} />
    </Box>
  )
}
