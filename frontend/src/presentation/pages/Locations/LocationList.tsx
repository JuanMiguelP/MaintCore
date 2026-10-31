import {
  Typography, Box, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip,
  TextField, CircularProgress, Alert, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material'
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as ViewIcon, LocationOn as LocationIcon, Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getLocations, deleteLocation, updateLocation, createLocation, LocationResponse } from '@/application/api/locations'
import LocationForm from './LocationForm'
import LocationDetailDialog from './LocationDetailDialog'

export default function LocationList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLocation, setDetailLocation] = useState<LocationResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['locations', page, pageSize, search],
    queryFn: () => getLocations({ page: page + 1, page_size: pageSize, search: search || undefined }),
  })

  const deleteM = useMutation({ mutationFn: (id: string) => deleteLocation(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); setDeleteConfirm(null) } })
  const createM = useMutation({ mutationFn: (p: any) => createLocation(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); setFormOpen(false); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })
  const updateM = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updateLocation(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); setFormOpen(false); setEditingLocation(null); setFormError(null) }, onError: (e: any) => setFormError(e?.response?.data?.detail || 'Error') })

  const handleCreate = () => { setEditingLocation(null); setFormError(null); setFormOpen(true) }
  const handleEdit = (l: LocationResponse) => { setEditingLocation(l); setFormError(null); setFormOpen(true) }
  const handleView = (l: LocationResponse) => { setDetailLocation(l); setDetailOpen(true) }
  const handleSave = (payload: any) => { editingLocation ? updateM.mutate({ id: editingLocation.id, payload }) : createM.mutate(payload) }
  const handleDeleteRequest = (id: string) => setDeleteConfirm(id)
  const handleDeleteConfirm = () => { if (deleteConfirm) deleteM.mutate(deleteConfirm) }

  const totalItems = data?.total || 0
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Ubicaciones</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nueva UbicaciÃ³n</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }} sx={{ minWidth: 300 }} />
      </Box>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar las ubicaciones.</Alert>}

      {!isLoading && data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Total: {totalItems} ubicaciones | PÃ¡gina {data.page} de {data.total_pages}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell><TableCell>CÃ³digo</TableCell><TableCell>UbicaciÃ³n padre</TableCell>
                  <TableCell>DirecciÃ³n</TableCell><TableCell>Estado</TableCell><TableCell>Fecha creaciÃ³n</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <LocationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, display: 'block' }} />
                    <Typography variant="h6" color="text.secondary">No hay ubicaciones</Typography>
                    <Typography variant="body2" color="text.secondary">{search ? 'Sin resultados con la bÃºsqueda aplicada' : 'Crea una nueva ubicaciÃ³n para comenzar'}</Typography>
                  </TableCell></TableRow>
                ) : data.items.map(location => (
                  <TableRow key={location.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{location.name}</Typography></TableCell>
                    <TableCell>{location.code || '-'}</TableCell>
                    <TableCell>{location.parent_id ? 'SÃ­' : '-'}</TableCell>
                    <TableCell>{location.address || '-'}</TableCell>
                    <TableCell><Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: location.is_active ? '#2e7d32' : '#9e9e9e', mr: 1 }} />{location.is_active ? 'Activa' : 'Inactiva'}</TableCell>
                    <TableCell>{new Date(location.created_at).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Ver detalle"><IconButton size="small" color="primary" onClick={() => handleView(location)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleEdit(location)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDeleteRequest(location.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      <LocationForm open={formOpen} onClose={() => { setFormOpen(false); setEditingLocation(null); setFormError(null) }} onSave={handleSave} initialData={editingLocation} allLocations={data?.items || []} error={formError} />

      {deleteConfirm && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDeleteConfirm(null)}>
          <Box sx={{ backgroundColor: 'background.paper', p: 4, borderRadius: 2, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ mb: 2 }}>Confirmar eliminaciÃ³n</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>Â¿EstÃ¡s seguro de que quieres eliminar esta ubicaciÃ³n?</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteM.isPending}>{deleteM.isPending ? 'Eliminando...' : 'Eliminar'}</Button>
            </Box>
          </Box>
        </Box>
      )}

      <LocationDetailDialog open={detailOpen} onClose={() => { setDetailOpen(false); setDetailLocation(null) }} location={detailLocation} />
    </Box>
  )
}
