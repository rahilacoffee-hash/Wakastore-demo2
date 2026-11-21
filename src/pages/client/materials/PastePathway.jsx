import { useState } from "react";
import { ClipboardPaste, Sparkles } from "lucide-react";
import { extractMaterials } from "../../../services/ai/materialExtraction";
import { fieldCls } from "./shared";
import ExtractionProgress from "./ExtractionProgress";

let EXAMPLE = `Cement — 50 bags
Sharp Sand — 10 tonnes
Iron Rod 12mm — 40 pieces
Granite — 5 tonnes`;

export default function PastePathway({ onExtracted }) {
  let [text, setText] = useState("");
  let [error, setError] = useState("");
  let [running, setRunning] = useState(false);
  let [progress, setProgress] = useState(null);

  async function run() {
    setError("");
    try {
      setRunning(true);
      let result = await extractMaterials({ kind: "text", text }, { onProgress: setProgress });
      onExtracted(result, "paste");
    } catch (e) {
      setError(e.message || "Extraction failed.");
      setRunning(false);
    }
  }
  if (running) return <ExtractionProgress progress={progress} />;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="paste-list" className="text-lg font-extrabold">Paste your materials list</label>
        <p className="mt-1 text-sm text-[var(--muted)]">One material per line. Any format works: “50 bags of cement”, “Iron rod 12mm — 40 pieces”.</p>
      </div>
      <textarea
        id="paste-list"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={9}
        placeholder={EXAMPLE}
        className={`${fieldCls} h-auto min-h-[220px] resize-y py-3 leading-6`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <span>{text.trim() ? text.trim().split(/\r?\n/).filter(Boolean).length : 0} lines</span>
        <button type="button" onClick={() => setText(EXAMPLE)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 font-bold text-[var(--red)]">
          <ClipboardPaste size={14} /> Use an example
        </button>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-[var(--red)]">{error}</p>}
      <button type="button" disabled={!text.trim()} onClick={run} className="primary min-h-12 w-full disabled:opacity-50">
        <Sparkles size={18} /> Extract materials with AI (demo)
      </button>
      <p className="rounded-xl bg-[var(--soft)] p-3 text-xs leading-5 text-[var(--muted)]">
        <b>Prototype notice:</b> your text is parsed in this browser. No AI service is called and nothing leaves your device. Anything unclear is flagged for you to confirm; AI never adds prices or stock.
      </p>
    </div>
  );
}
