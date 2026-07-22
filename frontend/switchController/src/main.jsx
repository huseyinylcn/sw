import { StrictMode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createRoot } from 'react-dom/client'

import './index.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'

import App from './app/App.jsx'
import Products from './app/Products.jsx'
import Design from './app/Design.jsx'
import Scenario from './app/Scenario.jsx'
import Navbar from './components/Navbar.jsx'
import Settings from './app/Settings.jsx'
import SwitchBoard from './app/SwitchBoard.jsx'

import { isAdmin } from './shared/auth'

// Keep non-admins out of these pages even via the address bar -> send them to the dashboard
function AdminOnly({ children }) {
  return isAdmin ? children : <Navigate to="/dashboard" replace />
}



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<App />} />
        <Route path="/products" element={<AdminOnly><Products /></AdminOnly>} />
        <Route path="/design" element={<AdminOnly><Design /></AdminOnly>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/board/:id" element={<SwitchBoard />} />


        <Route path="/design/:id" element={<AdminOnly><Design /></AdminOnly>} />
        {/* scenario view is read-only -> open to everyone */}
        <Route path="/scenario/:id" element={<Scenario />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
