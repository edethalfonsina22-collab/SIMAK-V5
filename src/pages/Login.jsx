import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
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
              <LogIn className="h-6 w-6 text-brass-400" strokeWidth={2} />
            </div>
            <h2 className="font-display text-2xl text-ink-950">Masuk</h2>
            <p className="text-sm text-ink-700/70 mt-1">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  placeholder="Kata sandi Anda"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-ink-900/15 bg-paper/40 text-ink-950 placeholder:text-ink-700/40 focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent transition"
                />
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
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-700/70 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-brass-600 font-medium hover:text-brass-500">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
