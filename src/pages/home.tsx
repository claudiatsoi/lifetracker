import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Check, ChevronLeft, ChevronRight, Download, Droplets, Footprints, Heart, Moon, NotebookPen, Plus, ShieldCheck, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RecordForm, Ratings } from "@/components/record-form";
import { useAppStore } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/states";
import { useConfirm } from "@/hooks/use-confirm";
import { recordTypes, shiftDate, today, validateRecord, type LifeRecord, type RecordType } from "@/lib/life-data";

const icons = { meal: Utensils, water: Droplets, exercise: Footprints, activity: BookOpen, note: NotebookPen, checkin: Moon };
const dateLabel = (date: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("zh-HK", { ...options, timeZone: "Asia/Hong_Kong" }).format(new Date(`${date}T12:00:00+08:00`));
const slots = [{ from: 0, to: 6, label: "凌晨", hours: "00–06" }, { from: 6, to: 9, label: "早晨", hours: "06–09" }, { from: 9, to: 12, label: "上午", hours: "09–12" }, { from: 12, to: 15, label: "午後", hours: "12–15" }, { from: 15, to: 18, label: "下午", hours: "15–18" }, { from: 18, to: 24, label: "晚上", hours: "18–24" }];
const lanes = [{ label: "飲食與飲水", types: ["meal", "water"] }, { label: "身心與生活", types: ["checkin", "exercise", "activity", "note"] }];
export function HomePage() {
  const records = useAppStore(state => state.records);
  const date = useAppStore(state => state.date);
  const filter = useAppStore(state => state.filter);
  const setFilter = useAppStore(state => state.setFilter);
  const storeSelectDate = useAppStore(state => state.selectDate);
  const checkDraft = useAppStore(state => state.checkDraft);
  const setCheckDraft = useAppStore(state => state.setCheckDraft);
  const saveRecord = useAppStore(state => state.saveRecord);
  const deleteRecord = useAppStore(state => state.removeRecord);
  const prepareAdd = useAppStore(state => state.prepareAdd);
  const [draft, setDraft] = useState<LifeRecord | null>(null);
  const [review, setReview] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const checkin = records.find(record => record.date === date && record.type === "checkin");
  const visible = records.filter(record => record.date === date && (filter === "all" || record.type === filter)).sort((a, b) => a.time.localeCompare(b.time));
  function selectDate(next: string) { storeSelectDate(next); setCheckError(null); }
  function openRecord(record?: LifeRecord, type: RecordType = "note") {
    if (record) { setDraft({ ...record }); setReview(false); return; }
    if (!prepareAdd(type)) toast.info("保留尚未儲存的記錄草稿");
    navigate("/add-record");
  }
  function commit(record: LifeRecord) {
    const problem = saveRecord(record);
    if (!problem) toast.success("記錄已儲存於本次開啟中");
    return problem;
  }
  async function removeRecord(record: LifeRecord) {
    if (!await confirm({ title: "永久刪除此記錄？", description: "此操作無法復原。已下載的副本不會受影響。", confirmLabel: "刪除記錄", cancelLabel: "取消", destructive: true })) return;
    deleteRecord(record.id);
    setDraft(null); toast.success("記錄已刪除");
  }
  function exportRecords() {
    const blob = new Blob([JSON.stringify({ version: 1, timeZone: "Asia/Hong_Kong", records }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "life-progress-records.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-7 sm:px-8 sm:pt-9">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">每日記錄</h1>
        <div className="flex flex-wrap gap-2"><Button variant="outline" className="h-auto whitespace-normal py-2" onClick={exportRecords}><Download aria-hidden="true" className="size-4" />匯出記錄</Button><Button className="h-auto whitespace-normal py-2" onClick={() => openRecord()}><Plus aria-hidden="true" className="size-4" />新增記錄</Button></div>
      </div>
      <section aria-label="記錄日期" className="mb-8 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="icon" aria-label="上一日" onClick={() => selectDate(shiftDate(date, -1))}><ChevronLeft aria-hidden="true" /></Button>
          <Label htmlFor="record-date" className="sr-only">記錄日期（香港時間）</Label><Input id="record-date" type="date" value={date} onChange={event => selectDate(event.target.value)} className="w-auto max-w-full" />
          <Button variant="outline" size="icon" aria-label="下一日" onClick={() => selectDate(shiftDate(date, 1))}><ChevronRight aria-hidden="true" /></Button>
          <Button variant="ghost" onClick={() => selectDate(today)}>今天</Button><span className="text-xs text-muted-foreground">香港時間</span>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">{Array.from({ length: 7 }, (_, index) => shiftDate(date, index - 3)).map(day => <Button key={day} variant={day === date ? "default" : "ghost"} aria-pressed={day === date} aria-label={`${dateLabel(day, { weekday: "short" })} ${Number(day.slice(-2))}，${day}`} onClick={() => selectDate(day)} className="h-auto min-w-0 flex-col gap-2 rounded-xl px-1 py-3"><span className="text-xs font-normal">{dateLabel(day, { weekday: "short" })}</span><span className="text-lg tabular-nums">{Number(day.slice(-2))}</span></Button>)}</div>
      </section>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="day-journal-title" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="day-journal-title" className="text-lg font-semibold">{dateLabel(date, { month: "long", day: "numeric" })}</h2><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="篩選記錄類型" className="h-auto w-40 whitespace-normal"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">所有記錄</SelectItem>{Object.entries(recordTypes).map(([type, meta]) => <SelectItem key={type} value={type}>{meta.label}</SelectItem>)}</SelectContent></Select></div>
          {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border"><EmptyState icon={NotebookPen} title="這天還沒有符合的記錄" action={<Button onClick={() => openRecord()}>新增記錄</Button>} /></div> : <div className="rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-[48px_minmax(0,1fr)_minmax(0,1fr)] border-b border-border sm:grid-cols-[70px_minmax(0,1fr)_minmax(0,1fr)]"><div aria-hidden="true" />{lanes.map(lane => <h3 key={lane.label} className="px-2 py-3 text-sm font-medium sm:px-4">{lane.label}</h3>)}</div>
            {slots.map(slot => <div key={slot.from} className="grid grid-cols-[48px_minmax(0,1fr)_minmax(0,1fr)] border-b border-border last:border-b-0 sm:grid-cols-[70px_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="px-1 py-5 text-center sm:px-2"><span className="block text-xs font-medium">{slot.label}</span><span className="mt-1 block font-mono text-[10px] text-muted-foreground">{slot.hours}</span></div>
              {lanes.map(lane => <div key={lane.label} className="min-w-0 space-y-2 border-l border-border p-1.5 sm:p-3">{visible.filter(record => lane.types.includes(record.type) && Number(record.time.slice(0, 2)) >= slot.from && Number(record.time.slice(0, 2)) < slot.to).map(record => { const Icon = icons[record.type]; return <button type="button" key={record.id} aria-label={`${recordTypes[record.type].label} ${record.time} ${record.title}，查看及編輯`} onClick={() => openRecord(record)} className="block w-full min-w-0 rounded-lg border border-border bg-background p-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-3.5"><span className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5 shrink-0" aria-hidden="true" /><span>{recordTypes[record.type].label}</span><time className="font-mono" dateTime={`${record.date}T${record.time}:00+08:00`}>{record.time}</time></span><span className="block break-words text-sm font-medium leading-relaxed">{record.title}</span>{record.type !== "note" && record.type !== "checkin" && <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{record.value === null ? "數值未記錄" : `${record.value} ${recordTypes[record.type].unit}`}</span>}{record.type === "note" && record.notes && <span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">{record.notes}</span>}{record.type === "checkin" && <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-green-800 px-2 py-1 text-xs text-white forced-colors:border"><Check className="size-3" aria-hidden="true" />已記錄</span>}</button>; })}</div>)}
            </div>)}
          </div>}
        </section>
        <aside className="min-w-0 space-y-6">
          <section aria-labelledby="checkin-title" className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-6 flex items-center gap-2"><Heart className="size-5" aria-hidden="true" /><h2 id="checkin-title" className="text-lg font-semibold">每日關顧</h2></div>
            <form className="space-y-5" onSubmit={event => { event.preventDefault(); const problem = validateRecord(checkDraft); if (problem) { setCheckError(problem); return; } if (checkDraft.value === null && checkDraft.mood === null && checkDraft.energy === null && !checkDraft.notes.trim()) { setCheckError("請至少填寫一項。"); return; } commit(checkDraft); setCheckError(null); }}>
              <div className="space-y-2"><Label htmlFor="sleep">昨晚睡眠（小時，可留空）</Label><Input id="sleep" type="number" min="0" max="24" step="0.1" value={checkDraft.value ?? ""} onChange={event => setCheckDraft({ ...checkDraft, value: event.target.value === "" ? null : Number(event.target.value) })} /></div>
              <Ratings label="心情" value={checkDraft.mood} onChange={mood => setCheckDraft({ ...checkDraft, mood })} />
              <Ratings label="精神" value={checkDraft.energy} onChange={energy => setCheckDraft({ ...checkDraft, energy })} />
              <div className="space-y-2"><Label htmlFor="reflection">一句感受（選填）</Label><Textarea id="reflection" rows={3} maxLength={2000} value={checkDraft.notes} onChange={event => setCheckDraft({ ...checkDraft, notes: event.target.value })} /></div>
              {checkError && <p role="alert" className="text-sm text-destructive">{checkError}</p>}
              <Button type="submit" variant="outline" className="h-auto w-full whitespace-normal py-2.5"><Check className="size-4" aria-hidden="true" />{checkin ? "更新每日關顧" : "儲存每日關顧"}</Button>
            </form>
          </section>
          <section aria-labelledby="quick-add-title" className="space-y-3"><h2 id="quick-add-title" className="text-sm font-semibold">快速記錄</h2><div className="flex flex-wrap gap-2">{(["meal", "water", "exercise", "activity"] as const).map(type => { const Icon = icons[type]; return <Button key={type} variant="outline" className="h-auto whitespace-normal py-2" onClick={() => openRecord(undefined, type)}><Icon className="size-4" aria-hidden="true" />{recordTypes[type].label}</Button>; })}</div></section>
          <details className="border-t border-border pt-4 text-sm"><summary className="flex cursor-pointer items-center gap-2 rounded-sm focus-visible:outline-2"><ShieldCheck className="size-4 shrink-0" aria-hidden="true" />資料與私隱</summary><div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground"><p>下載檔案包含敏感個人資料，請妥善保存。本頁不會將你輸入的記錄儲存到雲端。</p><p>本版本不會分析照片或語音。熱量為手動輸入的估算值，不是醫療測量；未填寫的數值不會當作零。</p><p>這不是醫療裝置，不提供診斷。</p></div></details>
        </aside>
      </div>
      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />記錄僅保留在本次開啟中；離開前請匯出。</p>
      <Dialog open={draft !== null} onOpenChange={open => { if (!open) setDraft(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{review ? "確認記錄" : "編輯記錄"}</DialogTitle><DialogDescription>{review ? "確認內容後才會儲存；仍可返回修改。" : "數值與筆記可留空，不會推算未填寫的資料。"}</DialogDescription></DialogHeader>
        {draft && <RecordForm draft={draft} onChange={setDraft} review={review} onReviewChange={setReview} editing onDelete={removeRecord} onSave={record => { const problem = commit(record); if (!problem) setDraft(null); return problem; }} />}
      </DialogContent></Dialog>
    </div>
  );
}

