import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ImageOff, PackageX, RefreshCw, AlertTriangle, Pencil, Check, X, Loader2, Camera, ShoppingBag, Heart } from 'lucide-react'

const PRODUCT_IMAGE_BUCKET = 'product-images'

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-900/[0.06] overflow-hidden animate-pulse">
      <div className="w-full h-40 bg-ink-900/[0.06]" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-ink-900/[0.08]" />
        <div className="h-4 w-1/2 rounded bg-ink-900/[0.08]" />
      </div>
    </div>
  )
}

function ProductCard({ product, isEditor, onSaved }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(product.name)
  const [basePrice, setBasePrice] = useState(product.base_price)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [wishlisted, setWishlisted] = useState(false)
  const fileInputRef = useRef(null)

  const images = [...(product.product_images || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const coverImage = imagePreview || images[0]?.url
  const hasDiscount =
    product.compare_at_price && Number(product.compare_at_price) > Number(product.base_price)
  const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0

  function startEdit(e) {
    e.preventDefault()
    e.stopPropagation()
    setName(product.name)
    setBasePrice(product.base_price)
    setImageFile(null)
    setImagePreview(null)
    setSaveError(null)
    setIsEditing(true)
  }

  function cancelEdit(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsEditing(false)
    setImageFile(null)
    setImagePreview(null)
    setSaveError(null)
  }

  function handleImagePick(e) {
    e.stopPropagation()
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setSaveError('File harus berupa gambar.')
      return
    }

    setSaveError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function openImagePicker(e) {
    e.preventDefault()
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  async function saveEdit(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!name.trim()) {
      setSaveError('Nama produk tidak boleh kosong.')
      return
    }
    if (basePrice === '' || Number(basePrice) < 0) {
      setSaveError('Harga tidak valid.')
      return
    }

    setSaving(true)
    setSaveError(null)

    const { error: productError } = await supabase
      .from('products')
      .update({ name: name.trim(), base_price: Number(basePrice) })
      .eq('id', product.id)

    if (productError) {
      setSaving(false)
      setSaveError(productError.message)
      return
    }

    let newImageUrl = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${product.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, imageFile, { upsert: true })

      if (uploadError) {
        setSaving(false)
        setSaveError(uploadError.message)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .getPublicUrl(path)
      newImageUrl = publicUrlData.publicUrl

      const existingCover = images[0]

      const { error: imageDbError } = existingCover
        ? await supabase
            .from('product_images')
            .update({ url: newImageUrl })
            .eq('id', existingCover.id)
        : await supabase
            .from('product_images')
            .insert({ product_id: product.id, url: newImageUrl, sort_order: 0 })

      if (imageDbError) {
        setSaving(false)
        setSaveError(imageDbError.message)
        return
      }
    }

    setSaving(false)
    setIsEditing(false)
    setImageFile(null)
    setImagePreview(null)

    onSaved?.(product.id, {
      name: name.trim(),
      base_price: Number(basePrice),
      ...(newImageUrl
        ? {
            product_images: images[0]
              ? images.map((img, i) => (i === 0 ? { ...img, url: newImageUrl } : img))
              : [{ url: newImageUrl, sort_order: 0 }],
          }
        : {}),
    })
  }

  const cardInner = (
    <>
      <div className="relative w-full h-40 bg-ink-900/[0.04] overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-700/30">
            <ImageOff size={32} />
          </div>
        )}

        {hasDiscount && !isEditing && (
          <span className="absolute top-2 right-2 h-9 w-9 rounded-full bg-brass-500 text-ink-950 flex items-center justify-center text-[11px] font-semibold shadow-sm">
            -{Math.round(
              (1 - Number(product.base_price) / Number(product.compare_at_price)) * 100
            )}%
          </span>
        )}
        {isOutOfStock && !isEditing && (
          <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-medium text-ink-700">
            Stok habis
          </span>
        )}
        {isEditor && !isEditing && (
          <span className="absolute top-2 left-2 h-7 w-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-ink-700 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil size={14} />
          </span>
        )}

        {isEditing && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
            <button
              type="button"
              onClick={openImagePicker}
              className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-black/60 px-2.5 py-1.5 rounded-lg">
                <Camera size={14} />
                Ganti gambar
              </span>
            </button>
          </>
        )}
      </div>

      <div className="p-3">
        {isEditing ? (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama produk"
              className="w-full text-sm px-2 py-1.5 rounded-lg border border-ink-900/15 text-ink-950 focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent"
            />
            <div className="flex items-center gap-1">
              <span className="text-sm text-ink-700/60">Rp</span>
              <input
                type="number"
                min={0}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="Harga"
                className="w-full text-sm px-2 py-1.5 rounded-lg border border-ink-900/15 text-ink-950 focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent"
              />
            </div>

            {saveError && <p className="text-xs text-rose-600 m-0">{saveError}</p>}

            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg bg-ink-900 text-brass-400 hover:bg-ink-950 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Simpan
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-ink-900/15 text-ink-700 hover:bg-ink-900/5 disabled:opacity-60 transition-colors"
              >
                <X size={14} />
                Batal
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-display text-sm font-semibold text-ink-950 truncate">
              {product.name}
            </h3>
            <div className="flex flex-col mt-1.5">
              <p className="font-display font-bold text-lg text-ink-950">
                Rp {Number(product.base_price).toLocaleString('id-ID')}
              </p>
              {hasDiscount && (
                <p className="text-xs text-ink-700/40 line-through">
                  Rp {Number(product.compare_at_price).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-ink-900 text-brass-400 group-hover:bg-ink-950 transition-colors">
                <ShoppingBag size={14} />
                Beli
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setWishlisted((w) => !w)
                }}
                aria-label={wishlisted ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                className="h-8 w-8 flex-shrink-0 rounded-lg border border-ink-900/15 flex items-center justify-center text-ink-700 hover:bg-ink-900/5 transition-colors"
              >
                <Heart
                  size={15}
                  className={wishlisted ? 'fill-brass-500 text-brass-500' : ''}
                />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )

  const baseClasses =
    'group block rounded-xl border border-ink-900/[0.06] overflow-hidden bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md'

  if (isEditor) {
    // Admin/penjual: klik kartu membuka mode edit inline, bukan navigasi.
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={isEditing ? undefined : startEdit}
        onKeyDown={(e) => {
          if (!isEditing && (e.key === 'Enter' || e.key === ' ')) startEdit(e)
        }}
        className={`${baseClasses} ${isEditing ? '' : 'cursor-pointer'}`}
      >
        {cardInner}
      </div>
    )
  }

  return (
    <Link to={`/produk/${product.id}`} className={baseClasses}>
      {cardInner}
    </Link>
  )
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditor, setIsEditor] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(id, url, sort_order)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    async function loadRole() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) {
        setIsEditor(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      setIsEditor(profile?.role === 'seller')
    }

    loadRole()
  }, [])

  function handleSaved(productId, updates) {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    )
  }

  // Catatan: gambar produk diunggah ke bucket Supabase Storage bernama
  // "product-images" (lihat PRODUCT_IMAGE_BUCKET). Pastikan bucket ini ada
  // dan bersifat publik, serta policy storage mengizinkan upload untuk
  // user dengan role seller.

  return (
    <div className="p-4">
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <AlertTriangle size={32} className="text-rose-500" />
          <p className="text-sm text-ink-700">Gagal memuat produk: {error}</p>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-ink-950 text-white hover:bg-ink-900 transition-colors"
          >
            <RefreshCw size={14} />
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
          <PackageX size={32} className="text-ink-700/30" />
          <p className="text-sm text-ink-700/60">Belum ada produk.</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isEditor={isEditor}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}
    </div>
  )
}
