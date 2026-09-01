import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = belum dicek, null = tidak login
  const [profil, setProfil] = useState(undefined) // { role: 'buyer'|'seller', full_name, avatar_url } | null

  async function loadProfil(userId) {
    if (!userId) {
      setProfil(null)
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('role, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    // Kalau belum ada baris profil (mis. trigger belum jalan), anggap 'buyer' dulu
    setProfil(data || { role: 'buyer', full_name: null, avatar_url: null })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      loadProfil(data.session?.user?.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadProfil(newSession?.user?.id)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()

  // Catatan: pendaftaran (signUp) sudah ditangani langsung di Register.jsx
  // (signUp ke Supabase Auth + upsert ke tabel `profiles`), jadi tidak
  // perlu diduplikasi di sini.

  // NB: nama field `isAdmin` dipertahankan supaya Sidebar.jsx tidak perlu
  // diubah, tapi sekarang artinya "role === 'seller'" (penjual), bukan admin sekolah.
  const isAdmin = profil?.role === 'seller'

  return (
    <AuthContext.Provider
      value={{
        session,
        loading: session === undefined || profil === undefined,
        signIn,
        signOut,
        profil,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
