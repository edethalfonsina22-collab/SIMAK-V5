import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState(null)

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, sort_order), product_variants(*)')
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setProduct(data)
        if (data.product_variants?.length > 0) {
          setSelectedVariantId(data.product_variants[0].id)
        }
      }
      setLoading(false)
    }

    fetchProduct()
  }, [id])

  async function handleAddToCart() {
    setCartMessage(null)

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      navigate('/login')
      return
    }

    if (!selectedVariantId) {
      setCartMessage({ type: 'error', text: 'Pilih varian dulu.' })
      return
    }

    setAddingToCart(true)

    const userId = sessionData.session.user.id

    // Cek apakah item ini (user + varian yang sama) sudah ada di keranjang
    const { data: existing, error: findError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('variant_id', selectedVariantId)
      .maybeSingle()

    if (findError) {
      setCartMessage({ type: 'error', text: findError.message })
      setAddingToCart(false)
      return
    }

    let opError

    if (existing) {
      // Sudah ada -> tambah jumlahnya
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
      opError = error
    } else {
      // Belum ada -> insert baru
      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, variant_id: selectedVariantId, quantity })
      opError = error
    }

    setAddingToCart(false)

    if (opError) {
      setCartMessage({ type: 'error', text: opError.message })
    } else {
      setCartMessage({ type: 'success', text: 'Berhasil ditambahkan ke keranjang.' })
    }
  }

  if (loading) return <p style={{ padding: '16px' }}>Memuat...</p>
  if (error) return <p style={{ padding: '16px', color: 'red' }}>Gagal memuat produk: {error}</p>
  if (!product) return <p style={{ padding: '16px' }}>Produk tidak ditemukan.</p>

  const images = [...(product.product_images || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const variants = product.product_variants || []
  const selectedVariant = variants.find((v) => v.id === selectedVariantId)
  const displayPrice = selectedVariant?.price_override ?? product.base_price

  return (
    <div style={{ padding: '16px', maxWidth: '600px' }}>
      {images[0]?.url && (
        <img
          src={images[0].url}
          alt={product.name}
          style={{ width: '100%', borderRadius: '8px' }}
        />
      )}
      <h2>{product.name}</h2>
      <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
        Rp {Number(displayPrice).toLocaleString('id-ID')}
      </p>
      <p>{product.description}</p>

      {variants.length > 0 ? (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Varian</label>
            <select
              value={selectedVariantId ?? ''}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                  {[v.size, v.color].filter(Boolean).join(' - ')}
                  {v.stock <= 0 ? ' (habis)' : ` (stok: ${v.stock})`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Jumlah</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              style={{ width: '80px', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          {cartMessage && (
            <p style={{ color: cartMessage.type === 'error' ? 'red' : 'green' }}>
              {cartMessage.text}
            </p>
          )}

          <button
            onClick={handleAddToCart}
            disabled={addingToCart || selectedVariant?.stock <= 0}
            style={{ padding: '10px 16px', cursor: 'pointer' }}
          >
            {addingToCart ? 'Menambahkan...' : 'Tambah ke Keranjang'}
          </button>
        </>
      ) : (
        <p style={{ color: '#888' }}>Produk ini belum punya varian yang bisa dibeli.</p>
      )}
    </div>
  )
}

export default ProductDetail
