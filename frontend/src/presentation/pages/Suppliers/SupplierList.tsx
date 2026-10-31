import {
  Typography, Box, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip,
  TextField, CircularProgress, Alert, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as ViewIcon, Business as SupplierIcon, Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getSuppliers, deleteSupplier, updateSupplier, createSupplier, SupplierResponse } from '@/application/api/suppliers'
import SupplierForm from './SupplierForm'
import SupplierDetailDialog from './SupplierDetailDialog'

export default function SupplierList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailSupplier, setDetailSupplier] = useState<SupplierResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', page, pageSize, search],
    queryFn: () => getSuppliers({ page: page + 1, page_size: pageSize, search: search || undefined }),
  })

  const deleteM = useMutation({ mutationFn: (id: string) => deleteSupplier(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteConfirm(null) } })
  const createM = useMutation({ mutationFn: (p: any) => createSupplier(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setFormOpen(false); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })
  const updateM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updateSupplier(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setFormOpen(false); setEditingSupplier(null); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })

  const handleCreate = () => { setEditingSupplier(null); setFormError(null); setFormOpen(true) }
  const handleEdit = (s: SupplierResponse) => { setEditingSupplier(s); setFormError(null); setFormOpen(true) }
  const handleView = (s: SupplierResponse) => { setDetailSupplier(s); setDetailOpen(true) }
  const handleSave = (payload: any) => { editingSupplier ? updateM.mutate({ id: editingSupplier.id, payload }) : createM.mutate(payload) }
  const handleDeleteRequest = (id: string) => setDeleteConfirm(id)
  const handleDeleteConfirm = () => { if (deleteConfirm) deleteM.mutate(deleteConfirm) }

  const totalItems = data?.total || 0
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Proveedores</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nuevo Proveedor</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }} sx={{ minWidth: 300 }} />
      </Box>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar los proveedores.</Alert>}

      {!isLoading && data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Total: {totalItems} proveedores | PÃ¡gina {data.page} de {data.total_pages}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell><TableCell>CIF / Tax ID</TableCell><TableCell>Contacto</TableCell>
                  <TableCell>Email</TableCell><TableCell>TelÃ©fono</TableCell><TableCell>DirecciÃ³n</TableCell>
                  <TableCell>Fecha creaciÃ³n</TableCell><TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <SupplierIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, display: 'block' }} />
                    <Typography variant="h6" color="text.secondary">No hay proveedores</Typography>
                    <Typography variant="body2" color="text.secondary">{search ? 'Sin resultados con la bÃºsqueda aplicada' : 'Crea un nuevo proveedor para comenzar'}</Typography>
                  </TableCell></TableRow>
                ) : data.items.map(supplier => (
                  <TableRow key={supplier.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{supplier.name}</Typography></TableCell>
                    <TableCell>{supplier.tax_id || '-'}</TableCell>
                    <TableCell>{supplier.contact_person || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.address || '-'}</TableCell>
                    <TableCell>{new Date(supplier.created_at).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Ver detalle"><IconButton size="small" color="primary" onClick={() => handleView(supplier)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleEdit(supplier)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDeleteRequest(supplier.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      <SupplierForm open={formOpen} onClose={() => { setFormOpen(false); setEditingSupplier(null); setFormError(null) }} onSave={handleSave} initialData={editingSupplier} error={formError} />

      {deleteConfirm && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDeleteConfirm(null)}>
          <Box sx={{ backgroundColor: 'background.paper', p: 4, borderRadius: 2, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmar eliminaciÃ³n</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>Â¿EstÃ¡s seguro de que quieres eliminar este proveedor?</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteM.isPending}>{deleteM.isPending ? 'Eliminando...' : 'Eliminar'}</Button>
            </Box>
          </Box>
        </Box>
      )}

      <SupplierDetailDialog open={detailOpen} onClose={() => { setDetailOpen(false); setDetailSupplier(null) }} supplier={detailSupplier} />
    </Box>
  )
}
