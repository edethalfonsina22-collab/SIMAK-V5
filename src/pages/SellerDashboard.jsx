import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function SellerDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [store, setStore] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [subOrders, setSubOrders] = useState([])
  const [error, setError] = useState(null)

  // form buat/edit toko
  const [storeName, setStoreName] = useState('')
  const [savingStore, setSavingStore] = useState(false)

  // form tambah produk
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    size: '',
    color: '',
    stock: '',
    image_url: '',
  })
  const [savingProduct, setSavingProduct] = useState(false)
  const [productMessage, setProductMessage] = useState(null)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setLoading(true)
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      navigate('/login')
      return
    }
    const userId = sessionData.session.user.id

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }
    setProfile(profileData)

    if (profileData.role !== 'seller') {
      setLoading(false)
      return
    }

    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle()

    setStore(storeData)

    const { data: categoryData } = await supabase.from('categories').select('*').order('name')
    setCategories(categoryData || [])

    if (storeData) {
      await loadProducts(storeData.id)
      await loadSubOrders(storeData.id)
    }

    setLoading(false)
  }

  async function loadProducts(storeId) {
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
    setProducts(data || [])
  }

  async function loadSubOrders(storeId) {
    const { data } = await supabase
      .from('sub_orders')
      .select('*, orders(order_number, payment_status, created_at), order_items(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
    setSubOrders(data || [])
  }

  async function handleCreateStore(e) {
    e.preventDefault()
    setSavingStore(true)
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session.user.id

    const { data, error } = await supabase
      .from('stores')
      .insert({ owner_id: userId, name: storeName, slug: slugify(storeName) })
      .select()
      .single()

    setSavingStore(false)

    if (error) {
      setError(error.message)
      return
    }

    setStore(data)
  }

  async function handleAddProduct(e) {
    e.preventDefault()
    setSavingProduct(true)
    setProductMessage(null)

    if (!form.name || !form.base_price || !form.category_id) {
      setProductMessage({ type: 'error', text: 'Nama, harga, dan kategori wajib diisi.' })
      setSavingProduct(false)
      return
    }

    // 1. Insert produk
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        store_id: store.id,
        category_id: form.category_id,
        name: form.name,
        slug: slugify(form.name) + '-' + Date.now(),
        description: form.description,
        base_price: Number(form.base_price),
        status: 'active',
      })
      .select()
      .single()

    if (productError) {
      setProductMessage({ type: 'error', text: productError.message })
      setSavingProduct(false)
      return
    }

    // 2. Insert 1 varian awal (opsional, boleh kosong ukuran/warna kalau produk tanpa varian)
    if (form.stock !== '') {
      const { error: variantError } = await supabase.from('product_variants').insert({
        product_id: product.id,
        size: form.size || null,
        color: form.color || null,
        stock: Number(form.stock) || 0,
      })

      if (variantError) {
        setProductMessage({ type: 'error', text: variantError.message })
        setSavingProduct(false)
        return
      }
    }

    // 3. Insert gambar (opsional)
    if (form.image_url) {
      const { error: imageError } = await supabase.from('product_images').insert({
        product_id: product.id,
        url: form.image_url,
        sort_order: 1,
      })

      if (imageError) {
        setProductMessage({ type: 'error', text: imageError.message })
        setSavingProduct(false)
        return
      }
    }

    setProductMessage({ type: 'success', text: 'Produk berhasil ditambahkan.' })
    setForm({
      name: '',
      description: '',
      base_price: '',
      category_id: '',
      size: '',
      color: '',
      stock: '',
      image_url: '',
    })
    setSavingProduct(false)
    loadProducts(store.id)
  }

  if (loading) return <p style={{ padding: '16px' }}>Memuat dashboard...</p>
  if (error) return <p style={{ padding: '16px', color: 'red' }}>{error}</p>

  if (!profile || profile.role !== 'seller') {
    return (
      <div style={{ padding: '16px' }}>
        <h2>Dashboard Penjualan</h2>
        <p>Halaman ini khusus untuk akun dengan peran "Penjual".</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div style={{ padding: '16px', maxWidth: '400px' }}>
        <h2>Buat Toko Kamu</h2>
        <p>Kamu belum punya toko. Buat dulu sebelum bisa menambahkan produk.</p>
        <form onSubmit={handleCreateStore} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Nama toko"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={savingStore} style={{ padding: '10px', cursor: 'pointer' }}>
            {savingStore ? 'Menyimpan...' : 'Buat Toko'}
          </button>
        </form>
      </div>
    )
  }

  const totalPenjualan = subOrders.reduce((sum, so) => sum + Number(so.subtotal), 0)

  return (
    <div style={{ padding: '16px', maxWidth: '800px' }}>
      <h2>Dashboard Penjualan — {store.name}</h2>

      <div style={{ display: 'flex', gap: '24px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px 20px' }}>
          <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>Total Produk</p>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.3rem' }}>{products.length}</p>
        </div>
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px 20px' }}>
          <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>Total Pesanan Masuk</p>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.3rem' }}>{subOrders.length}</p>
        </div>
        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px 20px' }}>
          <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>Total Nilai Penjualan</p>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.3rem' }}>
            Rp {Number(totalPenjualan).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <h3>Tambah Produk Baru</h3>
      <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Nama produk"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ padding: '8px' }}
        />
        <textarea
          placeholder="Deskripsi"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ padding: '8px' }}
          rows={3}
        />
        <input
          type="number"
          placeholder="Harga (Rp)"
          value={form.base_price}
          onChange={(e) => setForm({ ...form, base_price: e.target.value })}
          style={{ padding: '8px' }}
        />
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          style={{ padding: '8px' }}
        >
          <option value="">Pilih kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Ukuran (misal M)"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            style={{ padding: '8px', flex: 1 }}
          />
          <input
            type="text"
            placeholder="Warna"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            style={{ padding: '8px', flex: 1 }}
          />
          <input
            type="number"
            placeholder="Stok"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            style={{ padding: '8px', flex: 1 }}
          />
        </div>

        <input
          type="text"
          placeholder="URL gambar produk"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          style={{ padding: '8px' }}
        />

        {productMessage && (
          <p style={{ color: productMessage.type === 'error' ? 'red' : 'green', margin: 0 }}>
            {productMessage.text}
          </p>
        )}

        <button type="submit" disabled={savingProduct} style={{ padding: '10px', cursor: 'pointer' }}>
          {savingProduct ? 'Menyimpan...' : 'Tambah Produk'}
        </button>
      </form>

      <h3 style={{ marginTop: '32px' }}>Produk Saya</h3>
      {products.length === 0 ? (
        <p>Belum ada produk.</p>
      ) : (
        products.map((p) => (
          <div key={p.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
            <strong>{p.name}</strong> — Rp {Number(p.base_price).toLocaleString('id-ID')} — {p.status}
            <div style={{ fontSize: '0.85rem', color: '#888' }}>
              {(p.product_variants || []).length} varian
            </div>
          </div>
        ))
      )}

      <h3 style={{ marginTop: '32px' }}>Pesanan Masuk</h3>
      {subOrders.length === 0 ? (
        <p>Belum ada pesanan masuk.</p>
      ) : (
        subOrders.map((so) => (
          <div key={so.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{so.orders?.order_number}</strong>
              <span>{so.fulfillment_status}</span>
            </div>
            <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#888' }}>
              Status pembayaran: {so.orders?.payment_status}
            </p>
            {(so.order_items || []).map((oi) => (
              <p key={oi.id} style={{ margin: '2px 0', fontSize: '0.9rem' }}>
                {oi.product_name} ({oi.variant_label}) x{oi.quantity} — Rp {Number(oi.unit_price * oi.quantity).toLocaleString('id-ID')}
              </p>
            ))}
            <p style={{ fontWeight: 'bold', marginTop: '6px' }}>
              Subtotal: Rp {Number(so.subtotal).toLocaleString('id-ID')}
            </p>
          </div>
        ))
      )}
    </div>
  )
}

export default SellerDashboard
