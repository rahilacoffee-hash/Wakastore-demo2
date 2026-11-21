import { useState } from "react";
import { Camera, PackageCheck, Truck } from "lucide-react";
import { useAppState } from "../context/AppStateContext";

const field = "w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm";
const primary = "rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-bold text-white";

// Shrinks a photo so several proofs fit in browser storage. Falls back to the file name when canvas is unavailable.
export function compressImage(file, max = 640, quality = 0.6) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const fallback = () => resolve({ name: file.name, dataUrl: null });
    try {
      const reader = new FileReader();
      reader.onerror = fallback;
      reader.onload = () => {
        const img = new Image();
        img.onerror = fallback;
        img.onload = () => {
          try {
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({ name: file.name, dataUrl: canvas.toDataURL("image/jpeg", quality) });
          } catch { fallback(); }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } catch { fallback(); }
  });
}

const pickupCode = () => String(Math.floor(100000 + Math.random() * 900000));

/* Merchant: shown on each assigned order once it is packed. Replaces the bare "Dispatch" / "Mark delivered" buttons. */
export function DispatchProofPanel({ order, sub, merchantId }) {
  const { recordFulfilmentStep } = useAppState();
  const collection = order.deliveryMethod === "customer_collection";
  const [f, setF] = useState({ carrier: order.deliveryMethod === "wakarider" ? "WakaRider" : "Merchant vehicle", name: "", phone: "", plate: "", eta: "", note: "", receivedBy: "" });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setError(""); };

  if (sub.status === "Packed" && !collection) {
    const submit = () => {
      if (!f.name.trim() || !f.phone.trim() || !f.eta.trim()) return setError("Enter the driver or rider name, their phone number and the expected arrival.");
      recordFulfilmentStep(order.id, merchantId, "Dispatched", "dispatch", { method: order.deliveryMethod || "merchant_delivery", carrier: f.carrier, driver: f.name.trim(), phone: f.phone.trim(), plate: f.plate.trim(), eta: f.eta.trim(), note: f.note.trim() });
    };
    return (
      <div className="mt-4 space-y-2 rounded-2xl bg-[var(--soft)] p-3">
        <p className="flex items-center gap-2 text-sm font-bold"><Truck size={16} /> Dispatch details</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={field} value={f.carrier} onChange={(e) => set("carrier", e.target.value)}>{["Merchant vehicle", "WakaRider", "Third-party courier"].map((c) => <option key={c}>{c}</option>)}</select>
          <input className={field} placeholder="Driver / rider name" value={f.name} onChange={(e) => set("name", e.target.value)} />
          <input className={field} placeholder="Driver phone" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          <input className={field} placeholder="Vehicle / plate number (optional)" value={f.plate} onChange={(e) => set("plate", e.target.value)} />
          <input className={`${field} sm:col-span-2`} placeholder="Expected arrival (e.g. Today 4pm)" value={f.eta} onChange={(e) => set("eta", e.target.value)} />
        </div>
        {error && <p role="alert" className="text-xs font-bold text-[var(--red)]">{error}</p>}
        <button onClick={submit} className={primary}>Dispatch order</button>
      </div>
    );
  }
  if (sub.status === "Packed" && collection) {
    return (
      <div className="mt-4 space-y-2 rounded-2xl bg-[var(--soft)] p-3">
        <p className="flex items-center gap-2 text-sm font-bold"><PackageCheck size={16} /> Ready for customer collection</p>
        <input className={field} placeholder="Collection instructions (optional)" value={f.note} onChange={(e) => set("note", e.target.value)} />
        <button onClick={() => recordFulfilmentStep(order.id, merchantId, "Ready for collection", "dispatch", { method: "customer_collection", pickupCode: pickupCode(), note: f.note.trim() })} className={primary}>Mark ready for collection</button>
      </div>
    );
  }
  if (["Dispatched", "Ready for collection"].includes(sub.status)) {
    const submit = () => {
      if (!f.receivedBy.trim()) return setError("Enter the name of the person who received the materials.");
      if (!photo && !f.note.trim()) return setError("Add a photo of the delivered materials or a note as proof.");
      recordFulfilmentStep(order.id, merchantId, "Delivered", "proof", { receivedBy: f.receivedBy.trim(), note: f.note.trim(), photo: photo?.dataUrl || null, photoName: photo?.name || "" });
    };
    return (
      <div className="mt-4 space-y-2 rounded-2xl bg-[var(--soft)] p-3">
        <p className="flex items-center gap-2 text-sm font-bold"><Camera size={16} /> {collection ? "Proof of collection" : "Proof of delivery"}</p>
        <input className={field} placeholder="Received by (name)" value={f.receivedBy} onChange={(e) => set("receivedBy", e.target.value)} />
        <input className={field} placeholder="Note (optional if you add a photo)" value={f.note} onChange={(e) => set("note", e.target.value)} />
        <input type="file" accept="image/*" aria-label="Proof photo" className="text-xs" onChange={async (e) => { setPhoto(await compressImage(e.target.files?.[0])); setError(""); }} />
        {photo?.dataUrl && <img alt="Proof preview" src={photo.dataUrl} className="h-24 rounded-lg object-cover" />}
        {error && <p role="alert" className="text-xs font-bold text-[var(--red)]">{error}</p>}
        <button onClick={submit} className={primary}>{collection ? "Confirm collection" : "Confirm delivery"}</button>
      </div>
    );
  }
  return null;
}

/* Customer and admin: what the merchant recorded. */
export function DeliveryRecordCard({ order, audience = "customer" }) {
  const d = order?.dispatch, p = order?.proof;
  if (!d && !p) return null;
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
      <h2 className="flex items-center gap-2 font-bold"><Truck size={16} /> Delivery record</h2>
      {d && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">{d.method === "customer_collection" ? "Ready for collection" : "Dispatched"} · {new Date(d.at).toLocaleString("en-NG")}</p>
          {d.method === "customer_collection"
            ? <p className="mt-1">{d.pickupCode ? <>Show pickup code <b className="font-mono">{d.pickupCode}</b> at the store.</> : "Collect from the merchant store."} {d.note}</p>
            : <p className="mt-1">{d.carrier} · <b>{d.driver}</b> · {d.phone}{d.plate ? ` · ${d.plate}` : ""}{d.eta ? ` · expected ${d.eta}` : ""}</p>}
        </div>
      )}
      {p && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">Proof of {order.deliveryMethod === "customer_collection" ? "collection" : "delivery"} · {new Date(p.at).toLocaleString("en-NG")}</p>
          <p className="mt-1">Received by <b>{p.receivedBy}</b>{p.note ? ` · ${p.note}` : ""}</p>
          {p.photo ? <img alt="Proof of delivery" src={p.photo} className="mt-2 max-h-48 rounded-xl object-cover" /> : p.photoName ? <p className="text-xs text-[var(--muted)]">Photo attached: {p.photoName}</p> : null}
        </div>
      )}
      {audience === "admin" && <p className="text-xs text-[var(--muted)]">Evidence supplied by the merchant. Review it before releasing funds without customer acceptance.</p>}
    </section>
  );
}
