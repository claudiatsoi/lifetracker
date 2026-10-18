import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Activity, ArrowUpRight, Dumbbell, Flame, Goal, Scale, Ruler, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { today } from "@/lib/life-data";

function bmi(weightKg: number | null, heightCm: number | null) {
  if (weightKg === null || heightCm === null || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function MetricsPage() {
  const userGoals = useAppStore((state) => state.userGoals);
  const metricEntries = useAppStore((state) => state.metricEntries);
  const setUserGoals = useAppStore((state) => state.setUserGoals);
  const addMetricEntry = useAppStore((state) => state.addMetricEntry);
  const [draft, setDraft] = useState({
    date: today,
    weightKg: "",
    caloriesIn: "",
    caloriesBurned: "",
    waistCm: "",
    chestCm: "",
    armCm: "",
    thighCm: "",
    calfCm: "",
  });

  const latestEntry = metricEntries.at(-1) ?? null;
  const currentBmi = bmi(latestEntry?.weightKg ?? null, userGoals.heightCm ?? null);
  const trendData = useMemo(() => {
    return [...metricEntries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({
        date: new Intl.DateTimeFormat("zh-HK", { timeZone: "Asia/Hong_Kong", month: "short", day: "numeric" }).format(new Date(`${entry.date}T12:00:00+08:00`)),
        weight: entry.weightKg,
        bmi: entry.weightKg && userGoals.heightCm ? entry.weightKg / ((userGoals.heightCm / 100) ** 2) : null,
      }));
  }, [metricEntries, userGoals.heightCm]);
  const goalProgress = useMemo(() => {
    const weightGap = userGoals.weightGoalKg && latestEntry?.weightKg ? Math.abs(latestEntry.weightKg - userGoals.weightGoalKg) : null;
    return {
      weightGap,
      dailyCalories: userGoals.calorieGoal ? `${Math.max(0, (userGoals.calorieGoal ?? 0) - (latestEntry?.caloriesIn ?? 0))} kcal remaining` : "Set a calorie goal",
    };
  }, [latestEntry, userGoals]);

  const onSave = () => {
    const payload = {
      id: crypto.randomUUID(),
      date: draft.date,
      weightKg: draft.weightKg === "" ? null : Number(draft.weightKg),
      caloriesIn: draft.caloriesIn === "" ? null : Number(draft.caloriesIn),
      caloriesBurned: draft.caloriesBurned === "" ? null : Number(draft.caloriesBurned),
      waistCm: draft.waistCm === "" ? null : Number(draft.waistCm),
      chestCm: draft.chestCm === "" ? null : Number(draft.chestCm),
      armCm: draft.armCm === "" ? null : Number(draft.armCm),
      thighCm: draft.thighCm === "" ? null : Number(draft.thighCm),
      calfCm: draft.calfCm === "" ? null : Number(draft.calfCm),
    };
    addMetricEntry(payload);
    setDraft({ ...draft, weightKg: "", caloriesIn: "", caloriesBurned: "", waistCm: "", chestCm: "", armCm: "", thighCm: "", calfCm: "" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">體態與目標</p>
          <h1 className="text-3xl font-semibold tracking-tight">身體數據追蹤</h1>
        </div>
        <Button variant="outline" className="h-auto whitespace-normal py-2.5">
          <Target className="size-4" aria-hidden="true" />
          個人目標設定
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">體重</span><Scale className="size-4 text-muted-foreground" /></div></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{latestEntry?.weightKg ?? "-"} kg</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">BMI</span><Activity className="size-4 text-muted-foreground" /></div></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{currentBmi === null ? "-" : currentBmi.toFixed(1)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">熱量目標</span><Flame className="size-4 text-muted-foreground" /></div></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{userGoals.calorieGoal ?? "-"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">體重目標</span><Goal className="size-4 text-muted-foreground" /></div></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{userGoals.weightGoalKg ?? "-"} kg</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">目標差距</span><ArrowUpRight className="size-4 text-muted-foreground" /></div></CardHeader>
          <CardContent><div className="text-base font-semibold">{goalProgress.weightGap === null ? "-" : `${goalProgress.weightGap.toFixed(1)} kg`}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>今日數據</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="date">日期</Label><Input id="date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="weightKg">體重（kg）</Label><Input id="weightKg" type="number" step="0.1" value={draft.weightKg} onChange={(event) => setDraft({ ...draft, weightKg: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="caloriesIn">卡路里攝入</Label><Input id="caloriesIn" type="number" step="1" value={draft.caloriesIn} onChange={(event) => setDraft({ ...draft, caloriesIn: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="caloriesBurned">卡路里消耗</Label><Input id="caloriesBurned" type="number" step="1" value={draft.caloriesBurned} onChange={(event) => setDraft({ ...draft, caloriesBurned: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="waistCm">腰圍（cm）</Label><Input id="waistCm" type="number" step="0.1" value={draft.waistCm} onChange={(event) => setDraft({ ...draft, waistCm: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="chestCm">胸圍（cm）</Label><Input id="chestCm" type="number" step="0.1" value={draft.chestCm} onChange={(event) => setDraft({ ...draft, chestCm: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="armCm">手臂長度（cm）</Label><Input id="armCm" type="number" step="0.1" value={draft.armCm} onChange={(event) => setDraft({ ...draft, armCm: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="thighCm">大腿長度（cm）</Label><Input id="thighCm" type="number" step="0.1" value={draft.thighCm} onChange={(event) => setDraft({ ...draft, thighCm: event.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="calfCm">小腿長度（cm）</Label><Input id="calfCm" type="number" step="0.1" value={draft.calfCm} onChange={(event) => setDraft({ ...draft, calfCm: event.target.value })} /></div>
            </div>
            <Button onClick={onSave} className="w-full">儲存體態數據</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>目標設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="heightCm">身高（cm）</Label><Input id="heightCm" type="number" step="1" value={userGoals.heightCm ?? ""} onChange={(event) => setUserGoals({ heightCm: event.target.value === "" ? null : Number(event.target.value) })} /></div>
            <div className="space-y-2"><Label htmlFor="calorieGoal">每日卡路里目標</Label><Input id="calorieGoal" type="number" step="1" value={userGoals.calorieGoal ?? ""} onChange={(event) => setUserGoals({ calorieGoal: event.target.value === "" ? null : Number(event.target.value) })} /></div>
            <div className="space-y-2"><Label htmlFor="weightGoalKg">體重目標（kg）</Label><Input id="weightGoalKg" type="number" step="0.1" value={userGoals.weightGoalKg ?? ""} onChange={(event) => setUserGoals({ weightGoalKg: event.target.value === "" ? null : Number(event.target.value) })} /></div>
            <div className="space-y-2"><Label htmlFor="waistGoalCm">腰圍目標（cm）</Label><Input id="waistGoalCm" type="number" step="0.1" value={userGoals.measurementGoals.waistCm ?? ""} onChange={(event) => setUserGoals({ measurementGoals: { ...userGoals.measurementGoals, waistCm: event.target.value === "" ? null : Number(event.target.value) } })} /></div>
            <div className="space-y-2"><Label htmlFor="armGoalCm">手臂目標（cm）</Label><Input id="armGoalCm" type="number" step="0.1" value={userGoals.measurementGoals.armCm ?? ""} onChange={(event) => setUserGoals({ measurementGoals: { ...userGoals.measurementGoals, armCm: event.target.value === "" ? null : Number(event.target.value) } })} /></div>
            <div className="space-y-2"><Label htmlFor="thighGoalCm">大腿目標（cm）</Label><Input id="thighGoalCm" type="number" step="0.1" value={userGoals.measurementGoals.thighCm ?? ""} onChange={(event) => setUserGoals({ measurementGoals: { ...userGoals.measurementGoals, thighCm: event.target.value === "" ? null : Number(event.target.value) } })} /></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ruler className="size-4" />體重與 BMI 趨勢</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            config={{
              weight: { label: "體重（kg）", color: "#3b82f6" },
              bmi: { label: "BMI", color: "#10b981" },
            }}
            className="h-[260px] w-full"
          >
            <AreaChart data={trendData} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }} content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="weight" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.18} strokeWidth={2} />
              <Area type="monotone" dataKey="bmi" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ruler className="size-4" />歷史紀錄</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metricEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">目前還沒有體態紀錄。</p>
            ) : (
              metricEntries.slice().reverse().map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <strong>{entry.date}</strong>
                    <span className="text-xs text-muted-foreground">{entry.weightKg ? `${entry.weightKg} kg` : "未記錄體重"}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {entry.caloriesIn !== null && <span>攝入 {entry.caloriesIn} kcal</span>}
                    {entry.caloriesBurned !== null && <span>消耗 {entry.caloriesBurned} kcal</span>}
                    {entry.waistCm !== null && <span>腰 {entry.waistCm} cm</span>}
                    {entry.chestCm !== null && <span>胸 {entry.chestCm} cm</span>}
                    {entry.armCm !== null && <span>手臂 {entry.armCm} cm</span>}
                    {entry.thighCm !== null && <span>大腿 {entry.thighCm} cm</span>}
                    {entry.calfCm !== null && <span>小腿 {entry.calfCm} cm</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
