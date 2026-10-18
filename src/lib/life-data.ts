export type RecordType = "meal" | "water" | "exercise" | "activity" | "note" | "checkin";
export interface LifeRecord {
  id: string;
  date: string;
  time: string;
  type: RecordType;
  title: string;
  value: number | null;
  mood: number | null;
  energy: number | null;
  notes: string;
  originalInput: string;
  estimated: boolean;
  sourceType: "manual";
  confirmation: "confirmed";
  createdAt: string;
  updatedAt: string;
}
export const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Hong_Kong" }).format(new Date());
export function shiftDate(date: string, offset: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + offset);
  return result.toISOString().slice(0, 10);
}
export const recordTypes = {
  meal: { label: "飲食", unit: "kcal（估算）", field: "估算熱量", max: 20000 },
  water: { label: "飲水", unit: "ml", field: "飲水量", max: 20000 },
  exercise: { label: "運動", unit: "分鐘", field: "運動時間", max: 1440 },
  activity: { label: "興趣與休息", unit: "分鐘", field: "活動時間", max: 1440 },
  note: { label: "生活筆記", unit: "", field: "", max: 0 },
  checkin: { label: "每日關顧", unit: "小時睡眠", field: "睡眠時數", max: 24 },
} satisfies Record<RecordType, { label: string; unit: string; field: string; max: number }>;
const createdAt = `${today}T06:00:00+08:00`;
const base = { date: today, mood: null, energy: null, notes: "", estimated: false, sourceType: "manual" as const, confirmation: "confirmed" as const, createdAt, updatedAt: createdAt };
export const initialRecords: LifeRecord[] = [
  { ...base, id: "entry-01", time: "06:50", type: "checkin", title: "每日關顧", value: 7.5, mood: 4, energy: 3, notes: "慢慢開始今天。", originalInput: "瞓咗七個半鐘，心情唔錯，精神一般。" },
  { ...base, id: "entry-02", time: "07:15", type: "water", title: "起床後的一杯水", value: 300, originalInput: "飲水 300 ml" },
  { ...base, id: "entry-03", time: "07:45", type: "meal", title: "燕麥、香蕉與乳酪", value: 385, estimated: true, originalInput: "早餐：燕麥、香蕉同乳酪，估計 385 kcal。" },
  { ...base, id: "entry-04", time: "08:30", type: "exercise", title: "輕鬆散步", value: 28, notes: "沿途曬一會兒太陽。", originalInput: "今朝散步 28 分鐘。" },
  { ...base, id: "entry-05", time: "09:15", type: "activity", title: "讀完一章小說", value: 35, originalInput: "睇咗 35 分鐘小說。" },
  { ...base, id: "entry-06", time: "10:30", type: "water", title: "工作中途補水", value: 250, originalInput: "飲水 250 ml" },
  { ...base, id: "entry-07", time: "12:15", type: "meal", title: "蒸魚、蔬菜與白飯", value: null, estimated: true, notes: "份量未記錄。", originalInput: "午餐有蒸魚、菜同白飯，唔肯定熱量。" },
  { ...base, id: "entry-08", time: "13:00", type: "note", title: "留一點空間給自己", value: null, notes: "午飯後坐一會兒，不急著開始下一件事。", originalInput: "午飯後坐一會兒，不急著開始下一件事。" },
];
export function blankRecord(date: string, type: RecordType = "note"): LifeRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), date,
    time: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()),
    type, title: type === "checkin" ? "每日關顧" : "", value: null, mood: null, energy: null,
    notes: "", originalInput: "", estimated: type === "meal", sourceType: "manual",
    confirmation: "confirmed", createdAt: now, updatedAt: now,
  };
}
export function validateRecord(record: LifeRecord): string | null {
  if (!record.title.trim() || record.title.length > 120) return "請填寫 1 至 120 字的名稱。";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || Number.isNaN(Date.parse(`${record.date}T12:00:00Z`)) || new Date(`${record.date}T12:00:00Z`).toISOString().slice(0, 10) !== record.date) return "請填寫有效日期。";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time)) return "請填寫有效時間。";
  if (record.value !== null && (!Number.isFinite(record.value) || record.value < 0 || record.value > recordTypes[record.type].max)) return "數值超出可填寫範圍。";
  if ([record.mood, record.energy].some(value => value !== null && (!Number.isInteger(value) || value < 1 || value > 5))) return "心情與精神請選擇 1 至 5。";
  if (record.notes.length > 2000 || record.originalInput.length > 4000) return "筆記內容太長。";
  return null;
}
