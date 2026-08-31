import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  Store, Package, ShoppingBag, Wallet, Trash2, PlusCircle,
  AlertTriangle, CheckCircle2, Loader2, Boxes, Inbox, ImagePlus, X,
} from 'lucide-react'

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-ink-900/[0.1] bg-white text-sm text-ink-950 placeholder:text-ink-700/40 focus:outline-none focus:ring-2 focus:ring-brass-400/40 focus:border-brass-400 transition-colors'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-900/[0.06] bg-white p-4 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-brass-400/15 text-brass-600 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-ink-700/60">{label}</p>
        <p className="font-display font-bold text-lg text-ink-950">{value}</p>
      </div>
    </div>
  )
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
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [savingProduct, setSavingProduct] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [productMessage, setProductMessage] = useState(null)

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const MAX_IMAGE_SIZE_MB = 5

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setProductMessage({ type: 'error', text: 'Format gambar harus JPG, PNG, atau WEBP.' })
      e.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setProductMessage({ type: 'error', text: `Ukuran gambar maksimal ${MAX_IMAGE_SIZE_MB}MB.` })
      e.target.value = ''
      return
    }

    setProductMessage(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleRemoveImage() {
    setImageFile(null)
    setImagePreview(null)
  }

  // hapus produk
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

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

    // 3. Upload gambar ke Supabase Storage (opsional)
    if (imageFile) {
      setUploadingImage(true)

      const fileExt = imageFile.name.split('.').pop()
      const filePath = `${store.id}/${product.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        setUploadingImage(false)
        setProductMessage({ type: 'error', text: `Gagal upload gambar: ${uploadError.message}` })
        setSavingProduct(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      const { error: imageError } = await supabase.from('product_images').insert({
        product_id: product.id,
        url: publicUrlData.publicUrl,
        sort_order: 1,
      })

      setUploadingImage(false)

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
    })
    setImageFile(null)
    setImagePreview(null)
    setSavingProduct(false)
    loadProducts(store.id)
  }

  async function handleDeleteProduct(productId) {
    setDeletingId(productId)
    setDeleteError(null)

    const { error } = await supabase.from('products').delete().eq('id', productId)

    setDeletingId(null)
    setConfirmDeleteId(null)

    if (error) {
      setDeleteError(error.message)
      return
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-ink-700/60">
        <Loader2 size={16} className="animate-spin" />
        Memuat dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-rose-500">
        <AlertTriangle size={16} />
        {error}
      </div>
    )
  }

  if (!profile || profile.role !== 'seller') {
    return (
      <div className="p-6 max-w-md">
        <h2 className="font-display text-xl font-semibold text-ink-950 mb-2">Dashboard Penjualan</h2>
        <p className="text-sm text-ink-700/70">Halaman ini khusus untuk akun dengan peran "Penjual".</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="p-6 max-w-sm mx-auto">
        <div className="rounded-2xl border border-ink-900/[0.06] bg-white shadow-sm p-6">
          <div className="w-11 h-11 rounded-full bg-brass-400/15 text-brass-600 flex items-center justify-center mb-4">
            <Store size={20} />
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-950 mb-1">Buat Toko Kamu</h2>
          <p className="text-sm text-ink-700/70 mb-4">
            Kamu belum punya toko. Buat dulu sebelum bisa menambahkan produk.
          </p>
          <form onSubmit={handleCreateStore} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nama toko"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              className={inputClass}
            />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={savingStore}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ink-950 text-white text-sm font-medium hover:bg-ink-900 transition-colors disabled:opacity-60"
            >
              {savingStore && <Loader2 size={14} className="animate-spin" />}
              {savingStore ? 'Menyimpan...' : 'Buat Toko'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const totalPenjualan = subOrders.reduce((sum, so) => sum + Number(so.subtotal), 0)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h2 className="font-display text-xl font-semibold text-ink-950 mb-4">
        Dashboard Penjualan — {store.name}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Package} label="Total Produk" value={products.length} />
        <StatCard icon={ShoppingBag} label="Total Pesanan Masuk" value={subOrders.length} />
        <StatCard
          icon={Wallet}
          label="Total Nilai Penjualan"
          value={`Rp ${Number(totalPenjualan).toLocaleString('id-ID')}`}
        />
      </div>

      <div className="rounded-2xl border border-ink-900/[0.06] bg-white shadow-sm p-5 mb-8">
        <h3 className="font-display text-base font-semibold text-ink-950 mb-4 flex items-center gap-2">
          <PlusCircle size={18} className="text-brass-500" />
          Tambah Produk Baru
        </h3>
        <form onSubmit={handleAddProduct} className="flex flex-col gap-3 max-w-md">
          <input
            type="text"
            placeholder="Nama produk"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
          <textarea
            placeholder="Deskripsi"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Harga (Rp)"
            value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: e.target.value })}
            className={inputClass}
          />
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className={inputClass}
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ukuran (misal M)"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className={`${inputClass} flex-1`}
            />
            <input
              type="text"
              placeholder="Warna"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className={`${inputClass} flex-1`}
            />
            <input
              type="number"
              placeholder="Stok"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className={`${inputClass} flex-1`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700/70 mb-1.5">
              Gambar produk (JPG, PNG, atau WEBP, maks {MAX_IMAGE_SIZE_MB}MB)
            </label>

            {imagePreview ? (
              <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-ink-900/[0.1]">
                <img src={imagePreview} alt="Pratinjau" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink-950/70 text-white flex items-center justify-center hover:bg-ink-950 transition-colors"
                  title="Hapus gambar"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 w-28 h-28 rounded-lg border border-dashed border-ink-900/[0.15] text-ink-700/50 hover:border-brass-400 hover:text-brass-500 cursor-pointer transition-colors">
                <ImagePlus size={20} />
                <span className="text-[11px]">Pilih gambar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {productMessage && (
            <p
              className={`flex items-center gap-1.5 text-sm ${
                productMessage.type === 'error' ? 'text-rose-500' : 'text-sage-500'
              }`}
            >
              {productMessage.type === 'error' ? (
                <AlertTriangle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {productMessage.text}
            </p>
          )}

          <button
            type="submit"
            disabled={savingProduct}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ink-950 text-white text-sm font-medium hover:bg-ink-900 transition-colors disabled:opacity-60"
          >
            {savingProduct && <Loader2 size={14} className="animate-spin" />}
            {savingProduct
              ? uploadingImage
                ? 'Mengunggah gambar...'
                : 'Menyimpan...'
              : 'Tambah Produk'}
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="font-display text-base font-semibold text-ink-950 mb-3 flex items-center gap-2">
          <Boxes size={18} className="text-brass-500" />
          Produk Saya
        </h3>

        {deleteError && (
          <p className="flex items-center gap-1.5 text-sm text-rose-500 mb-3">
            <AlertTriangle size={14} />
            Gagal menghapus produk: {deleteError}
          </p>
        )}

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 gap-2 rounded-xl border border-dashed border-ink-900/[0.1]">
            <Inbox size={26} className="text-ink-700/30" />
            <p className="text-sm text-ink-700/50">Belum ada produk.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink-900/[0.06] bg-white shadow-sm divide-y divide-ink-900/[0.06]">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink-950 truncate">{p.name}</p>
                  <p className="text-sm text-ink-700/60">
                    Rp {Number(p.base_price).toLocaleString('id-ID')} ·{' '}
                    <span className="capitalize">{p.status}</span> ·{' '}
                    {(p.product_variants || []).length} varian
                  </p>
                </div>

                {confirmDeleteId === p.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-ink-700/60 hidden sm:inline">Hapus produk ini?</span>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      disabled={deletingId === p.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-60"
                    >
                      {deletingId === p.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Ya, hapus
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId === p.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-ink-900/[0.1] text-ink-700 hover:bg-ink-900/[0.03] transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(p.id)}
                    title="Hapus produk"
                    className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-700/50 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-base font-semibold text-ink-950 mb-3 flex items-center gap-2">
          <ShoppingBag size={18} className="text-brass-500" />
          Pesanan Masuk
        </h3>

        {subOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 gap-2 rounded-xl border border-dashed border-ink-900/[0.1]">
            <Inbox size={26} className="text-ink-700/30" />
            <p className="text-sm text-ink-700/50">Belum ada pesanan masuk.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {subOrders.map((so) => (
              <div key={so.id} className="rounded-xl border border-ink-900/[0.06] bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <strong className="text-ink-950">{so.orders?.order_number}</strong>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-ink-900/[0.06] text-ink-700 capitalize">
                    {so.fulfillment_status}
                  </span>
                </div>
                <p className="text-sm text-ink-700/60 mt-1">
                  Status pembayaran: <span className="capitalize">{so.orders?.payment_status}</span>
                </p>
                <div className="mt-2 space-y-1">
                  {(so.order_items || []).map((oi) => (
                    <p key={oi.id} className="text-sm text-ink-700">
                      {oi.product_name} ({oi.variant_label}) x{oi.quantity} — Rp{' '}
                      {Number(oi.unit_price * oi.quantity).toLocaleString('id-ID')}
                    </p>
                  ))}
                </div>
                <p className="font-display font-bold text-ink-950 mt-3">
                  Subtotal: Rp {Number(so.subtotal).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerDashboard
