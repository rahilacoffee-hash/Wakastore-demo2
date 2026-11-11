import { Link } from "react-router-dom";
import { ChevronDown, MapPin } from "lucide-react";

let STYLES = {
  dark: "h-8 gap-1.5 rounded-full border border-white/40 px-3 text-xs text-white",
  block: "h-10 w-full gap-2 rounded-xl border border-[#e4e8f1] bg-white px-3.5 text-[13px] text-slate-700 hover:bg-slate-50",
  icon: "h-11 w-11 justify-center rounded-xl border border-[#e4e8f1] bg-white text-slate-700 hover:bg-slate-50",
};

// variant: "dark" (on the hero), "block" (expanded sidebar), "icon" (collapsed sidebar)
// Pass the saved address from the parent when location persistence is introduced.
export default function LocationPill({ variant = "dark", label = "Set location" }) {
  let iconOnly = variant === "icon";

  return (
    <Link
      to="/location"
      aria-label={iconOnly ? "Location: " + label : undefined}
      title={iconOnly ? label : undefined}
      className={"inline-flex items-center font-medium " + STYLES[variant]}
    >
      <MapPin size={14} aria-hidden="true" />
      {!iconOnly && <span className={variant === "block" ? "flex-1 truncate text-left" : "truncate"}>{label}</span>}
      {!iconOnly && <ChevronDown size={14} aria-hidden="true" />}
    </Link>
  );
}
