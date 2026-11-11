import { ArrowUpRight, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatNaira } from '../../utils/formatters'
export default function ProductCard({ product }) { return <article className="product-card"><img src={product.image} alt=""/><div className="product-body"><span className="stock"><i/> {product.stock}</span><h3>{product.name}</h3><p>{product.merchant} <BadgeCheck/></p><div className="product-foot"><strong>{formatNaira(product.price)}</strong><Link to={`/client/product/${encodeURIComponent(product.name)}`} aria-label={`View ${product.name}`}><ArrowUpRight/></Link></div></div></article> }
