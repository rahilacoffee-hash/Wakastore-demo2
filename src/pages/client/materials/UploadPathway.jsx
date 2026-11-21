import { useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, RefreshCw, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { extractMaterials } from "../../../services/ai/materialExtraction";
import { ACCEPTED, MAX_FILES, MAX_FILE_MB, cardCls, formatBytes } from "./shared";
import ExtractionProgress from "./ExtractionProgress";

export default function UploadPathway({ onExtracted }) {
  let [files, setFiles] = useState([]); // { id, file, url, readPct }
  let [drag, setDrag] = useState(false);
  let [error, setError] = useState("");
  let [phase, setPhase] = useState("idle"); // idle | reading | extracting
  let [progress, setProgress] = useState(null);
  let inputRef = useRef(null);
  let replaceRef = useRef(null);
  let replaceId = useRef(null);
  let urls = useRef(new Set());

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  function validate(file) {
    if (!ACCEPTED.includes(file.type)) return `"${file.name}" is not supported. Use JPG, PNG, WEBP or PDF.`;
    if (file.size > MAX_FILE_MB * 1048576) return `"${file.name}" is larger than ${MAX_FILE_MB} MB.`;
    return "";
  }
  function entry(file) {
    let url = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    if (url) urls.current.add(url);
    return { id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, file, url, readPct: 0 };
  }
  function addFiles(list) {
    setError("");
    let incoming = Array.from(list);
    let ok = [];
    for (let f of incoming) {
      let problem = validate(f);
      if (problem) { setError(problem); continue; }
      ok.push(f);
    }
    let room = MAX_FILES - files.length;
    if (ok.length > room) setError(`You can add up to ${MAX_FILES} files. Extra files were skipped.`);
    let fresh = ok.slice(0, Math.max(room, 0)).map(entry);
    setFiles((prev) => [...prev, ...fresh]);
  }
  function release(f) {
    if (f?.url) { URL.revokeObjectURL(f.url); urls.current.delete(f.url); }
  }
  function remove(id) {
    release(files.find((x) => x.id === id));
    setFiles((prev) => prev.filter((x) => x.id !== id));
  }
  function replaceWith(file) {
    let problem = validate(file);
    if (problem) return setError(problem);
    setError("");
    let old = files.find((x) => x.id === replaceId.current);
    if (!old) return;
    release(old);
    let fresh = entry(file);
    setFiles((prev) => prev.map((x) => (x.id === old.id ? fresh : x)));
  }

  // Real local read progress: each file is actually read in the browser.
  function readFile(f) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) setFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, readPct: Math.round((e.loaded / e.total) * 100) } : x)));
      };
      reader.onload = () => { setFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, readPct: 100 } : x))); resolve(); };
      reader.onerror = () => reject(new Error(`Could not read "${f.file.name}".`));
      reader.readAsArrayBuffer(f.file);
    });
  }

  async function run() {
    if (!files.length) return setError("Add at least one photo or PDF first.");
    setError("");
    try {
      setPhase("reading");
      for (let f of files) await readFile(f);
      setPhase("extracting");
      let result = await extractMaterials(
        { kind: "files", files: files.map((f) => ({ name: f.file.name, type: f.file.type, size: f.file.size })) },
        { onProgress: setProgress },
      );
      onExtracted(result, "upload");
    } catch (e) {
      setError(e.message || "Extraction failed. Please try again.");
      setPhase("idle");
    }
  }

  if (phase === "extracting") return <ExtractionProgress progress={progress} />;
  let busy = phase === "reading";

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        className={`rounded-3xl border-2 border-dashed p-6 text-center transition ${drag ? "border-[var(--red)] bg-[var(--blush)]" : "border-[#F5D5D9] bg-[var(--blush)]/50"}`}
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[var(--red)] shadow-sm"><UploadCloud size={26} /></span>
        <h2 className="mt-3 text-lg font-extrabold">Upload your materials list</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Photos of handwritten or printed lists, or a PDF. Up to {MAX_FILES} files, {MAX_FILE_MB} MB each.</p>
        <button type="button" disabled={busy || files.length >= MAX_FILES} onClick={() => inputRef.current?.click()} className="primary mt-4 min-h-12 disabled:opacity-50">
          <ImagePlus size={18} /> Choose photos or PDF
        </button>
        <input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" className="hidden" aria-label="Upload photos or PDF"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <input ref={replaceRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" className="hidden" aria-label="Replace file"
          onChange={(e) => { if (e.target.files[0]) replaceWith(e.target.files[0]); e.target.value = ""; }} />
        <p className="mt-3 text-xs text-[var(--muted)]">Or drag and drop files here.</p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Selected files">
          {files.map((f) => (
            <li key={f.id} className={`${cardCls} flex items-center gap-3 !p-3`}>
              {f.url ? (
                <img src={f.url} alt={`Preview of ${f.file.name}`} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[var(--soft)] text-[var(--red)]"><FileText size={26} /></span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{f.file.name}</p>
                <p className="text-xs text-[var(--muted)]">{f.file.type === "application/pdf" ? "PDF" : "Image"} · {formatBytes(f.file.size)}</p>
                {busy && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--soft)]" role="progressbar" aria-valuenow={f.readPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Preparing ${f.file.name}`}>
                    <div className="h-full bg-[var(--red)] transition-all" style={{ width: `${f.readPct}%` }} />
                  </div>
                )}
              </div>
              <button type="button" disabled={busy} aria-label={`Replace ${f.file.name}`} onClick={() => { replaceId.current = f.id; replaceRef.current?.click(); }} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--line)] disabled:opacity-40"><RefreshCw size={16} /></button>
              <button type="button" disabled={busy} aria-label={`Remove ${f.file.name}`} onClick={() => remove(f.id)} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--line)] text-[var(--red)] disabled:opacity-40"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert" className="text-sm font-semibold text-[var(--red)]">{error}</p>}

      <button type="button" disabled={!files.length || busy} onClick={run} className="primary min-h-12 w-full disabled:opacity-50">
        <Sparkles size={18} /> {busy ? "Preparing files…" : "Extract materials with AI (demo)"}
      </button>
      <p className="rounded-xl bg-[var(--soft)] p-3 text-xs leading-5 text-[var(--muted)]">
        <b>Prototype notice:</b> AI extraction is simulated. Your files are previewed on this device only and are not read or uploaded. You will get a sample list to show how review works.
      </p>
    </div>
  );
}
