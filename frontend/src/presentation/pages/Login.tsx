import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
} from '@mui/material'
import { useAuth } from '@/application/hooks/useAuth'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login(form, {
      onSuccess: () => {
        onLogin()
        navigate('/')
      },
    })
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={4} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          MaintCore CMMS
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Inicie sesi\u00f3n para continuar
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Usuario"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Contrase\u00f1a"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            fullWidth
            required
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesi\u00f3n'}
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
