import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Check, Eye, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { extractRecordPieces, recordTypes, validateRecord, type LifeRecord, type RecordType } from "@/lib/life-data";
import { useAppStore } from "@/lib/store";

export function Ratings({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{label} <span className="font-normal text-muted-foreground">1 低 · 5 高</span></legend><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(rating => <Button key={rating} type="button" variant={value === rating ? "default" : "outline"} className="size-10" aria-label={`${rating}，${label}，滿分 5`} aria-pressed={value === rating} onClick={() => onChange(value === rating ? null : rating)}>{rating}</Button>)}</div></fieldset>;
}

interface RecordFormProps {
  draft: LifeRecord;
  onChange: (draft: LifeRecord) => void;
  review: boolean;
  onReviewChange: (review: boolean) => void;
  onSave: (record: LifeRecord) => string | null;
  onDelete?: (record: LifeRecord) => void;
  editing?: boolean;
}

export function RecordForm({ draft, onChange, review, onReviewChange, onSave, onDelete, editing = false }: RecordFormProps) {
  const records = useAppStore(state => state.records);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousReview = useRef(review);
  const extractedPieces = useMemo(() => extractRecordPieces(draft.originalInput || draft.notes, draft.type), [draft.originalInput, draft.notes, draft.type]);

  useEffect(() => {
    if (previousReview.current !== review) contentRef.current?.focus();
    previousReview.current = review;
  }, [review]);

  function change(next: LifeRecord) { setError(null); onChange(next); }

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("請選擇圖片檔案。");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...draft, photoDataUrl: String(reader.result ?? null) };
      onChange(next);
      setError(null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleTextInput(nextText: string) {
    const cleaned = nextText.trim();
    const parsed = extractRecordPieces(nextText, draft.type);
    const inferredValue = parsed[0]?.value ?? draft.value;
    const inferredTitle = cleaned ? (draft.title.trim() || (draft.type === "note" ? "日常紀錄" : `${recordTypes[draft.type].label}紀錄`)) : draft.title.trim();
    const next: LifeRecord = {
      ...draft,
      notes: cleaned ? nextText : "",
      originalInput: nextText,
      title: inferredTitle,
      value: inferredValue,
    };
    if (next.type === "meal" && parsed[0]?.value) next.estimated = true;
    change(next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateRecord(draft);
    if (problem) { setError(problem); return; }
    if (!review) { setError(null); onReviewChange(true); return; }
    setError(onSave(draft));
  }

  return <form className="space-y-5" onSubmit={submit} aria-describedby={error ? "record-form-error" : undefined}>
    <div ref={contentRef} tabIndex={-1} role="group" aria-label={review ? "確認記錄內容" : "記錄欄位"} className="space-y-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
      {review ? <dl className="space-y-3 rounded-xl border border-border p-4 text-sm">{[
        ["類型", recordTypes[draft.type].label], ["名稱", draft.title], ["日期與時間", `${draft.date} ${draft.time}（香港）`],
        ...(draft.type === "note" ? [] : [[recordTypes[draft.type].field, draft.value === null ? "未記錄" : `${draft.value} ${recordTypes[draft.type].unit}`]]),
        ...(draft.type === "checkin" ? [["心情", draft.mood === null ? "未記錄" : `${draft.mood} / 5`], ["精神", draft.energy === null ? "未記錄" : `${draft.energy} / 5`]] : []),
        ["筆記", draft.originalInput || draft.notes || "未記錄"],
        ...(draft.photoDataUrl ? [["照片", "已附上照片"]] : []),
      ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words whitespace-pre-wrap">{value}</dd></div>)}</dl> : <>
        <div className="space-y-2"><Label htmlFor="type">記錄類型</Label><Select value={draft.type} onValueChange={value => { const type = value as RecordType; change({ ...draft, type, title: type === "checkin" ? "每日關顧" : draft.title, value: null, mood: null, energy: null, estimated: type === "meal" }); }}><SelectTrigger id="type" className="h-auto whitespace-normal"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(recordTypes).map(([type, meta]) => <SelectItem key={type} value={type}>{meta.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="title">名稱</Label><Input id="title" required maxLength={120} value={draft.title} onChange={event => change({ ...draft, title: event.target.value })} /></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="min-w-0 space-y-2"><Label htmlFor="entry-date">日期</Label><Input id="entry-date" className="min-w-0 max-w-full" required type="date" value={draft.date} onChange={event => change({ ...draft, date: event.target.value })} /></div><div className="min-w-0 space-y-2"><Label htmlFor="time">香港時間</Label><Input id="time" className="min-w-0 max-w-full" required type="time" value={draft.time} onChange={event => change({ ...draft, time: event.target.value })} /></div></div>
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm font-medium">照片與文字</span><span className="text-[11px] text-muted-foreground">可用 AI 解析</span></div>
          {draft.photoDataUrl ? <div className="mb-3 overflow-hidden rounded-lg border border-border bg-background"><img src={draft.photoDataUrl} alt="記錄照片" className="max-h-56 w-full object-cover" /></div> : <div className="mb-3 rounded-lg border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">可附上早餐、飲品、餐牌或活動照片。</div>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-auto whitespace-normal py-2" asChild>
              <label className="cursor-pointer"><ImagePlus className="size-4" aria-hidden="true" />上傳圖片<input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} /></label>
            </Button>
            <Button type="button" variant="outline" className="h-auto whitespace-normal py-2" onClick={() => change({ ...draft, photoDataUrl: null })} disabled={!draft.photoDataUrl}><Trash2 className="size-4" aria-hidden="true" />移除照片</Button>
          </div>
        </div>
        {draft.type !== "note" && <div className="space-y-2"><Label htmlFor="value">{recordTypes[draft.type].field}（{recordTypes[draft.type].unit}，選填）</Label><Input id="value" type="number" min="0" max={recordTypes[draft.type].max} step="0.1" value={draft.value ?? ""} onChange={event => change({ ...draft, value: event.target.value === "" ? null : Number(event.target.value) })} /></div>}
        {draft.type === "meal" && <p className="text-xs text-muted-foreground">熱量由你估算；不確定時可留空。</p>}
        {draft.type === "checkin" && <><Ratings label="心情" value={draft.mood} onChange={mood => change({ ...draft, mood })} /><Ratings label="精神" value={draft.energy} onChange={energy => change({ ...draft, energy })} /></>}
        <div className="space-y-2"><Label htmlFor="notes">快速文字（AI 可從這裡抽取資訊）</Label><Textarea id="notes" maxLength={4000} rows={4} placeholder="例：早餐 420 kcal，走路 25 分鐘，喝了 500 ml 水。" value={draft.originalInput || draft.notes} onChange={event => handleTextInput(event.target.value)} /></div>
        {extractedPieces.length > 0 && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"><p className="mb-2 font-medium">AI 抽取樣式</p><div className="flex flex-wrap gap-2">{extractedPieces.map(piece => <span key={`${piece.label}-${piece.raw}`} className="rounded-full border border-emerald-300 bg-white/70 px-2.5 py-1 text-xs dark:border-emerald-700 dark:bg-slate-900/50">{piece.label}：{piece.value}{piece.unit}</span>)}</div></div>}
      </>}
    </div>
    {editing && <details className="text-sm"><summary className="cursor-pointer focus-visible:outline-2">原始輸入</summary><p className="mt-2 break-words whitespace-pre-wrap rounded-lg bg-muted p-3">{draft.originalInput || "未記錄"}</p></details>}
    {draft.type === "checkin" && records.some(record => record.type === "checkin" && record.date === draft.date && record.id !== draft.id) && <p className="text-sm">此日期已有每日關顧，儲存後將取代原有記錄。</p>}
    {error && <p id="record-form-error" role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2">{editing && onDelete && <Button type="button" variant="ghost" className="h-auto whitespace-normal py-2" onClick={() => onDelete(draft)}><Trash2 className="size-4" aria-hidden="true" />刪除</Button>}{review && <Button type="button" variant="outline" className="h-auto whitespace-normal py-2" onClick={() => onReviewChange(false)}>返回修改</Button>}<Button type="submit" className="h-auto whitespace-normal py-2.5">{review ? <Check aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}{review ? "確認並儲存" : "檢視內容"}</Button></div>
  </form>;
}
