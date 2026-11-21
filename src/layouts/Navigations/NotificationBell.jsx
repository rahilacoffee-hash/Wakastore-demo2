import { Bell } from "lucide-react";

export default function NotificationBell({ className = "" }) {
  return (
    <button
      type="button"
      aria-label={"Notifications, " + 3 + " new"}
      className={"relative grid h-11 w-11 place-items-center rounded-full " + className}
    >
      <Bell size={20} aria-hidden="true" />
      <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#c2410c] text-[10px] font-bold text-white">
        3
      </span>
    </button>
  );
}