import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
function ProtectedRoute({ children, adminOnly }) {
  const { session, loading, isAdmin } = useAuth()
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 900)
    return () => clearTimeout(timer)
  }, [])

  if (loading || !minTimeElapsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Halaman publik — TIDAK perlu login, dibagikan ke orang tua calon siswa */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
