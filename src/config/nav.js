import { Bell, FileText, Grid2X2, Home, PackageCheck, Compass, UserRound, WalletCards } from 'lucide-react'
export const navItems = [
  { label: 'Home', to: '/client/overview', icon: Home },
  { label: 'Explore', to: '/client/explore', icon: Compass },
  { label: 'Categories', to: '/client/categories', icon: Grid2X2 },
  { label: 'Quotations', to: '/client/quotations', icon: FileText },
  { label: 'Orders', to: '/client/orders', icon: PackageCheck },
  { label: 'WakaWallet', to: '/client/wallet', icon: WalletCards },
  { label: 'Notifications', to: '/client/notifications', icon: Bell },
  { label: 'Account', to: '/client/account', icon: UserRound },
]
export const isNavActive = (item, pathname) => pathname === item.to || pathname.startsWith(`${item.to}/`)
