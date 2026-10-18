import { beforeEach, describe, expect, test } from "bun:test";
import { blankRecord, initialRecords, shiftDate, today } from "./life-data.ts";
import { useAppStore } from "./store.ts";

beforeEach(() => useAppStore.setState({
  records: initialRecords.map(record => ({ ...record })), date: today, filter: "all",
  checkDraft: { ...initialRecords[0] }, addDraft: blankRecord(today), addReview: false, addDirty: false,
}));
const state = () => useAppStore.getState();
describe("session state across routes", () => {
  test("an empty capture starts on the selected journal date and quick-action type", () => {
    const date = shiftDate(today, -2);
    state().selectDate(date);
    expect(state().prepareAdd("water")).toBe(true);
    expect(state().addDraft.date).toBe(date);
    expect(state().addDraft.type).toBe("water");
  });
  test("navigation preparations never overwrite a populated draft or review", () => {
    const draft = { ...blankRecord(today), title: "保留的草稿", notes: "原本內容" };
    state().setAddDraft(draft); state().setAddReview(true);
    expect(state().prepareAdd("meal")).toBe(false);
    expect(state().addDraft).toEqual(draft);
    expect(state().addReview).toBe(true);
  });
  test("a date-only or time-only draft change is still retained", () => {
    const draft = { ...state().addDraft, date: shiftDate(today, -4), time: "20:42" };
    state().setAddDraft(draft);
    expect(state().prepareAdd("water")).toBe(false);
    expect(state().addDraft).toEqual(draft);
    expect(state().addDirty).toBe(true);
  });
  test("date re-selection does not erase unsaved check-in fields", () => {
    const draft = { ...state().checkDraft, notes: "未儲存的感受" };
    state().setCheckDraft(draft); state().selectDate(today);
    expect(state().checkDraft).toEqual(draft);
    state().selectDate("2026-02-30");
    expect(state().date).toBe(today);
  });
  test("saving preserves unknown quantities separately from zero", () => {
    const unknown = { ...blankRecord(today, "water"), title: "飲水，未量度" };
    const zero = { ...blankRecord(today, "water"), title: "零數值", value: 0 };
    expect(state().saveRecord(unknown)).toBeNull();
    expect(state().saveRecord(zero)).toBeNull();
    expect(state().records.find(row => row.id === unknown.id).value).toBeNull();
    expect(state().records.find(row => row.id === zero.id).value).toBe(0);
  });
  test("invalid records leave the collection unchanged", () => {
    const before = state().records;
    expect(state().saveRecord({ ...blankRecord(today), title: "" })).not.toBeNull();
    expect(state().records).toBe(before);
  });
  test("editing keeps identity and original input without duplicate rows", () => {
    const before = state().records[3];
    state().saveRecord({ ...before, title: "改名散步", originalInput: "不應取代原文", value: 30 });
    expect(state().records).toHaveLength(8);
    const saved = state().records.find(row => row.id === before.id);
    expect(saved.originalInput).toBe(before.originalInput);
    expect(saved.value).toBe(30);
  });
  test("check-ins replace a same-date record, not append a duplicate", () => {
    const replacement = { ...blankRecord(today, "checkin"), mood: 5 };
    state().saveRecord(replacement);
    expect(state().records.filter(row => row.date === today && row.type === "checkin")).toEqual([expect.objectContaining({ id: replacement.id, mood: 5 })]);
    expect(state().checkDraft.id).toBe(replacement.id);
  });
  test("changing a check-in to a note clears the inline check-in draft", () => {
    const before = state().records[0];
    state().saveRecord({ ...before, type: "note", title: "生活筆記", value: null, mood: null, energy: null });
    expect(state().checkDraft.id).not.toBe(before.id);
    expect(state().checkDraft.mood).toBeNull();
  });
  test("deletion removes the record and resets its check-in draft", () => {
    state().removeRecord(initialRecords[0].id);
    expect(state().records).toHaveLength(7);
    expect(state().checkDraft.value).toBeNull();
    expect(initialRecords).toHaveLength(8);
  });
  test("finishing capture clears its draft without resetting journal data or filter", () => {
    state().setFilter("water");
    state().setAddDraft({ ...blankRecord(today), title: "已完成" });
    state().setAddReview(true); state().resetAdd();
    expect(state().addDraft.title).toBe("");
    expect(state().addReview).toBe(false);
    expect(state().records).toHaveLength(8);
    expect(state().filter).toBe("water");
  });
});
