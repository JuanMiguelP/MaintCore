import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useState, useEffect } from 'react'

// Pages
import Login from './presentation/pages/Login'
import Dashboard from './presentation/pages/Dashboard'
import AssetList from './presentation/pages/Assets/AssetList'
import CategoryList from './presentation/pages/Categories/CategoryList'
import UserList from './presentation/pages/Users/UserList'
import WorkOrderList from './presentation/pages/WorkOrders/WorkOrderList'
import PreventiveMaintenanceList from './presentation/pages/PreventiveMaintenance/PreventiveMaintenanceList'
import NotificationSettings from './presentation/pages/NotificationSettings/NotificationSettings'
import PartList from './presentation/pages/Inventory/PartList'

// Layout
import MainLayout from './presentation/components/layout/MainLayout'

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setAuthenticated(!!token)
  }, [])

  if (authenticated === null) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={() => setAuthenticated(true)} />} />

      <Route
        path="/"
        element={authenticated ? <MainLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<AssetList />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="users" element={<UserList />} />
        <Route path="work-orders" element={<WorkOrderList />} />
        <Route path="preventive-maintenance" element={<PreventiveMaintenanceList />} />
        <Route path="notification-settings" element={<NotificationSettings />} />
        <Route path="inventory" element={<PartList />} />
      </Route>

      <Route path="*" element={<Navigate to={authenticated ? "/" : "/login"} replace />} />
    </Routes>
  )
}

export default App
