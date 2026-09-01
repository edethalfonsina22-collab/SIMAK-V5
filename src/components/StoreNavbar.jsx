import { Link, NavLink } from 'react-router-dom'
import { Shirt, Layers, Footprints, Sparkles, Backpack } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

// Kategori sama dengan yang dipakai di Sidebar.jsx (kategoriProduk) —
// disamakan supaya link ?kategori=slug tetap konsisten di seluruh app.
const kategoriProduk = [
  { slug: 'kaos', label: 'Kaos', icon: Shirt },
  { slug: 'kemeja', label: 'Kemeja', icon: Shirt },
  { slug: 'sepatu', label: 'Sepatu', icon: Footprints },
  { slug: 'jaket', label: 'Jaket', icon: Shirt },
  { slug: 'celana', label: 'Celana', icon: Layers },
  { slug: 'aksesoris', label: 'Aksesoris', icon: Backpack },
]

export default function StoreNavbar() {
  const { session } = useAuth()

  return (
    <header className="sticky top-0 z-20 bg-[#f5f4ee] border-b border-ink-900/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="font-display text-xl font-semibold text-ink-950 shrink-0">
          Toko Pakaian Online
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {kategoriProduk.map(({ slug, label, icon: Icon }) => (
            <NavLink
              key={slug}
              to={`/?kategori=${slug}`}
              className="flex items-center gap-1.5 text-sm text-ink-700 hover:text-ink-950 transition-colors"
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-sm shrink-0">
          {session ? (
            <Link to="/profil-saya" className="text-ink-700 hover:text-ink-950 transition-colors">
              Akun Saya
            </Link>
          ) : (
            <>
              <Link to="/masuk" className="text-ink-700 hover:text-ink-950 transition-colors">
                Masuk
              </Link>
              <Link to="/daftar" className="text-ink-700 hover:text-ink-950 transition-colors">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
