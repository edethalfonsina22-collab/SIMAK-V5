import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

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
    <div style={{ padding: '16px', maxWidth: '360px', margin: '0 auto' }}>
      <h2>Daftar Akun</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>Nama Lengkap</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>Daftar sebagai</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          >
            <option value="buyer">Pembeli</option>
            <option value="seller">Penjual</option>
          </select>
        </div>

        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ padding: '10px', cursor: 'pointer' }}>
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
      </form>

      <p style={{ marginTop: '16px' }}>
        Sudah punya akun? <Link to="/login">Masuk di sini</Link>
      </p>
    </div>
  )
}

export default Register
