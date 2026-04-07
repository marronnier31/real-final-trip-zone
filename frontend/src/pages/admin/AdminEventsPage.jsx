import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { quickThemes } from "../../data/homeData";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import {
  createAdminCoupon,
  createAdminEvent,
  deleteAdminCoupon,
  deleteAdminEvent,
  getAdminEvents,
  saveAdminEvent,
  updateAdminEventStatus,
} from "../../services/dashboardService";

const columns = [
  { key: "title", label: "이벤트/쿠폰명" },
  { key: "status", label: "상태" },
  { key: "target", label: "대상" },
  { key: "period", label: "운영 기간" },
];

function isVisibleStatus(status) {
  return status === "ONGOING" || status === "ACTIVE";
}

function isDraftStatus(status) {
  return status === "DRAFT";
}

function isHiddenStatus(status) {
  return status === "HIDDEN" || status === "INACTIVE" || status === "DELETE";
}

const EVENT_TARGET_OPTIONS = [
  { label: "전체 특가", value: "theme=deal" },
  ...quickThemes.map((item) => ({
    label: item.label,
    value: String(item.to).replace("/lodgings?", ""),
  })),
];

function splitDateTime(value) {
  if (!value) {
    return { date: "", time: "14:00" };
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const [date = "", rawTime = "14:00"] = normalized.split("T");
  return { date, time: rawTime.slice(0, 5) || "14:00" };
}

function mergeDateTime(date, time) {
  if (!date) return "";
  return `${date}T${time || "14:00"}`;
}

function hasInvalidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return end <= start;
}

function getCouponDiscountFieldMeta(discountType) {
  if (discountType === "PERCENT") {
    return {
      min: "1",
      max: "100",
      suffix: "%",
    };
  }

  return {
    min: "1",
    max: undefined,
    suffix: "원",
  };
}

export default function AdminEventsPage() {
  const [rows, setRows] = useState([]);
  const [section, setSection] = useState("EVENT");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [mode, setMode] = useState("edit");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    targetValue: "theme=deal",
    startDate: "",
    endDate: "",
    discountType: "AMOUNT",
    discountValue: "10000",
    status: "DRAFT",
  });
  const visibleRows = rows.filter((row) => row.entityType === section);
  const selectedEvent = visibleRows.find((row) => row.id === selectedEventId) ?? visibleRows[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getAdminEvents();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedEventId(nextRows[0]?.id ?? null);
        if (nextRows[0]) {
          setDraft({
            title: nextRows[0].title,
            content: nextRows[0].content ?? "",
            targetValue: nextRows[0].targetValue ?? "theme=deal",
            startDate: nextRows[0].startDate ? nextRows[0].startDate.slice(0, 16) : "",
            endDate: nextRows[0].endDate ? nextRows[0].endDate.slice(0, 16) : "",
            discountType: nextRows[0].discountType ?? "AMOUNT",
            discountValue: String(nextRows[0].discountValue ?? 10000),
            status: nextRows[0].status ?? "DRAFT",
          });
          setMode("edit");
        }
        setNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load admin events.", error);
        setNotice("이벤트 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRows();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!visibleRows.length) {
      setSelectedEventId(null);
      setMode("create");
      return;
    }

    if (!visibleRows.some((row) => row.id === selectedEventId)) {
      setSelectedEventId(visibleRows[0].id);
      syncDraft(visibleRows[0].id, visibleRows);
    }
  }, [section, rows]);

  const syncDraft = (eventId, sourceRows = rows) => {
    const target = sourceRows.find((row) => row.id === eventId);
    if (!target) return;
      setDraft({
        title: target.title,
        content: target.content ?? "",
        targetValue: target.targetValue ?? "theme=deal",
        startDate: target.startDate ? target.startDate.slice(0, 16) : "",
        endDate: target.endDate ? target.endDate.slice(0, 16) : "",
        discountType: target.discountType ?? "AMOUNT",
        discountValue: String(target.discountValue ?? (target.discountType === "PERCENT" ? 10 : 10000)),
        status: target.status ?? "DRAFT",
      });
    setUploadFile(null);
    setMode("edit");
  };

  const openCreate = () => {
    setMode("create");
    setSelectedEventId(null);
    setUploadFile(null);
      setDraft({
        title: "",
        content: "",
        targetValue: "theme=deal",
        startDate: "",
        endDate: "",
        discountType: "AMOUNT",
        discountValue: "10000",
        status: section === "EVENT" ? "DRAFT" : "INACTIVE",
      });
  };

  const updateStatus = async (nextStatus) => {
    if (!selectedEvent) return;
    try {
      const updatedEvent = await updateAdminEventStatus(selectedEvent, nextStatus);
      setRows((current) => current.map((row) => (row.id === updatedEvent.id ? updatedEvent : row)));
      setNotice("이벤트 상태를 변경했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "이벤트 상태를 변경하지 못했습니다."));
    }
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      setNotice(section === "EVENT" ? "이벤트명을 입력해 주세요." : "쿠폰명을 입력해 주세요.");
      return;
    }
    if (!draft.startDate || !draft.endDate) {
      setNotice("운영 기간을 입력해 주세요.");
      return;
    }
    if (hasInvalidDateRange(draft.startDate, draft.endDate)) {
      setNotice("종료 일시는 시작 일시보다 늦어야 합니다.");
      return;
    }
    if (mode === "create" && section === "EVENT" && !uploadFile) {
      setNotice("신규 이벤트 이미지를 첨부해 주세요.");
      return;
    }

    try {
      if (mode === "create") {
        const created =
          section === "EVENT"
            ? await createAdminEvent(draft, uploadFile)
            : await createAdminCoupon(draft);
        const nextRows = await getAdminEvents();
        setRows(nextRows);
        setSelectedEventId(created?.id ?? nextRows.find((row) => row.entityType === section)?.id ?? null);
        setMode("edit");
        setNotice(section === "EVENT" ? "이벤트를 등록했습니다." : "쿠폰을 등록했습니다.");
      } else if (selectedEvent) {
        const updatedEvent = await saveAdminEvent(selectedEvent.id, draft, selectedEvent, uploadFile);
        setRows((current) => current.map((row) => (row.id === updatedEvent.id ? updatedEvent : row)));
        setNotice(selectedEvent.entityType === "COUPON" ? "쿠폰 정보를 저장했습니다." : "이벤트 정보를 저장했습니다.");
      }
      setUploadFile(null);
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, section === "COUPON" ? "쿠폰 저장에 실패했습니다." : "이벤트 저장에 실패했습니다."));
    }
  };

  const startField = splitDateTime(draft.startDate);
  const endField = splitDateTime(draft.endDate);
  const couponDiscountFieldMeta = getCouponDiscountFieldMeta(draft.discountType);

  const handleDelete = async () => {
    if (!selectedEvent || mode === "create") return;
    try {
      if (selectedEvent.entityType === "EVENT") {
        await deleteAdminEvent(selectedEvent.entityNo);
      } else {
        await deleteAdminCoupon(selectedEvent.entityNo);
      }
      const nextRows = await getAdminEvents();
      const nextVisibleRows = nextRows.filter((row) => row.entityType === section);
      setRows(nextRows);
      setSelectedEventId(nextVisibleRows[0]?.id ?? null);
      if (nextVisibleRows[0]) {
        syncDraft(nextVisibleRows[0].id, nextRows);
      } else {
        openCreate();
      }
      setNotice(selectedEvent.entityType === "EVENT" ? "이벤트를 삭제했습니다." : "쿠폰을 삭제했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, section === "COUPON" ? "쿠폰 삭제에 실패했습니다." : "이벤트 삭제에 실패했습니다."));
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section">
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className={section === "EVENT" ? "saas-btn-primary" : "saas-btn-ghost"} onClick={() => setSection("EVENT")}>
              이벤트
            </button>
            <button type="button" className={section === "COUPON" ? "saas-btn-primary" : "saas-btn-ghost"} onClick={() => setSection("COUPON")}>
              쿠폰
            </button>
            <button type="button" className="saas-btn-ghost" onClick={openCreate}>
              신규 등록
            </button>
          </div>
          {isLoading ? <div className="my-empty-inline">이벤트 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={visibleRows.map((row) => ({ ...row, status: row.statusLabel }))}
            getRowKey={(row) => row.id}
            selectedKey={selectedEventId}
            onRowClick={(row) => {
              setSelectedEventId(row.id);
              syncDraft(row.id);
            }}
          />
        </section>

        <aside className="saas-bento-panel">
          <div className="saas-bento-head">
            <strong>{mode === "create" ? `${section === "EVENT" ? "신규 이벤트" : "신규 쿠폰"} 등록` : selectedEvent?.title ?? "이벤트를 선택해 주세요"}</strong>
            {selectedEvent && mode !== "create" ? <p>{selectedEvent.entityType === "COUPON" ? "쿠폰" : "이벤트"} · {selectedEvent.period}</p> : null}
          </div>
          {notice ? <p className="dash-form-notice admin-events-notice">{notice}</p> : null}
          <div className="dash-chips">
            <span className="dash-chip is-accent">노출 {rows.filter((row) => isVisibleStatus(row.status)).length}건</span>
            <span className="dash-chip is-warning">초안 {rows.filter((row) => isDraftStatus(row.status)).length}건</span>
            <span className="dash-chip">숨김 {rows.filter((row) => isHiddenStatus(row.status)).length}건</span>
          </div>
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className="saas-btn-primary" onClick={handleSave}>
              {mode === "create" ? "등록" : "저장"}
            </button>
            <button type="button" className="saas-btn-ghost" onClick={() => updateStatus("ONGOING")} disabled={!selectedEvent || mode === "create"}>
              노출
            </button>
            <button type="button" className="saas-btn-danger" onClick={() => updateStatus("HIDDEN")} disabled={!selectedEvent || mode === "create"}>
              숨김
            </button>
            <button type="button" className="saas-btn-ghost" onClick={handleDelete} disabled={!selectedEvent || mode === "create"}>
              삭제
            </button>
          </div>
          <form className="saas-create-form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="saas-field">
              <span>{selectedEvent?.entityType === "COUPON" ? "쿠폰명" : "이벤트명"}</span>
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            </label>
            {section === "COUPON" ? (
              <>
                <label className="saas-field">
                  <span>할인 방식</span>
                  <select value={draft.discountType} onChange={(event) => setDraft((current) => ({ ...current, discountType: event.target.value }))}>
                    <option value="AMOUNT">정액</option>
                    <option value="PERCENT">정률</option>
                  </select>
                </label>
                <label className="saas-field">
                  <span>할인 값</span>
                  <div className="saas-inline-input">
                    <input
                      type="number"
                      min={couponDiscountFieldMeta.min}
                      max={couponDiscountFieldMeta.max}
                      value={draft.discountValue}
                      onChange={(event) => setDraft((current) => ({ ...current, discountValue: event.target.value }))}
                    />
                    <span className="saas-inline-suffix">{couponDiscountFieldMeta.suffix}</span>
                  </div>
                </label>
              </>
            ) : (
              <label className="saas-field">
                <span>대상</span>
                <select value={draft.targetValue} onChange={(event) => setDraft((current) => ({ ...current, targetValue: event.target.value }))}>
                  {EVENT_TARGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="saas-field">
              <span>시작 일시</span>
              <div className="saas-datetime-row">
                <input
                  type="date"
                  value={startField.date}
                  onChange={(event) => setDraft((current) => ({ ...current, startDate: mergeDateTime(event.target.value, startField.time) }))}
                />
                <input
                  type="time"
                  value={startField.time}
                  onChange={(event) => setDraft((current) => ({ ...current, startDate: mergeDateTime(startField.date, event.target.value) }))}
                />
              </div>
            </label>
            <label className="saas-field">
              <span>종료 일시</span>
              <div className="saas-datetime-row">
                <input
                  type="date"
                  value={endField.date}
                  onChange={(event) => setDraft((current) => ({ ...current, endDate: mergeDateTime(event.target.value, endField.time) }))}
                />
                <input
                  type="time"
                  value={endField.time}
                  onChange={(event) => setDraft((current) => ({ ...current, endDate: mergeDateTime(endField.date, event.target.value) }))}
                />
              </div>
            </label>
            {section === "EVENT" ? (
              <label className="saas-field">
                <span>내용</span>
                <textarea rows={4} value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} />
              </label>
            ) : null}
            {selectedEvent?.entityType === "EVENT" ? (
              <label className="saas-field">
                <span>이벤트 이미지</span>
                <label className="saas-file-picker">
                  <input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />
                  <span className="saas-file-picker-button">파일 선택</span>
                  <span className="saas-file-picker-text">
                    {uploadFile?.name || (selectedEvent.thumbnailUrl ? "기존 이미지 유지 중" : "선택된 파일 없음")}
                  </span>
                </label>
              </label>
            ) : section === "EVENT" && mode === "create" ? (
              <label className="saas-field">
                <span>이벤트 이미지</span>
                <label className="saas-file-picker">
                  <input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />
                  <span className="saas-file-picker-button">파일 선택</span>
                  <span className="saas-file-picker-text">
                    {uploadFile?.name || "선택된 파일 없음"}
                  </span>
                </label>
              </label>
            ) : null}
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
