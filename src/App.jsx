import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'

function App() {
  return (
    <BrowserRouter>
      <header style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
        <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.2rem', textDecoration: 'none' }}>
          Toko Pakaian Online
        </Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produk/:id" element={<ProductDetail />} />
          {/* Nanti ditambah: /toko/:id, /keranjang, /checkout */}
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
