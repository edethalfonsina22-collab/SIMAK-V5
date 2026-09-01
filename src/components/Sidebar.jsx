import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tags,
  ClipboardList,
  Store,
  Power,
  UserCircle,
  ShoppingCart,
  LayoutGrid,
  Shirt,
  Layers,
  Sparkles,
  Backpack,
  Footprints,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

// Menu utama untuk penjual (seller/admin toko).
// CATATAN: path (`to`) di bawah ini adalah tebakan berdasarkan pola rute yang
// sudah ada (mis. '/produk/:id', '/keranjang', '/checkout'). Sesuaikan dengan
// rute asli di App.jsx kamu kalau berbeda.
const groupsAdmin = [
  {
    label: null,
    links: [
      { to: '/dashboard-penjualan', label: 'Dasbor Penjualan', icon: LayoutDashboard, end: true },
      { to: '/profil-saya', label: 'Profil Saya', icon: UserCircle },
    ],
  },
  {
    label: 'Toko',
    links: [
      { to: '/produk-saya', label: 'Produk Saya', icon: Package },
      { to: '/kategori', label: 'Kategori Produk', icon: Tags },
      { to: '/pesanan-masuk', label: 'Pesanan Masuk', icon: ClipboardList },
      { to: '/profil-toko', label: 'Profil Toko', icon: Store },
    ],
  },
]

// Menu untuk buyer: cukup ringkas.
const linksBuyer = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard, end: true },
  { to: '/profil-saya', label: 'Profil Saya', icon: UserCircle },
  { to: '/keranjang', label: 'Keranjang', icon: ShoppingCart },
  { to: '/pesanan-saya', label: 'Pesanan Saya', icon: ClipboardList },
]

// Kategori produk — diambil dari nama-nama produk yang sudah ada di toko.
// Link mengarah ke beranda dengan query param ?kategori=slug. Home.jsx perlu
// membaca query param ini untuk memfilter produk (belum diimplementasikan —
// kabari kalau mau sekalian saya tambahkan filternya di Home.jsx).
const kategoriProduk = [
  { slug: 'kaos', label: 'Kaos', icon: Shirt },
  { slug: 'kemeja', label: 'Kemeja', icon: Shirt },
  { slug: 'celana', label: 'Celana', icon: Layers },
  { slug: 'jaket', label: 'Jaket', icon: Shirt },
  { slug: 'hoodie', label: 'Hoodie', icon: Shirt },
  { slug: 'dress', label: 'Dress', icon: Sparkles },
  { slug: 'tas', label: 'Tas', icon: Backpack },
  { slug: 'sepatu', label: 'Sepatu', icon: Footprints },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-teal-400/15 text-teal-300'
            : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
        }`
      }
    >
      <Icon size={17} strokeWidth={1.8} />
      {label}
    </NavLink>
  )
}

function KategoriItem({ slug, label, icon: Icon }) {
  return (
    <NavLink
      to={`/?kategori=${slug}`}
      className="flex flex-col items-center gap-1.5 group"
    >
      <span className="h-11 w-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-teal-400/15 group-hover:text-teal-300 group-hover:border-teal-400/30 transition-colors">
        <Icon size={19} strokeWidth={1.8} />
      </span>
      <span className="text-[11px] text-white/60 group-hover:text-white/90 transition-colors text-center leading-tight">
        {label}
      </span>
    </NavLink>
  )
}

// Ambil URL foto profil dari kolom foto_profil_path (path storage, bukan URL
// lengkap) di bucket "foto-profil".
function getFotoUrl(fotoProfilPath) {
  if (!fotoProfilPath) return null
  if (fotoProfilPath.startsWith('http')) return fotoProfilPath
  const { data } = supabase.storage.from('foto-profil').getPublicUrl(fotoProfilPath)
  return data?.publicUrl || null
}

function getInisial(nama) {
  if (!nama) return '?'
  const kata = nama.trim().split(/\s+/)
  const inisial = kata.length > 1 ? kata[0][0] + kata[1][0] : kata[0].slice(0, 2)
  return inisial.toUpperCase()
}

export default function Sidebar() {
  const { signOut, session, profil, isAdmin } = useAuth()
  const fotoUrl = getFotoUrl(profil?.foto_profil_path)
  const namaTampil = profil?.nama_lengkap || session?.user?.email || 'Pengguna'

  return (
    <aside className="w-64 shrink-0 bg-[#0e1015] text-white flex flex-col h-screen sticky top-0 border-r border-white/5">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={namaTampil}
              className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-white/10"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/[0.06] border-2 border-teal-400/30 flex items-center justify-center font-semibold text-teal-300 text-sm shrink-0">
              {getInisial(namaTampil)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[13px] leading-tight truncate text-white">
              {namaTampil}
            </p>
            <p className="text-[11px] text-white/40 mt-0.5">{isAdmin ? 'Penjual' : 'Pembeli'}</p>
          </div>
          <button
            onClick={signOut}
            title="Keluar"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors shrink-0"
          >
            <Power size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {isAdmin ? (
          groupsAdmin.map((group, i) => (
            <div key={group.label ?? `top-${i}`} className={i > 0 ? 'mt-5' : ''}>
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider uppercase text-white/30">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.links.map((link) => (
                  <NavItem key={link.to} {...link} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {linksBuyer.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="px-3 mb-3 text-[10px] font-semibold tracking-wider uppercase text-white/30 flex items-center gap-1.5">
            <LayoutGrid size={12} />
            Kategori produk
          </p>
          <div className="grid grid-cols-3 gap-y-4 px-1">
            {kategoriProduk.map((kategori) => (
              <KategoriItem key={kategori.slug} {...kategori} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}
