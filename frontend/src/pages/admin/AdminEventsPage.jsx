import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import {
  createAdminCoupon,
  createAdminEvent,
  deleteAdminCoupon,
  deleteAdminEvent,
  getAdminEventDetail,
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

export default function AdminEventsPage() {
  const [rows, setRows] = useState([]);
  const [section, setSection] = useState("EVENT");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [mode, setMode] = useState("edit");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedCouponNo, setSelectedCouponNo] = useState("");
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    startDate: "",
    endDate: "",
    discountType: "AMOUNT",
    discountValue: "10000",
    status: "DRAFT",
    coupons: [],
  });
  const visibleRows = rows.filter((row) => row.entityType === section);
  const couponRows = rows.filter((row) => row.entityType === "COUPON");
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
            discountType: nextRows[0].discountType ?? "AMOUNT",
            discountValue: String(nextRows[0].discountValue ?? 10000),
            status: nextRows[0].status ?? "DRAFT",
            coupons: [],
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

  const syncDraft = async (eventId, sourceRows = rows) => {
    const target = sourceRows.find((row) => row.id === eventId);
    if (!target) return;
    let nextCoupons = [];
    if (target.entityType === "EVENT") {
      try {
        const detail = await getAdminEventDetail(target.entityNo);
        nextCoupons = (detail.couponNames ?? [])
          .map((couponName) => sourceRows.find((row) => row.entityType === "COUPON" && row.title === couponName)?.entityNo)
          .filter((couponNo) => couponNo != null);
      } catch (error) {
        console.error("Failed to load admin event detail.", error);
      }
    }
    setDraft({
      title: target.title,
      content: target.content ?? "",
      startDate: target.startDate ? target.startDate.slice(0, 16) : "",
      endDate: target.endDate ? target.endDate.slice(0, 16) : "",
      discountType: target.discountType ?? "AMOUNT",
      discountValue: String(target.discountValue ?? 10000),
      status: target.status ?? "DRAFT",
      coupons: nextCoupons,
    });
    setUploadFile(null);
    setSelectedCouponNo("");
    setMode("edit");
  };

  const openCreate = () => {
    setMode("create");
    setSelectedEventId(null);
    setUploadFile(null);
    setDraft({
      title: "",
      content: "",
      startDate: "",
      endDate: "",
      discountType: "AMOUNT",
      discountValue: "10000",
      status: section === "EVENT" ? "DRAFT" : "INACTIVE",
      coupons: [],
    });
    setSelectedCouponNo("");
  };

  const handleCouponAdd = () => {
    const couponNo = Number(selectedCouponNo);
    if (!couponNo) return;
    setDraft((current) => ({
      ...current,
      coupons: current.coupons.includes(couponNo) ? current.coupons : [...current.coupons, couponNo],
    }));
    setSelectedCouponNo("");
  };

  const handleCouponRemove = (couponNo) => {
    setDraft((current) => ({
      ...current,
      coupons: current.coupons.filter((item) => item !== couponNo),
    }));
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
        setNotice("이벤트 정보를 저장했습니다.");
      }
      setUploadFile(null);
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, section === "COUPON" ? "쿠폰 저장에 실패했습니다." : "이벤트 저장에 실패했습니다."));
    }
  };

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
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
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
                    <option value="RATE">정률</option>
                  </select>
                </label>
                <label className="saas-field">
                  <span>할인 값</span>
                  <input type="number" min="0" value={draft.discountValue} onChange={(event) => setDraft((current) => ({ ...current, discountValue: event.target.value }))} />
                </label>
              </>
            ) : (
              <label className="saas-field">
                <span>대상</span>
                <div className="admin-event-coupon-picker">
                  <select value={selectedCouponNo} onChange={(event) => setSelectedCouponNo(event.target.value)}>
                    <option value="">쿠폰을 선택하세요</option>
                    {couponRows.map((coupon) => (
                      <option key={coupon.id} value={coupon.entityNo}>
                        {coupon.title}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="saas-btn-ghost" onClick={handleCouponAdd} disabled={!selectedCouponNo}>
                    추가
                  </button>
                </div>
                <div className="admin-event-coupon-list">
                  {draft.coupons.length ? (
                    draft.coupons.map((couponNo) => {
                      const coupon = couponRows.find((item) => Number(item.entityNo) === Number(couponNo));
                      return (
                        <button
                          key={couponNo}
                          type="button"
                          className="admin-event-coupon-chip"
                          onClick={() => handleCouponRemove(couponNo)}
                        >
                          {coupon?.title ?? `쿠폰 ${couponNo}`} ×
                        </button>
                      );
                    })
                  ) : (
                    <span className="admin-event-coupon-empty">선택된 쿠폰이 없습니다.</span>
                  )}
                </div>
              </label>
            )}
            <label className="saas-field">
              <span>시작 일시</span>
              <input type="datetime-local" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} />
            </label>
            <label className="saas-field">
              <span>종료 일시</span>
              <input type="datetime-local" value={draft.endDate} onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))} />
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
