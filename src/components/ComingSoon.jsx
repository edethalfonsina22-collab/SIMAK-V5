import { Link } from 'react-router-dom'
import { Construction } from 'lucide-react'

// Komponen placeholder generik untuk halaman yang belum dibuat.
// Dipakai oleh ProfilSaya, PesananSaya, ProdukSaya, Kategori, PesananMasuk,
// dan ProfilToko — supaya link di Sidebar tidak jatuh ke redirect "/" (kedip)
// sebelum halaman aslinya siap dibuat.
export default function ComingSoon({ title, description }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mb-4">
        <Construction size={28} className="text-teal-300" strokeWidth={1.8} />
      </div>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 mt-2 max-w-sm">
        {description || 'Halaman ini sedang dalam pengembangan. Segera hadir.'}
      </p>
      <Link
        to="/"
        className="mt-6 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
      >
        ← Kembali ke Beranda
      </Link>
    </div>
  )
}
