import { describe, expect, test } from "bun:test";
import { initialRecords, shiftDate, validateRecord } from "./life-data.ts";

const entry = initialRecords[1];
describe("manual record validation", () => {
  test("all eight seeded entries have valid fields and unique identities", () => {
    expect(initialRecords).toHaveLength(8);
    expect(new Set(initialRecords.map(record => record.id)).size).toBe(8);
    initialRecords.forEach(record => expect(validateRecord(record)).toBeNull());
  });
  test("unknown is accepted independently from recorded zero", () => {
    expect(validateRecord({ ...entry, value: null })).toBeNull();
    expect(validateRecord({ ...entry, value: 0 })).toBeNull();
    expect(JSON.parse(JSON.stringify({ unknown: null, recordedZero: 0 }))).toEqual({ unknown: null, recordedZero: 0 });
  });
  test("negative, infinite and excessive quantities are rejected", () => {
    [-1, Infinity, NaN, 20001].forEach(value => expect(validateRecord({ ...entry, value })).not.toBeNull());
  });
  test("sleep cannot exceed one day", () => {
    expect(validateRecord({ ...initialRecords[0], value: 24 })).toBeNull();
    expect(validateRecord({ ...initialRecords[0], value: 24.1 })).not.toBeNull();
  });
  test("title and text length limits are enforced", () => {
    expect(validateRecord({ ...entry, title: "  " })).not.toBeNull();
    expect(validateRecord({ ...entry, title: "a".repeat(121) })).not.toBeNull();
    expect(validateRecord({ ...entry, notes: "a".repeat(2001) })).not.toBeNull();
  });
  test("invalid dates and times are rejected", () => {
    ["2026-02-30", "2026-13-01", ""].forEach(date => expect(validateRecord({ ...entry, date })).not.toBeNull());
    ["24:00", "12:60", "8:00"].forEach(time => expect(validateRecord({ ...entry, time })).not.toBeNull());
  });
  test("optional ratings accept only integer values from one to five", () => {
    expect(validateRecord({ ...entry, mood: null, energy: 5 })).toBeNull();
    [0, 6, 2.5, NaN].forEach(mood => expect(validateRecord({ ...entry, mood })).not.toBeNull());
  });
  test("editing a normalized note does not replace the original input", () => {
    const originalInput = "今朝散步 28 分鐘。";
    const revised = { ...entry, originalInput, notes: "Corrected note", value: 35 };
    expect(revised.originalInput).toBe(originalInput);
    expect(validateRecord(revised)).toBeNull();
  });
});
describe("calendar date movement", () => {
  test("crosses month and year boundaries without local timezone drift", () => {
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2024-03-01", -1)).toBe("2024-02-29");
  });
});
