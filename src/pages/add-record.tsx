import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RecordForm } from "@/components/record-form";
import { useAppStore } from "@/lib/store";

export function AddRecordPage() {
  const draft = useAppStore(state => state.addDraft);
  const review = useAppStore(state => state.addReview);
  const setDraft = useAppStore(state => state.setAddDraft);
  const setReview = useAppStore(state => state.setAddReview);
  const saveRecord = useAppStore(state => state.saveRecord);
  const selectDate = useAppStore(state => state.selectDate);
  const setFilter = useAppStore(state => state.setFilter);
  const resetAdd = useAppStore(state => state.resetAdd);
  const navigate = useNavigate();
  return <div className="mx-auto w-full max-w-2xl px-4 py-7 sm:px-8 sm:py-9">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold tracking-tight">新增記錄</h1><Button asChild variant="ghost" className="h-auto whitespace-normal py-2"><Link to="/"><ArrowLeft aria-hidden="true" className="size-4" />返回每日記錄</Link></Button></div>
    <section aria-label="手動記錄" className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <p className="mb-5 text-sm text-muted-foreground">數值與筆記可留空，不會推算未填寫的資料。</p>
      <RecordForm draft={draft} onChange={setDraft} review={review} onReviewChange={setReview} onSave={record => {
        const problem = saveRecord(record);
        if (problem) return problem;
        selectDate(record.date); setFilter("all"); resetAdd();
        toast.success("記錄已儲存於本次開啟中"); navigate("/");
        return null;
      }} />
    </section>
    <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Shield aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />切換頁面會保留草稿；重新整理或關閉會清除所有記錄與草稿。本版本沒有登入或私人資料庫。</p>
  </div>;
}
