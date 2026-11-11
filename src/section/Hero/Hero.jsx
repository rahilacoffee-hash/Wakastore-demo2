import React, { useMemo } from 'react'
import Brand from '../../layouts/Navigations/Brand';
import NotificationBell from '../../layouts/Navigations/NotificationBell';
import { ArrowRight, ChevronDown, FileText, MapPin, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppStateContext';

const DATE = new Intl.DateTimeFormat("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

function greeting(date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const Hero = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const firstName = state?.session?.name?.split(' ')[0] || 'Ada';
    const now = useMemo(function () {
    return new Date();
  }, []);
  return (
     <section className="relative min-h-[440px] overflow-hidden rounded-b-[30px] px-5 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-white sm:min-h-[470px] lg:min-h-[420px] lg:rounded-3xl lg:px-10 lg:py-9"
    >
           <img
        src="/hero.webp"
        alt="Construction materials and building project"
        loading="eager"
        fetchPriority="high"
        className="
          pointer-events-none
          absolute
          inset-0
          h-full
          w-full
          object-cover
          object-[62%_center] lg:object-center
        "
      />

      {/* image overlay */}
      <div className="absolute inset-0 bg-[#171717]/30" />

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-[#171717]/90
          via-[#171717]/55
          to-transparent
        "
      />

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-[#171717]/70
          via-transparent
          to-black/30
        "
      />
     
         <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        className="pointer-events-none absolute -right-20 -top-28 hidden h-[440px] w-[440px] text-white/10 lg:block"
      >
        <circle cx="100" cy="100" r="95" />
        <circle cx="100" cy="100" r="75" />
        <circle cx="100" cy="100" r="55" />
        <circle cx="100" cy="100" r="35" />
      </svg>

      {/* mobileonly */}
      <div className="relative z-10 flex items-center justify-between lg:hidden">
        <Brand light />
        <NotificationBell className="text-white" />
      </div>

       <div className="relative z-10 mt-4 max-w-[74%] sm:max-w-[62%] lg:mt-4 lg:max-w-[55%]">
        <button className="inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-black/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm lg:hidden"><MapPin size={14}/> Set location <ChevronDown size={14}/></button>
        <p className="hidden text-sm font-medium text-white/80 lg:block">
          {greeting(now)}, {firstName}
        </p>
        <h1 className="mt-5 text-[clamp(1.85rem,7vw,2.4rem)] font-semibold leading-[1.08] tracking-[-.045em] lg:mt-1 lg:text-4xl xl:text-[2.8rem]">
          Build better. Source smarter. One place.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/85 lg:text-base">Compare reliable suppliers and source materials with confidence.</p>
      </div>

          <label className="relative z-10 mt-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 text-slate-500 lg:mt-8 lg:max-w-md lg:shadow-lg lg:shadow-[#061744]/30 lg:focus-within:ring-4 lg:focus-within:ring-white/30">
          <Search size={19} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search materials"
          aria-label="Search materials"
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
          onKeyDown={(event) => event.key === 'Enter' && navigate('/client/explore')}
        />
       
      </label>
      <div className="relative z-10 mt-3 flex gap-3 lg:mt-4"><Link to="/client/explore" className="inline-flex items-center gap-2 rounded-xl bg-[var(--red)] px-4 py-3 text-sm font-bold shadow-lg shadow-black/20">Explore materials <ArrowRight size={16}/></Link><Link to="/client/quotations/new" className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur-sm"><FileText size={16}/> Submit list</Link></div>

    </section>
  )
}

export default Hero
