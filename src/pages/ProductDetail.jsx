import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, sort_order)')
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setProduct(data)
      }
      setLoading(false)
    }

    fetchProduct()
  }, [id])

  if (loading) return <p style={{ padding: '16px' }}>Memuat...</p>
  if (error) return <p style={{ padding: '16px', color: 'red' }}>Gagal memuat produk: {error}</p>
  if (!product) return <p style={{ padding: '16px' }}>Produk tidak ditemukan.</p>

  const images = [...(product.product_images || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

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
        Rp {Number(product.base_price).toLocaleString('id-ID')}
      </p>
      <p>{product.description}</p>
      {/* Nanti ditambah: tombol "Tambah ke Keranjang", info toko/penjual */}
    </div>
  )
}

export default ProductDetail
