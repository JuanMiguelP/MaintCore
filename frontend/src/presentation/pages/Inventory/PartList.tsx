import {
  Typography, Box, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, TextField,
  CircularProgress, Alert, TablePagination,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  History as HistoryIcon, Inventory2 as PartsIcon, Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getParts, deletePart, updatePart, createPart, getSuppliers, PartResponse, SupplierResponse } from '@/application/api/inventory'
import PartForm from './PartForm'

interface PartListItem extends PartResponse { total_value: number }

export default function PartList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<PartResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyPartId, setHistoryPartId] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['parts', page, pageSize, search, supplierFilter, lowStockOnly],
    queryFn: () => getParts({ page: page + 1, page_size: pageSize, search: search || undefined, supplier_id: supplierFilter || undefined, low_stock: lowStockOnly }),
  })

  const { data: suppliersData } = useQuery({ queryKey: ['suppliers'], queryFn: () => getSuppliers({ page_size: 500 }) })
  const suppliers: SupplierResponse[] = suppliersData?.items || []

  const deleteM = useMutation({ mutationFn: (id: string) => deletePart(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); setDeleteConfirm(null) } })
  const createM = useMutation({ mutationFn: (p: any) => createPart(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); setFormOpen(false); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })
  const updateM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updatePart(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); setFormOpen(false); setEditingPart(null); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })

  const handleCreate = () => { setEditingPart(null); setFormError(null); setFormOpen(true) }
  const handleEdit = (p: PartResponse) => { setEditingPart(p); setFormError(null); setFormOpen(true) }
  const handleSave = (payload: any) => { editingPart ? updateM.mutate({ id: editingPart.id, payload }) : createM.mutate(payload) }
  const handleDeleteRequest = (id: string) => setDeleteConfirm(id)
  const handleDeleteConfirm = () => { if (deleteConfirm) deleteM.mutate(deleteConfirm) }

  const stockStatus = (p: PartResponse) => { if (p.current_stock === 0) return 'out' as const; if (p.current_stock <= p.minimum_stock) return 'low' as const; return 'normal' as const }
  const statusChip = (s: string) => {
    if (s === 'out') return <Chip label="Agotado" size="small" sx={{ backgroundColor: '#d32f2f', color: 'white' }} />
    if (s === 'low') return <Chip label="Stock bajo" size="small" sx={{ backgroundColor: '#f57c00', color: 'white' }} />
    return <Chip label="Normal" size="small" variant="outlined" sx={{ borderColor: '#2e7d32', color: '#2e7d32' }} />
  }

  const totalItems = data?.total || 0
  const parts: PartListItem[] = (data?.items || []).map(p => ({ ...p, total_value: p.current_stock * p.unit_cost }))

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Repuestos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nuevo Repuesto</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar por part number o nombre..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }} sx={{ minWidth: 300 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Proveedor</InputLabel>
          <Select value={supplierFilter} label="Proveedor" onChange={e => setSupplierFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {suppliers.map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
          </Select>
        </FormControl>
        <Button size="small" variant={lowStockOnly ? 'contained' : 'outlined'} onClick={() => setLowStockOnly(!lowStockOnly)} sx={{ minWidth: 140 }}>
          {lowStockOnly ? 'Mostrando low stock' : 'Solo low stock'}
        </Button>
      </Box>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar los repuestos.</Alert>}

      {!isLoading && data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Total: {totalItems} repuestos | PÃ¡gina {data.page} de {data.total_pages}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell><TableCell>Nombre</TableCell><TableCell>DescripciÃ³n</TableCell><TableCell>Proveedor</TableCell>
                  <TableCell align="right">Stock actual</TableCell><TableCell align="right">Stock mÃ­n.</TableCell>
                  <TableCell align="right">Coste unit.</TableCell><TableCell align="right">Valor total</TableCell>
                  <TableCell>Estado</TableCell><TableCell>Fecha creaciÃ³n</TableCell><TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parts.length === 0 ? (
                  <TableRow><TableCell colSpan={11} sx={{ textAlign: 'center', py: 4 }}>
                    <PartsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, display: 'block' }} />
                    <Typography variant="h6" color="text.secondary">No hay repuestos</Typography>
                    <Typography variant="body2" color="text.secondary">{search || supplierFilter || lowStockOnly ? 'Sin resultados' : 'Crea un nuevo repuesto para comenzar'}</Typography>
                  </TableCell></TableRow>
                ) : parts.map(part => {
                  const st = stockStatus(part)
                  return (
                    <TableRow key={part.id} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{part.part_number}</Typography></TableCell>
                      <TableCell>{part.name}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{part.description || '-'}</TableCell>
                      <TableCell>{part.supplier_name || '-'}</TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{part.current_stock}</Typography></TableCell>
                      <TableCell align="right">{part.minimum_stock}</TableCell>
                      <TableCell align="right">{part.unit_cost.toFixed(2)} â‚¬</TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{part.total_value.toFixed(2)} â‚¬</Typography></TableCell>
                      <TableCell>{statusChip(st)}</TableCell>
                      <TableCell>{new Date(part.created_at).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleEdit(part)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Historial"><IconButton size="small" color="info" onClick={() => { setHistoryPartId(part.id); setHistoryPage(1); setHistoryOpen(true) }}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDeleteRequest(part.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      <PartForm open={formOpen} onClose={() => { setFormOpen(false); setEditingPart(null); setFormError(null) }} onSave={handleSave} initialData={editingPart} suppliers={suppliers} error={formError} />

      {deleteConfirm && (
        <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setDeleteConfirm(null)}>
          <Box sx={{ backgroundColor: "background.paper", p: 4, borderRadius: 2, maxWidth: 400, width: "100%" }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmar eliminaci\u00f3n</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>\u00bfEst\u00e1s seguro de que quieres eliminar este repuesto?</Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteM.isPending}>{deleteM.isPending ? "Eliminando..." : "Eliminar"}</Button>
            </Box>
          </Box>
        </Box>
      )}

      {historyPartId && (
        <ChangeHistoryDialog open={historyOpen} onClose={() => { setHistoryOpen(false); setHistoryPartId(null) }} entries={[]} total={0} page={historyPage} pageSize={50} totalPages={1} onPageChange={setHistoryPage} />
      )}
    </Box>
  )
}
