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
      <div className="login-sun" aria-hidden />
      <div className="login-mountains" aria-hidden>
        <svg viewBox="0 0 800 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path className="login-mountain-back" d="M0 220 L0 140 L120 70 L230 150 L330 90 L460 160 L560 60 L680 140 L800 100 L800 220 Z" />
          <path className="login-mountain-front" d="M0 220 L0 170 L90 120 L200 180 L300 130 L420 190 L540 110 L650 175 L800 150 L800 220 Z" />
        </svg>
      </div>

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
          --sky-1: #cdeaf6;
          --sky-2: #eaf6e3;
          --accent: #2f8f56;
          --accent-strong: #6cc98a;
          --sun: #f3b93c;
          --ring: rgba(47, 143, 86, 0.25);
          --ring-soft: rgba(47, 143, 86, 0.12);
          --text-primary: #163a22;
          --text-muted: #4f6b57;
          --text-accent: #2f8f56;
          background: linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 55%, #dcefd9 100%);
        }
        .login-sun {
          position: absolute; top: -60px; right: 8%; width: 220px; height: 220px; border-radius: 50%;
          background: radial-gradient(circle, rgba(243, 185, 60, 0.55), transparent 70%);
          filter: blur(2px); pointer-events: none;
        }
        .login-mountains { position: absolute; left: 0; right: 0; bottom: 0; height: 34%; pointer-events: none; }
        .login-mountains svg { width: 100%; height: 100%; display: block; }
        .login-mountain-back { fill: #9fcdae; opacity: 0.7; }
        .login-mountain-front { fill: #6fae7f; opacity: 0.85; }
        .login-badge-glow { background: var(--sun); filter: blur(10px); opacity: 0.45; animation: glow-pulse 2.8s ease-in-out infinite; }
        .login-badge { background: linear-gradient(160deg, var(--accent-strong), var(--accent)); color: #ffffff; box-shadow: 0 4px 16px rgba(47, 143, 86, 0.35); }
        .login-title { color: var(--text-primary); }
        .login-tagline { color: var(--text-muted); }
        .login-card {
          position: relative; border-radius: 16px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(47, 143, 86, 0.18);
          box-shadow: 0 20px 40px -12px rgba(22, 58, 34, 0.18);
        }
        .login-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); }
        .login-field {
          background: rgba(255, 255, 255, 0.9); border: 1px solid var(--ring-soft); border-radius: 10px;
          padding: 10px 12px; color: var(--text-primary); outline: none;
        }
        .login-field::placeholder { color: rgba(22, 58, 34, 0.35); }
        .login-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47, 143, 86, 0.16); }
        .login-error { color: #c0392b; }
        .login-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 16px; border-radius: 10px; font-weight: 600; color: #ffffff;
          background: linear-gradient(135deg, var(--accent-strong), var(--accent));
          box-shadow: 0 8px 20px -4px rgba(47, 143, 86, 0.45); border: none; cursor: pointer;
        }
        .login-btn:disabled { opacity: 0.7; cursor: default; }
        .login-credit { color: var(--text-muted); }
        .login-credit a { color: var(--text-accent); }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}
