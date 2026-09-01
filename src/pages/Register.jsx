import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { User, Mail, Lock, ShoppingBag, Store, Loader2 } from 'lucide-react'

function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('buyer') // 'buyer' atau 'seller'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Daftarkan akun ke Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const newUserId = data.user?.id

    // 2. Simpan/lengkapi data profil (nama & peran)
    // Pakai upsert karena kemungkinan sudah ada row otomatis dari trigger Supabase
    if (newUserId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: newUserId, full_name: fullName, role })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)

    // Kalau project mengaktifkan konfirmasi email, session belum aktif di sini.
    if (!data.session) {
      alert('Pendaftaran berhasil. Silakan cek email untuk konfirmasi sebelum login.')
      navigate('/login')
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-panel border border-ink-900/5 p-8">
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-ink-900 flex items-center justify-center">
              <User className="h-6 w-6 text-brass-400" strokeWidth={2} />
            </div>
            <h2 className="font-display text-2xl text-ink-950">Daftar akun</h2>
            <p className="text-sm text-ink-700/70 mt-1">Buat akun baru untuk mulai bertransaksi</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">
                Nama lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-700/40" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Nama lengkap Anda"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-ink-900/15 bg-paper/40 text-ink-950 placeholder:text-ink-700/40 focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-700/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-ink-900/15 bg-paper/40 text-ink-950 placeholder:text-ink-700/40 focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-700/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-ink-900/15 bg-paper/40 text-ink-950 placeholder:text-ink-700/40 focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">
                Daftar sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition ${
                    role === 'buyer'
                      ? 'border-brass-500 bg-brass-400/10 text-ink-900'
                      : 'border-ink-900/10 text-ink-700/60 hover:border-ink-900/25'
                  }`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="text-sm font-medium">Pembeli</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition ${
                    role === 'seller'
                      ? 'border-brass-500 bg-brass-400/10 text-ink-900'
                      : 'border-ink-900/10 text-ink-700/60 hover:border-ink-900/25'
                  }`}
                >
                  <Store className="h-5 w-5" />
                  <span className="text-sm font-medium">Penjual</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                <p className="text-sm text-red-600 m-0">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-lg bg-ink-900 text-brass-400 font-medium hover:bg-ink-950 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-700/70 mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-brass-600 font-medium hover:text-brass-500">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
