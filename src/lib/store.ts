import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface UserMeasurementGoals {
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
}

export interface UserProfileGoals {
  heightCm: number | null;
  calorieGoal: number | null;
  weightGoalKg: number | null;
  measurementGoals: UserMeasurementGoals;
}

export interface MetricEntry {
  id: string;
  date: string;
  weightKg: number | null;
  caloriesIn: number | null;
  caloriesBurned: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
}

// Global client state shared across components/routes. ONE module-scoped store,
// no Provider needed — import `useAppStore` anywhere. Use `useState` for
// component-local state; let TanStack Query own server/connector data (don't
// mirror it here). NEVER use raw React Context for mutable shared state.
//
// Rules:
//   • Put actions INSIDE the store (set-based, immutable updates); components call them.
//   • Read with a NARROW selector — `useAppStore((s) => s.items)`, never
//     `useAppStore()` with no selector. Don't return a fresh object/array from a
//     selector (it re-renders on every change); group with `useShallow`:
//     `import { useShallow } from "zustand/react/shallow"`
//     `const { a, b } = useAppStore(useShallow((s) => ({ a: s.a, b: s.b })));`
//
// Example (replace `AppState` with the app's real state + actions):
//   interface AppState {
//     items: Item[];
//     addItem: (text: string) => void;
//     toggleItem: (id: string) => void;
//   }
//   export const useAppStore = create<AppState>((set) => ({
//     items: [],
//     addItem: (text) =>
//       set((s) => ({ items: [...s.items, { id: crypto.randomUUID(), text, done: false }] })),
//     toggleItem: (id) =>
//       set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
//   }));
//
// In components:
//   const items = useAppStore((s) => s.items);      // read (targeted re-render)
//   const addItem = useAppStore((s) => s.addItem);  // action (stable reference)

import { blankRecord, initialRecords, today, validateRecord, type LifeRecord, type RecordType } from "./life-data";

interface AppState {
  records: LifeRecord[];
  date: string;
  filter: string;
  checkDraft: LifeRecord;
  addDraft: LifeRecord;
  addReview: boolean;
  addDirty: boolean;
  userGoals: UserProfileGoals;
  metricEntries: MetricEntry[];
  selectDate: (date: string) => void;
  setFilter: (filter: string) => void;
  setCheckDraft: (draft: LifeRecord) => void;
  setAddDraft: (draft: LifeRecord) => void;
  setAddReview: (review: boolean) => void;
  setUserGoals: (goals: Partial<UserProfileGoals>) => void;
  addMetricEntry: (entry: MetricEntry) => void;
  prepareAdd: (type?: RecordType) => boolean;
  resetAdd: () => void;
  saveRecord: (record: LifeRecord) => string | null;
  removeRecord: (id: string) => void;
}

const storage = typeof window === "undefined" ? undefined : window.localStorage;

const makeDefaultState = () => ({
  records: initialRecords.map(record => ({ ...record })),
  date: today,
  filter: "all",
  checkDraft: { ...(initialRecords.find(record => record.type === "checkin") ?? blankRecord(today, "checkin")) },
  addDraft: blankRecord(today),
  addReview: false,
  addDirty: false,
  userGoals: {
    heightCm: null,
    calorieGoal: 2200,
    weightGoalKg: null,
    measurementGoals: { waistCm: null, chestCm: null, armCm: null, thighCm: null, calfCm: null },
  },
  metricEntries: [
    {
      id: "metric-01",
      date: today,
      weightKg: 68,
      caloriesIn: 2100,
      caloriesBurned: 320,
      waistCm: 82,
      chestCm: 96,
      armCm: 31,
      thighCm: 53,
      calfCm: 37,
    },
  ],
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...makeDefaultState(),
      selectDate: date => {
        if (date === get().date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) return;
        set({ date, checkDraft: { ...(get().records.find(record => record.date === date && record.type === "checkin") ?? blankRecord(date, "checkin")) } });
      },
      setFilter: filter => set({ filter }),
      setCheckDraft: checkDraft => set({ checkDraft }),
      setAddDraft: addDraft => set({ addDraft, addReview: false, addDirty: true }),
      setAddReview: addReview => set({ addReview }),
      setUserGoals: goals => set(state => ({ userGoals: { ...state.userGoals, ...goals, measurementGoals: { ...state.userGoals.measurementGoals, ...(goals.measurementGoals ?? {}) } } })),
      addMetricEntry: entry => set(state => ({ metricEntries: [...state.metricEntries, entry] })),
      prepareAdd: (type = "note") => {
        if (get().addDirty) return false;
        set({ addDraft: blankRecord(get().date, type), addReview: false, addDirty: false });
        return true;
      },
      resetAdd: () => set({ addDraft: blankRecord(get().date), addReview: false, addDirty: false }),
      saveRecord: record => {
        const problem = validateRecord(record);
        if (problem) return problem;
        const previous = get().records.find(item => item.id === record.id);
        const saved = { ...record, title: record.title.trim(), originalInput: previous?.originalInput || record.originalInput || record.notes || record.title, updatedAt: new Date().toISOString() };
        set(state => ({
          records: [...state.records.filter(item => item.id !== saved.id && !(saved.type === "checkin" && item.type === "checkin" && item.date === saved.date)), saved],
          checkDraft: saved.type === "checkin" && saved.date === state.date ? { ...saved } : previous?.type === "checkin" && previous.date === state.date ? blankRecord(state.date, "checkin") : state.checkDraft,
        }));
        return null;
      },
      removeRecord: id => set(state => ({
        records: state.records.filter(record => record.id !== id),
        checkDraft: state.checkDraft.id === id ? blankRecord(state.date, "checkin") : state.checkDraft,
      })),
    }),
    {
      name: "life-progress-tracker",
      storage: createJSONStorage(() => ({
        getItem: name => (storage ? storage.getItem(name) : null),
        setItem: (name, value) => { if (storage) storage.setItem(name, value); },
        removeItem: name => { if (storage) storage.removeItem(name); },
      })),
      partialize: state => ({
        records: state.records,
        date: state.date,
        filter: state.filter,
        checkDraft: state.checkDraft,
        addDraft: state.addDraft,
        addReview: state.addReview,
        addDirty: state.addDirty,
        userGoals: state.userGoals,
        metricEntries: state.metricEntries,
      }),
    },
  ),
);
