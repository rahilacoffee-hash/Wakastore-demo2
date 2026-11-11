import { Link } from "react-router-dom";

export default function SidebarItem({ item, active, collapsed }) {
  let Icon = item.icon;

  return (
    <Link
      to={item.to}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={
        "flex items-center rounded-xl text-sm transition-colors " +
        (collapsed ? "h-12 w-12 justify-center " : "h-11 gap-3 px-3.5 ") +
        (active ? "bg-[var(--blush)] font-semibold text-[var(--red)]" : "font-medium text-[var(--ink)] hover:bg-[var(--soft)]")
      }
    >
      <Icon size={20} aria-hidden="true" />
      {!collapsed && item.label}
    </Link>
  );
}
