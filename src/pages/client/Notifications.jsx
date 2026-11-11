import { Bell, CheckCheck } from "lucide-react";
import { useAppState } from "../../context/AppStateContext";

// Shared notification centre. `audience` decides which notifications are shown.
export default function Notifications({ audience = "customer", merchantId }) {
  let { state, markNotificationSeen, markAllNotificationsSeen } = useAppState();
  let mine = (a) => {
    if (audience === "merchant") return a.recipientMerchantId && a.recipientMerchantId === merchantId;
    if (audience === "customer") return !a.recipientMerchantId;
    return true;
  };
  let list = (state.notifications || []).filter(mine);
  let unread = list.filter((n) => !n.seen).length;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-6 pt-[max(18px,env(safe-area-inset-top))] sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-[Manrope] text-3xl font-black tracking-[-.04em]">Notifications</h1>
        <button
          type="button"
          disabled={!unread}
          onClick={() => markAllNotificationsSeen(mine)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] px-3 text-sm font-bold disabled:opacity-40"
        >
          <CheckCheck size={16} /> Mark all read
        </button>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{unread ? `${unread} unread` : "You're all caught up."}</p>
      {list.length ? (
        <ul className="mt-4 space-y-2">
          {list.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => markNotificationSeen(n.id)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${n.seen ? "border-[var(--line)] bg-[var(--surface)]" : "border-[#F5D5D9] bg-[var(--blush)]"}`}
              >
                <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.seen ? "bg-[var(--soft)]" : "bg-[var(--red)] text-white"}`}>
                  <Bell size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold">{n.title}</span>
                  <span className="mt-0.5 block text-sm text-[var(--muted)]">{n.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-sm text-[var(--muted)]">
          No notifications yet. Order, quotation and wallet updates will appear here.
        </p>
      )}
    </div>
  );
}
