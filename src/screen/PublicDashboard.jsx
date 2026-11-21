import { Bell, ChevronDown, ClipboardList, MapPin, Package, Search, ShoppingBag, Store, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import WakastoreLogo from "../components/ui/WakastoreLogo";
import { categories } from "../constants/categories";

export default function PublicDashboard() {
  const navigate = useNavigate();
  return (
    <main className="public-dashboard">
      <section className="public-hero">
        <img src="/hero.webp" alt="WakaStore materials specialist" />
        <div className="public-hero-shade" />
        <div className="public-hero-content">
          <header>
            <WakastoreLogo light />
            <button aria-label="Notifications" className="public-bell"><Bell size={20} /><i>3</i></button>
          </header>
          <button className="public-location"><MapPin size={16} /> Set delivery location <ChevronDown size={15} /></button>
          <h1>Everything your<br />project needs,<br /><span>in one place.</span></h1>
          <p>Find quality materials and trusted merchants near you.</p>
        </div>
        <form className="public-search" onSubmit={(event) => { event.preventDefault(); navigate("/auth/customer"); }}>
          <Search size={20} /><input aria-label="Search materials" placeholder="Search for a material" /><button aria-label="Search" type="submit">Search</button>
        </form>
      </section>

      <div className="public-body">
        <div className="public-section-title"><h2>Shop by category</h2><Link to="/auth/customer">See all</Link></div>
        <div className="public-categories">
          {categories.slice(0, 4).map(({ name, icon: Icon }, index) => (
            <Link to="/auth/customer" className="public-category" key={name}>
              <span className={`public-cat-icon cat-${index}`}><Icon size={23} /></span>
              <span><b>{name.replace(" Merchant", "")}</b><small>Explore materials</small></span>
            </Link>
          ))}
        </div>
        <div className="public-section-title public-active-title"><h2>Get started</h2><Link to="/login">Try demo</Link></div>
        <div className="public-action-grid">
          <Link to="/auth/customer"><span><ShoppingBag size={22}/></span><b>Buy materials</b><small>Browse verified suppliers</small></Link>
          <Link to="/auth/merchant"><span><Store size={22}/></span><b>Sell on WakaStore</b><small>Reach more customers</small></Link>
        </div>
        <Link to="/auth/customer" className="public-quote"><span><ClipboardList size={25}/></span><div><b>Have a materials list?</b><small>Submit it once and compare supplier quotes.</small></div><ChevronDown className="-rotate-90" size={19}/></Link>
      </div>
      <nav className="public-nav" aria-label="Main navigation">
        <Link className="active" to="/onboarding/1"><ShoppingBag size={20}/><span>Home</span></Link>
        <Link to="/auth/customer"><Store size={20}/></Link>
        <Link to="/auth/customer"><Package size={20}/></Link>
        <Link to="/login"><UserRound size={20}/></Link>
      </nav>
    </main>
  );
}
