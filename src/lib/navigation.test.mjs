// React component integration tests in Happy DOM, not real-browser E2E tests.
import { afterAll, afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { Window } from "happy-dom";

const dom = new Window({ url: "http://localhost/preview/life/" });
for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Node", "Element", "DocumentFragment", "Event", "MouseEvent", "PointerEvent", "CustomEvent", "MutationObserver", "ResizeObserver", "NodeFilter", "HTMLButtonElement", "HTMLFormElement", "HTMLSelectElement"])
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === "window" ? dom : dom[name] });
globalThis.getComputedStyle = dom.getComputedStyle.bind(dom);
globalThis.requestAnimationFrame = dom.requestAnimationFrame.bind(dom);
globalThis.cancelAnimationFrame = dom.cancelAnimationFrame.bind(dom);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { createElement: h, act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { MemoryRouter, Routes, Route, useNavigate } = await import("react-router-dom");
const { AppShell } = await import("../components/app-shell.tsx");
const { ConfirmDialogProvider } = await import("../components/confirm-dialog.tsx");
const { routes } = await import("../routes.tsx");
const { useAppStore } = await import("./store.ts");
const { blankRecord, initialRecords, shiftDate, today } = await import("./life-data.ts");
let root;
let container;
let navigateHistory;
function HistoryProbe() { navigateHistory = useNavigate(); return null; }
const state = () => useAppStore.getState();
const settle = () => new Promise(resolve => setTimeout(resolve, 5));
async function mount(path = "/") {
  await act(async () => {
    root.render(h(MemoryRouter, { basename: "/preview/life", initialEntries: [`/preview/life${path}`] },
      h(HistoryProbe), h(ConfirmDialogProvider, null,
        h(Routes, null, h(Route, { element: h(AppShell) }, ...routes.map(route => h(Route, { key: route.path, path: route.path, element: route.element })))))));
    await settle();
  });
}
async function click(element) {
  expect(element).not.toBeNull();
  await act(async () => { element.dispatchEvent(new dom.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); await settle(); });
}
function navLink(label, mobile = false) {
  const nav = document.querySelector(`nav[aria-label="${mobile ? "主要導覽（手機）" : "主要導覽"}"]`);
  return [...nav.querySelectorAll("a")].find(link => link.textContent === label);
}
function button(label) { return [...document.querySelectorAll("button")].find(item => item.textContent === label); }
async function enter(id, value) {
  const input = document.getElementById(id);
  const proto = input.tagName === "TEXTAREA" ? dom.HTMLTextAreaElement.prototype : dom.HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, "value").set.call(input, value);
    input.dispatchEvent(new dom.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.Event("change", { bubbles: true }));
    await settle();
  });
}
async function submitForm() {
  await act(async () => { document.getElementById("title")?.closest("form")?.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true })); await settle(); });
}
beforeEach(() => {
  useAppStore.setState({ records: initialRecords.map(record => ({ ...record })), date: today, filter: "all", checkDraft: { ...initialRecords[0] }, addDraft: blankRecord(today), addReview: false, addDirty: false });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => { root.unmount(); await settle(); }); container.remove(); });
afterAll(() => dom.happyDOM.abort());

describe("desktop and mobile route integration", () => {
  test("only real screens are linked, with a single main, heading and first skip link", async () => {
    await mount();
    expect(routes.map(route => route.path)).toEqual(["/", "/add-record"]);
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("a").getAttribute("href")).toBe("#main-content");
    expect(navLink("今天").getAttribute("aria-current")).toBe("page");
    expect(navLink("今天", true).getAttribute("aria-current")).toBe("page");
    expect(navLink("新增記錄").getAttribute("href")).toBe("/preview/life/add-record");
  });
  test("desktop to mobile navigation retains the selected day, filter and unsaved check-in", async () => {
    const date = shiftDate(today, -1);
    state().selectDate(date); state().setFilter("water");
    state().setCheckDraft({ ...state().checkDraft, value: 6.5, notes: "未儲存感受" });
    await mount(); await click(navLink("新增記錄"));
    expect(document.querySelector("h1").textContent).toBe("新增記錄");
    expect(document.getElementById("entry-date").value).toBe(date);
    expect(document.activeElement.id).toBe("main-content");
    expect(navLink("新增記錄").getAttribute("aria-current")).toBe("page");
    await click(navLink("今天", true));
    expect(document.getElementById("record-date").value).toBe(date);
    expect(document.getElementById("sleep").value).toBe("6.5");
    expect(document.getElementById("reflection").value).toBe("未儲存感受");
    expect(state().filter).toBe("water");
  });
  test("typed capture draft and review survive leaving and returning", async () => {
    await mount("/add-record");
    await enter("title", "晚間閱讀"); await enter("notes", "留一點時間看書");
    expect(state().addDraft.title).toBe("晚間閱讀");
    await submitForm();
    expect(state().addReview).toBe(true);
    expect(document.activeElement.getAttribute("aria-label")).toBe("確認記錄內容");
    await click(navLink("今天")); await click(navLink("新增記錄", true));
    expect(state().addReview).toBe(true);
    expect(document.body.textContent).toContain("留一點時間看書");
    await click(button("返回修改"));
    expect(document.getElementById("title").value).toBe("晚間閱讀");
    expect(document.getElementById("notes").value).toBe("留一點時間看書");
  });
  test("review confirmation adds exactly one record and returns to its date", async () => {
    await mount("/add-record");
    await enter("title", "閱讀記錄"); await enter("entry-date", shiftDate(today, -3));
    await enter("notes", "原始筆記"); await submitForm();
    expect(state().records).toHaveLength(8);
    await click(button("確認並儲存"));
    expect(state().records).toHaveLength(9);
    expect(document.querySelector("h1").textContent).toBe("每日記錄");
    expect(state().date).toBe(shiftDate(today, -3));
    expect(state().filter).toBe("all");
    expect(state().records.find(record => record.title === "閱讀記錄").originalInput).toBe("原始筆記");
    expect(document.body.textContent).toContain("閱讀記錄");
    await click(navLink("新增記錄"));
    expect(document.getElementById("title").value).toBe("");
  });
  test("journal editing retains original input; deletion requires confirmation", async () => {
    await mount();
    const row = () => document.querySelector('button[aria-label*="起床後的一杯水"]');
    await click(row());
    await enter("title", "更新的一杯水"); await submitForm();
    await click(button("確認並儲存"));
    expect(state().records).toHaveLength(8);
    expect(state().records.find(record => record.id === "entry-02").originalInput).toBe(initialRecords[1].originalInput);
    await click(document.querySelector('button[aria-label*="更新的一杯水"]'));
    await click(button("刪除"));
    expect(state().records).toHaveLength(8);
    await click(button("取消"));
    expect(state().records).toHaveLength(8);
    await click(button("刪除")); await click(button("刪除記錄"));
    expect(state().records).toHaveLength(7);
    expect(state().records.some(record => record.id === "entry-02")).toBe(false);
  });
  test("date-only draft edits survive router back and forward", async () => {
    await mount(); await click(navLink("新增記錄"));
    await enter("entry-date", shiftDate(today, -5)); await enter("time", "20:42");
    const draftId = state().addDraft.id;
    await act(async () => { navigateHistory(-1); await settle(); });
    expect(document.querySelector("h1").textContent).toBe("每日記錄");
    await act(async () => { navigateHistory(1); await settle(); });
    expect(document.querySelector("h1").textContent).toBe("新增記錄");
    expect(document.getElementById("entry-date").value).toBe(shiftDate(today, -5));
    expect(document.getElementById("time").value).toBe("20:42");
    expect(state().addDraft.id).toBe(draftId);
    await click(navLink("今天")); await click(navLink("新增記錄"));
    expect(document.getElementById("time").value).toBe("20:42");
  });
  test("inline check-in submission updates without duplicating the date", async () => {
    await mount(); await enter("sleep", "8.2"); await enter("reflection", "更新感受");
    const form = document.getElementById("sleep").closest("form");
    for (let i = 0; i < 2; i++) await act(async () => { form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true })); await settle(); });
    const matching = state().records.filter(record => record.type === "checkin" && record.date === today);
    expect(matching).toHaveLength(1);
    expect(matching[0].value).toBe(8.2);
    expect(matching[0].notes).toBe("更新感受");
  });
  test("invalid capture shows an associated error without advancing to review", async () => {
    await mount("/add-record"); await enter("title", "   "); await submitForm();
    const error = document.getElementById("record-form-error");
    expect(error.getAttribute("role")).toBe("alert");
    expect(document.getElementById("title").closest("form").getAttribute("aria-describedby")).toBe(error.id);
    expect(state().addReview).toBe(false);
    expect(state().records).toHaveLength(8);
  });
  test("JSON export constructs all current records and requests a download, without claiming a browser save", async () => {
    let capturedBlob;
    let downloadName;
    const blobSpy = spyOn(URL, "createObjectURL").mockImplementation(blob => { capturedBlob = blob; return "blob:component-export"; });
    const clickSpy = spyOn(dom.HTMLAnchorElement.prototype, "click").mockImplementation(function () { downloadName = this.download; });
    try {
      await mount();
      await act(async () => { state().saveRecord({ ...blankRecord(today), title: "匯出前新增" }); await settle(); });
      await click(button("匯出記錄"));
      expect(downloadName).toBe("life-progress-records.json");
      const exported = JSON.parse(await capturedBlob.text());
      expect(exported.timeZone).toBe("Asia/Hong_Kong");
      expect(exported.records).toHaveLength(9);
      expect(exported.records.some(record => record.title === "匯出前新增")).toBe(true);
    } finally { blobSpy.mockRestore(); clickSpy.mockRestore(); }
  });
  test("direct entry to the add route works under a non-root host path", async () => {
    await mount("/add-record");
    expect(document.querySelector("h1").textContent).toBe("新增記錄");
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(navLink("今天", true).getAttribute("href")).toBe("/preview/life");
    await click(navLink("今天", true));
    expect(document.querySelector("h1").textContent).toBe("每日記錄");
  });
});
