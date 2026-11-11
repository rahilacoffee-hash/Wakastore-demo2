import { ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
export default function SectionHead({ title, action, to }) { return <div className="section-head"><h2>{title}</h2>{action && <NavLink to={to}>{action} <ArrowRight/></NavLink>}</div> }
