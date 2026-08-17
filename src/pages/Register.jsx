import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Loader2, UserPlus } from 'lucide-react'

export default function Register() {
  const { session, signUp } = useAuth()
  const navigate = useNavigate()

  const [namaLengkap, setNamaLengkap] = useState('')
  const [nip, setNip] = useState('')
  const [jenisKelamin, setJenisKelamin] = useState('')
  const [mataPelajaran, setMataPelajaran] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, {
      nama_lengkap: namaLengkap,
      nip,
      jenis_kelamin: jenisKelamin,
      mata_pelajaran: mataPelajaran,
    })
    setLoading(false)

    if (error) {
      setError(error.message || 'Gagal mendaftar. Silakan coba lagi.')
      return
    }

    // Berhasil daftar & langsung login (kalau "Confirm email" sudah dimatikan di Supabase)
    navigate('/')
  }

  return (
    <div className="login-shell min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="login-grid" aria-hidden />
      <div className="login-code" aria-hidden />

      <div className="w-full max-w-sm relative z-10">
        <div
          className={`text-center mb-6 transition-all duration-700 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="login-badge-glow absolute inset-0 rounded-xl" />
            <div className="login-badge relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl">
              S
            </div>
          </div>
          <h1 className="login-title text-2xl font-semibold">Daftar Akun Guru</h1>
          <p className="login-tagline text-[11px] font-medium uppercase tracking-[0.2em] mt-2">
            SIMAK &mdash; School Management Information System
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`login-card p-6 space-y-4 transition-all duration-700 ease-out delay-150 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div>
            <label className="login-eyebrow mb-1.5 block">Nama Lengkap</label>
            <input
              type="text"
              required
              className="login-field w-full"
              placeholder="Nama lengkap dengan gelar"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="login-eyebrow mb-1.5 block">NIP</label>
              <input
                type="text"
                className="login-field w-full"
                placeholder="Opsional"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
              />
            </div>
            <div>
              <label className="login-eyebrow mb-1.5 block">Jenis Kelamin</label>
              <select
                className="login-field w-full"
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="login-eyebrow mb-1.5 block">Mata Pelajaran</label>
            <input
              type="text"
              className="login-field w-full"
              placeholder="Contoh: Matematika"
              value={mataPelajaran}
              onChange={(e) => setMataPelajaran(e.target.value)}
            />
          </div>

          <div>
            <label className="login-eyebrow mb-1.5 block">Email</label>
            <input
              type="email"
              required
              className="login-field w-full"
              placeholder="guru@sekolah.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="login-eyebrow mb-1.5 block">Kata Sandi</label>
            <input
              type="password"
              required
              className="login-field w-full"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="login-eyebrow mb-1.5 block">Konfirmasi Kata Sandi</label>
            <input
              type="password"
              required
              className="login-field w-full"
              placeholder="Ulangi kata sandi"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="login-error text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="login-btn w-full transition-transform duration-150 active:scale-[0.98] hover:scale-[1.01]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Daftar
          </button>
        </form>

        <p className="login-credit text-center text-xs mt-5">
          Sudah punya akun?{' '}
          <Link to="/login" className="not-italic font-semibold underline">
            Masuk di sini
          </Link>
        </p>
      </div>

      {/* Style ini menggunakan class yang sama seperti Login.jsx.
          Kalau Login.jsx & Register.jsx dirender terpisah (bukan lewat App yang sama-sama mount),
          style ini tetap dibutuhkan supaya tampilan konsisten. */}
      <style>{`
        .login-shell {
          --bg-1: #050b09;
          --bg-2: #0b201c;
          --accent: #5eead4;
          --accent-strong: #9dfff0;
          --ring: rgba(94, 234, 212, 0.28);
          --ring-soft: rgba(94, 234, 212, 0.12);
          --text-primary: #eafffa;
          --text-accent: #5eead4;
          --code-text: rgba(140, 214, 198, 0.32);
          background:
            radial-gradient(circle at 30% 25%, rgba(94, 234, 212, 0.10), transparent 55%),
            linear-gradient(160deg, var(--bg-1), var(--bg-2) 60%, var(--bg-1));
        }
        .login-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--ring-soft) 1px, transparent 1px),
            linear-gradient(90deg, var(--ring-soft) 1px, transparent 1px);
          background-size: 36px 36px; opacity: 0.35;
          mask-image: radial-gradient(circle at 50% 35%, black 0%, transparent 70%);
        }
        .login-code {
          position: absolute; top: 0; right: 0; width: 22%; height: 100%; pointer-events: none;
          background-image: repeating-linear-gradient(var(--code-text) 0px, var(--code-text) 1px, transparent 1px, transparent 16px);
          opacity: 0.35;
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
        }
        .login-badge-glow { background: var(--accent); filter: blur(10px); opacity: 0.4; animation: glow-pulse 2.8s ease-in-out infinite; }
        .login-badge { background: linear-gradient(160deg, var(--accent-strong), var(--accent)); color: #06201c; box-shadow: 0 0 18px rgba(94, 234, 212, 0.45); }
        .login-title { color: var(--text-primary); text-shadow: 0 0 14px rgba(94, 234, 212, 0.35); }
        .login-tagline { color: var(--code-text); }
        .login-card {
          position: relative; border-radius: 16px;
          background: linear-gradient(160deg, rgba(11, 32, 28, 0.85), rgba(5, 11, 9, 0.9));
          border: 1px solid var(--ring-soft);
          box-shadow: 0 0 40px rgba(94, 234, 212, 0.06), 0 20px 40px rgba(0, 0, 0, 0.35);
        }
        .login-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--code-text); }
        .login-field {
          background: rgba(94, 234, 212, 0.05); border: 1px solid var(--ring-soft); border-radius: 10px;
          padding: 10px 12px; color: var(--text-primary); outline: none;
        }
        .login-field::placeholder { color: rgba(234, 255, 250, 0.35); }
        .login-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.18); }
        .login-error { color: #ff9d9d; }
        .login-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 16px; border-radius: 10px; font-weight: 600; color: #06201c;
          background: linear-gradient(135deg, var(--accent-strong), var(--accent));
          box-shadow: 0 0 20px rgba(94, 234, 212, 0.35); border: none; cursor: pointer;
        }
        .login-btn:disabled { opacity: 0.7; cursor: default; }
        .login-credit { color: var(--code-text); }
        .login-credit a { color: var(--text-accent); text-shadow: 0 0 8px rgba(94, 234, 212, 0.4); }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}
