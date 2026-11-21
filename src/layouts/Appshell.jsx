import { Outlet } from "react-router-dom";
import { useState } from 'react'
import BottomNav from "./Navigations/BottomNav";
import Sidebar from './Navigations/Siderbar'

// Desktop: fixed sidebar (always full height) + content pushed to its right.
// Mobile: content + floating bottom nav.
export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-[100svh] bg-[var(--canvas)] text-[var(--ink)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} />
      {/* The padding matches the sidebar width: 248px expanded, 80px collapsed */}
      <div className={`transition-[padding] duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-[258px]'}`}>
        {/* No max-width: content fills the space to the right of the sidebar */}
        <main className="w-full min-w-0 pb-28 lg:px-8 lg:pb-14 lg:pt-8 xl:px-12">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
