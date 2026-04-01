import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getAdminEvents, saveAdminEvent, updateAdminEventStatus } from "../../services/dashboardService";

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

export default function AdminEventsPage() {
  const [rows, setRows] = useState([]);
  const [section, setSection] = useState("EVENT");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    startDate: "",
    endDate: "",
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
            startDate: nextRows[0].startDate ? nextRows[0].startDate.slice(0, 16) : "",
            endDate: nextRows[0].endDate ? nextRows[0].endDate.slice(0, 16) : "",
          });
        }
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
      startDate: target.startDate ? target.startDate.slice(0, 16) : "",
      endDate: target.endDate ? target.endDate.slice(0, 16) : "",
    });
    setUploadFile(null);
  };

  const updateStatus = async (nextStatus) => {
    if (!selectedEvent) return;
    try {
      const updatedEvent = await updateAdminEventStatus(selectedEvent, nextStatus);
      setRows((current) => current.map((row) => (row.id === updatedEvent.id ? updatedEvent : row)));
      setNotice("이벤트 상태를 변경했습니다.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleSave = async () => {
    if (!selectedEvent) return;
    try {
      const updatedEvent = await saveAdminEvent(selectedEvent.id, draft, selectedEvent, uploadFile);
      setRows((current) => current.map((row) => (row.id === updatedEvent.id ? updatedEvent : row)));
      setUploadFile(null);
      setNotice("이벤트 정보를 저장했습니다.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">이벤트 운영</p>
          <h1>이벤트 · 쿠폰 관리</h1>
          <p>노출 {rows.filter((r) => isVisibleStatus(r.status)).length}건 · 초안 {rows.filter((r) => isDraftStatus(r.status)).length}건 · 숨김 {rows.filter((r) => isHiddenStatus(r.status)).length}건</p>
          {notice ? <p>{notice}</p> : null}
        </div>
      </div>

      <div className="dash-segmented-filter" role="tablist" aria-label="이벤트 쿠폰 구분">
        <button
          type="button"
          className={`dash-segmented-filter-btn${section === "EVENT" ? " is-active" : ""}`}
          onClick={() => setSection("EVENT")}
        >
          이벤트
        </button>
        <button
          type="button"
          className={`dash-segmented-filter-btn${section === "COUPON" ? " is-active" : ""}`}
          onClick={() => setSection("COUPON")}
        >
          쿠폰
        </button>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
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

        <div className="dash-action-sheet">
          <h3>{selectedEvent?.title ?? "—"}</h3>
          <div className="dash-field">
            <span>{selectedEvent?.entityType === "COUPON" ? "쿠폰명" : "이벤트명"}</span>
            <input value={draft.title} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} />
          </div>
          <div className="dash-field">
            <span>내용</span>
            <input value={draft.content} onChange={(e) => setDraft((c) => ({ ...c, content: e.target.value }))} />
          </div>
          <div className="dash-field">
            <span>시작 일시</span>
            <input type="datetime-local" value={draft.startDate} onChange={(e) => setDraft((c) => ({ ...c, startDate: e.target.value }))} />
          </div>
          <div className="dash-field">
            <span>종료 일시</span>
            <input type="datetime-local" value={draft.endDate} onChange={(e) => setDraft((c) => ({ ...c, endDate: e.target.value }))} />
          </div>
          {selectedEvent?.entityType === "EVENT" ? (
            <div className="dash-field dash-field-wide">
              <span>이벤트 이미지</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <small className="dash-field-hint">
                {uploadFile?.name || (selectedEvent.thumbnailUrl ? "기존 이미지 유지 중" : "등록된 이미지 없음")}
              </small>
            </div>
          ) : null}
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={handleSave} disabled={!selectedEvent}>저장</button>
            <button type="button" className="dash-action-btn" onClick={() => updateStatus("ONGOING")} disabled={!selectedEvent}>노출</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("HIDDEN")} disabled={!selectedEvent}>숨김</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
