import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { login as apiLogin } from '../api/auth'

export function useAuth() {
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: apiLogin,
    onSuccess: () => setError(null),
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al iniciar sesi\u00f3n')
    },
  })

  return { login: mutation.mutate, loading: mutation.isPending, error }
}
