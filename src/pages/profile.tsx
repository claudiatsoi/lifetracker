import { useMemo } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store";

export function ProfilePage() {
  const userProfile = useAppStore((state) => state.userProfile);
  const setUserProfile = useAppStore((state) => state.setUserProfile);

  const summary = useMemo(() => {
    const targetWeight = userProfile.targetWeightKg ?? "未設定";
    const goalLabel = userProfile.goal === "lose" ? "減脂" : userProfile.goal === "gain" ? "增肌" : "維持";
    return {
      targetWeight,
      goalLabel,
      calories: userProfile.dailyCalories ?? "未設定",
    };
  }, [userProfile]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <header>
        <p className="text-sm font-medium text-muted-foreground">個人資料</p>
        <h1 className="text-3xl font-semibold tracking-tight">我的目標設定</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="size-4" />基本資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">姓名</Label>
              <Input id="profile-name" value={userProfile.name} onChange={(event) => setUserProfile({ name: event.target.value })} placeholder="你的名字" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-age">年齡</Label>
                <Input id="profile-age" type="number" min="1" value={userProfile.age ?? ""} onChange={(event) => setUserProfile({ age: event.target.value === "" ? null : Number(event.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-gender">性別</Label>
                <Select value={userProfile.gender} onValueChange={(value) => setUserProfile({ gender: value as typeof userProfile.gender })}>
                  <SelectTrigger id="profile-gender">
                    <SelectValue placeholder="選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-height">身高（cm）</Label>
                <Input id="profile-height" type="number" min="50" step="1" value={userProfile.heightCm ?? ""} onChange={(event) => setUserProfile({ heightCm: event.target.value === "" ? null : Number(event.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-target-weight">目標體重（kg）</Label>
                <Input id="profile-target-weight" type="number" min="20" step="0.1" value={userProfile.targetWeightKg ?? ""} onChange={(event) => setUserProfile({ targetWeightKg: event.target.value === "" ? null : Number(event.target.value) })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-goal">目標方向</Label>
                <Select value={userProfile.goal} onValueChange={(value) => setUserProfile({ goal: value as typeof userProfile.goal })}>
                  <SelectTrigger id="profile-goal">
                    <SelectValue placeholder="目標" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">減脂</SelectItem>
                    <SelectItem value="maintain">維持</SelectItem>
                    <SelectItem value="gain">增肌</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-activity">活動程度</Label>
                <Select value={userProfile.activityLevel} onValueChange={(value) => setUserProfile({ activityLevel: value as typeof userProfile.activityLevel })}>
                  <SelectTrigger id="profile-activity">
                    <SelectValue placeholder="活動程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="moderate">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-calories">每日卡路里目標</Label>
              <Input id="profile-calories" type="number" min="800" step="50" value={userProfile.dailyCalories ?? ""} onChange={(event) => setUserProfile({ dailyCalories: event.target.value === "" ? null : Number(event.target.value) })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>個人概覽</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">使用者</p>
              <h2 className="mt-1 text-2xl font-semibold">{userProfile.name || "未命名使用者"}</h2>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span>目標</span>
                <strong className="text-foreground">{summary.goalLabel}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span>目標體重</span>
                <strong className="text-foreground">{summary.targetWeight}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span>每日熱量</span>
                <strong className="text-foreground">{summary.calories}</strong>
              </div>
            </div>

            <Button className="w-full" onClick={() => setUserProfile({ name: userProfile.name || "我的目標" })}>
              儲存個人資料
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
