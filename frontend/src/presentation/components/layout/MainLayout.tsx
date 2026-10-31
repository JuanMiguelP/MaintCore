import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemAvatar,
  Avatar,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory2 as AssetsIcon,
  Category as CategoriesIcon,
  People as UsersIcon,
  Assignment as WorkOrdersIcon,
  Build as PreventiveIcon,
  Inventory2 as PartsIcon,
  Notifications as NotificationIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import GlobalSearch from '@/presentation/components/GlobalSearch'

const DRAWER_WIDTH = 260

const navItems = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { text: 'Activos', path: '/assets', icon: <AssetsIcon /> },
  { text: 'Categor\u00edas', path: '/categories', icon: <CategoriesIcon /> },
  { text: 'Usuarios', path: '/users', icon: <UsersIcon /> },
  { text: 'Órdenes de Trabajo', path: '/work-orders', icon: <WorkOrdersIcon /> },
  { text: 'Repuestos', path: '/inventory', icon: <PartsIcon /> },
  { text: 'Mantenimiento Preventivo', path: '/preventive-maintenance', icon: <PreventiveIcon /> },
  { text: 'Notificaciones', path: '/notification-settings', icon: <NotificationIcon /> },
]

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MaintCore CMMS
          </Typography>
          <GlobalSearch />
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        <Toolbar />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton component={Link} to={item.path} selected={location.pathname === item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
