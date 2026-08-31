import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, sort_order)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  if (loading) return <p style={{ padding: '16px' }}>Memuat produk...</p>
  if (error) return <p style={{ padding: '16px', color: 'red' }}>Gagal memuat produk: {error}</p>
  if (products.length === 0) return <p style={{ padding: '16px' }}>Belum ada produk.</p>

  return (
    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
      {products.map((product) => {
        const images = [...(product.product_images || [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        )
        const coverImage = images[0]?.url

        return (
          <Link
            key={product.id}
            to={`/produk/${product.id}`}
            style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #eee', borderRadius: '8px', padding: '12px' }}
          >
            {coverImage && (
              <img
                src={coverImage}
                alt={product.name}
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px' }}
              />
            )}
            <h3 style={{ fontSize: '1rem', margin: '8px 0 4px' }}>{product.name}</h3>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              Rp {Number(product.base_price).toLocaleString('id-ID')}
            </p>
          </Link>
        )
      })}
    </div>
  )
}

export default Home
