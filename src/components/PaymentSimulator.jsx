// Prototype-only control: lets a tester force each payment outcome. Remove when a real payment provider is connected.
export const OUTCOMES = [
  ["success", "Payment succeeds"],
  ["declined", "Card declined"],
  ["insufficient", "Insufficient funds"],
  ["timeout", "Provider does not confirm (timeout)"],
];
export default function PaymentSimulator({ value, onChange }) {
  return (
    <label className="mt-3 block rounded-xl border border-dashed border-amber-400 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
      Demo only: simulate the provider's response
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-2 py-2 text-sm font-normal text-[var(--ink)]">
        {OUTCOMES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
    </label>
  );
}
