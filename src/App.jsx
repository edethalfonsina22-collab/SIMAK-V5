import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'

function Header() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.2rem', textDecoration: 'none', color: 'inherit' }}>
        Toko Pakaian Online
      </Link>

      <nav style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {user ? (
          <>
            <span style={{ fontSize: '0.9rem' }}>{user.email}</span>
            <button onClick={handleLogout} style={{ cursor: 'pointer' }}>Keluar</button>
          </>
        ) : (
          <>
            <Link to="/login">Masuk</Link>
            <Link to="/register">Daftar</Link>
          </>
        )}
      </nav>
    </header>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produk/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Nanti ditambah: /toko/:id, /keranjang, /checkout */}
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
