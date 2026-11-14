import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Pass `backTo` for a link or `onBack` for a handler. Add "lg:hidden" via className for mobile-only.
export default function TopBar({ title, backTo, onBack, className = "" }) {
  let backClass = "grid h-11 w-11 place-items-center";
  let icon = <ArrowLeft size={22} aria-hidden="true" />;

  return (
    <header
      className={
        "flex items-center gap-4 border-b border-[#e4e8f1] bg-white px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))] " +
        className
      }
    >
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" className={backClass}>
          {icon}
        </button>
      ) : (
        <Link to={backTo} aria-label="Back" className={backClass}>
          {icon}
        </Link>
      )}
      <p className="flex-1 pr-11 text-center text-sm font-medium">{title}</p>
    </header>
  );
}