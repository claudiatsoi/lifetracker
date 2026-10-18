import { ArrowRight, BarChart3, BookOpenText, Clock3, History as HistoryIcon, MoonStar, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { recordTypes } from "@/lib/life-data";

function exportRecords(records: ReturnType<typeof useAppStore.getState>['records']) {
  const blob = new Blob([JSON.stringify({ version: 1, timeZone: "Asia/Hong_Kong", records }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "life-progress-records.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-HK", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00+08:00`));
}

function formatTime(date: string, time: string) {
  return new Intl.DateTimeFormat("zh-HK", { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(`${date}T${time}:00+08:00`));
}

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function HistoryPage() {
  const records = useAppStore((state) => state.records)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const grouped = new Map<string, typeof records>();
  for (const record of records) {
    const bucket = grouped.get(record.date) ?? [];
    bucket.push(record);
    grouped.set(record.date, bucket);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">歷程</p>
          <h1 className="text-3xl font-semibold tracking-tight">完整時間軸</h1>
        </div>
        <Button variant="outline" className="h-auto whitespace-normal py-2.5">
          <HistoryIcon className="size-4" aria-hidden="true" />
          最近更新 {records.length ? formatDate(records[0].date) : "-"}
        </Button>
      </header>

      <div className="space-y-5">
        {Array.from(grouped.entries()).map(([day, dayRecords]) => (
          <Card key={day} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-lg">{formatDate(day)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {dayRecords.map((record) => (
                <div key={record.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{recordTypes[record.type].label}</span>
                      <span>•</span>
                      <time dateTime={`${record.date}T${record.time}:00+08:00`}>{formatTime(record.date, record.time)}</time>
                    </div>
                    <p className="break-words text-base font-medium">{record.title}</p>
                    {record.value !== null && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {record.value} {recordTypes[record.type].unit || "項目"}
                      </p>
                    )}
                    {record.notes && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{record.notes}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="h-auto whitespace-normal px-2 py-1.5 text-xs">
                    查看
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProgressPage() {
  const records = useAppStore((state) => state.records);
  const exerciseMinutes = records
    .filter((record) => record.type === "exercise")
    .reduce((sum, record) => sum + (record.value ?? 0), 0);
  const waterVolume = records
    .filter((record) => record.type === "water")
    .reduce((sum, record) => sum + (record.value ?? 0), 0);
  const avgSleep = average(records.filter((record) => record.type === "checkin").map((record) => record.value));
  const activeDays = new Set(records.map((record) => record.date)).size;

  const summary = [
    { label: "總紀錄數", value: String(records.length), icon: Clock3 },
    { label: "活躍天數", value: String(activeDays), icon: BarChart3 },
    { label: "總運動時長", value: `${exerciseMinutes} 分`, icon: Sparkles },
    { label: "平均睡眠", value: `${avgSleep.toFixed(1)} 小時`, icon: MoonStar },
    { label: "總飲水量", value: `${waterVolume} ml`, icon: BookOpenText },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">進度</p>
        <h1 className="text-3xl font-semibold tracking-tight">生命節奏概覽</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summary.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ReflectionsPage() {
  const records = useAppStore((state) => state.records);
  const checkins = records.filter((record) => record.type === "checkin");
  const latestCheckin = checkins.at(-1) ?? null;
  const moodAverage = average(records.filter((record) => record.type === "checkin").map((record) => record.mood));
  const energyAverage = average(records.filter((record) => record.type === "checkin").map((record) => record.energy));
  const exerciseDays = new Set(records.filter((record) => record.type === "exercise").map((record) => record.date)).size;

  const insights = [
    `目前已進行 ${exerciseDays} 天的運動紀錄，保持了連續的活動節奏。`,
    latestCheckin ? `最近の每日關顧顯示睡眠 ${latestCheckin.value ?? "未填"} 小時，心情平均 ${moodAverage ? moodAverage.toFixed(1) : "尚未紀錄"} / 5，精神平均 ${energyAverage ? energyAverage.toFixed(1) : "尚未紀錄"} / 5。` : "尚未建立最新每日關顧，先補上一個睡眠與感受記錄。",
    `這個版本保留了手動紀錄，且會把未填寫的數值視為未知而不是零。`,
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">回顧</p>
        <h1 className="text-3xl font-semibold tracking-tight">最近的生活提醒</h1>
      </header>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <Card key={insight}>
            <CardContent className="flex items-start gap-3 p-5">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <p className="leading-relaxed text-muted-foreground">{insight}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const records = useAppStore((state) => state.records);

  const sections = [
    { title: "資料模式", body: "這個版本僅保留於目前瀏覽器會話，當前共有 " + records.length + " 筆記錄。" },
    { title: "語言", body: "界面以繁體中文為主，日期與時間遵循香港本地時區。" },
    { title: "私隱與備份", body: "下載 JSON 是手動匯出，並不會自動同步到雲端或儲存於資料庫。" },
    { title: "使用注意", body: "這不是醫療裝置，熱量與睡眠是手動輸入，而非自動測量。" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">設定</p>
          <h1 className="text-3xl font-semibold tracking-tight">App 設定</h1>
        </div>
        <Button variant="outline" className="h-auto whitespace-normal py-2.5" onClick={() => exportRecords(records)}>
          <Settings2 className="size-4" aria-hidden="true" />
          匯出資料
        </Button>
      </header>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
