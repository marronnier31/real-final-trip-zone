import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import {
  createSellerRoom,
  deleteSellerRoom,
  getSellerLodgings,
  getSellerRooms,
  updateSellerRoom,
  updateSellerRoomStatus,
} from "../../services/dashboardService";

const columns = [
  { key: "name", label: "객실명" },
  { key: "type", label: "유형" },
  { key: "lodging", label: "숙소명" },
  { key: "status", label: "상태" },
  { key: "capacity", label: "최대 인원" },
  { key: "price", label: "가격" },
];

const INITIAL_FORM = {
  lodgingId: "",
  name: "",
  type: "DOUBLE",
  description: "",
  maxGuestCount: "2",
  pricePerNight: "0",
  roomCount: "1",
  status: "AVAILABLE",
};

function toRoomForm(room) {
  return {
    lodgingId: String(room?.lodgingId ?? ""),
    name: room?.name ?? "",
    type: room?.type ?? "DOUBLE",
    description: room?.description ?? "",
    maxGuestCount: String(room?.maxGuestCount ?? 2),
    pricePerNight: String(room?.pricePerNight ?? 0),
    roomCount: String(room?.roomCount ?? 1),
    status: room?.status ?? "AVAILABLE",
  };
}

function getActionButtonClass({ isActive = false, tone = "" } = {}) {
  return [
    "dash-action-btn",
    tone ? `is-${tone}` : "",
    isActive ? "is-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function SellerRoomsPage() {
  const [rows, setRows] = useState([]);
  const [lodgings, setLodgings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("edit");
  const [form, setForm] = useState(INITIAL_FORM);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;
  const lodgingNameById = useMemo(
    () => Object.fromEntries(lodgings.map((lodging) => [String(lodging.id), lodging.name])),
    [lodgings],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const [nextRows, nextLodgings] = await Promise.all([getSellerRooms(), getSellerLodgings()]);
        if (cancelled) return;
        setRows(nextRows);
        setLodgings(nextLodgings);
        setSelectedId(nextRows[0]?.id ?? null);
        setMode(nextRows[0] ? "edit" : "create");
        setForm(nextRows[0] ? toRoomForm(nextRows[0]) : { ...INITIAL_FORM, lodgingId: String(nextLodgings[0]?.id ?? "") });
        setNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load seller rooms.", error);
        setNotice(error.message || "객실 목록을 불러오지 못했습니다.");
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
    if (mode === "create") {
      setForm((current) => ({
        ...current,
        lodgingId: current.lodgingId || String(lodgings[0]?.id ?? ""),
      }));
      return;
    }

    if (!selected) return;
    setForm(toRoomForm(selected));
  }, [lodgings, mode, selectedId]);

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    try {
      const updated = await updateSellerRoomStatus(selected.id, nextStatus, selected.lodging);
      setRows((prev) => prev.map((row) => (row.id === selected.id ? { ...row, ...updated } : row)));
      setNotice("");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setMode("create");
    setForm({
      ...INITIAL_FORM,
      lodgingId: String(lodgings[0]?.id ?? ""),
    });
    setNotice("");
  };

  const openEdit = () => {
    if (!selected) return;
    setMode("edit");
    setForm(toRoomForm(selected));
    setNotice("");
  };

  const validateForm = () => {
    if (!form.lodgingId) return "숙소를 선택해 주세요.";
    if (!form.name.trim()) return "객실명을 입력해 주세요.";
    if (!form.type.trim()) return "객실 유형을 입력해 주세요.";
    if (Number(form.maxGuestCount) < 1) return "최대 인원은 1명 이상이어야 합니다.";
    if (Number(form.pricePerNight) < 0) return "가격은 0원 이상이어야 합니다.";
    if (Number(form.roomCount) < 1) return "객실 수는 1개 이상이어야 합니다.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextError = validateForm();
    if (nextError) {
      setNotice(nextError);
      return;
    }

    const payload = {
      ...form,
      lodgingName: lodgingNameById[form.lodgingId] ?? "숙소 확인",
    };

    try {
      setIsSubmitting(true);
      if (mode === "create") {
        const created = await createSellerRoom(payload);
        setRows((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setMode("edit");
        setForm(toRoomForm(created));
        setNotice("객실을 등록했습니다.");
      } else if (selected) {
        const updated = await updateSellerRoom(selected.id, payload);
        setRows((prev) => prev.map((row) => (row.id === selected.id ? updated : row)));
        setSelectedId(updated.id);
        setForm(toRoomForm(updated));
        setNotice("객실 정보를 수정했습니다.");
      }
    } catch (error) {
      setNotice(error.message || "객실 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteSellerRoom(selected.id);
      const refreshedRows = await getSellerRooms();
      const refreshed = refreshedRows.find((row) => row.id === selected.id) ?? refreshedRows[0] ?? null;
      setRows(refreshedRows);
      setSelectedId(refreshed?.id ?? null);
      setMode(refreshed ? "edit" : "create");
      setForm(refreshed ? toRoomForm(refreshed) : { ...INITIAL_FORM, lodgingId: String(lodgings[0]?.id ?? "") });
      setNotice("객실을 삭제한 것이 아니라 예약 불가 처리했습니다.");
    } catch (error) {
      setNotice(error.message || "객실 삭제에 실패했습니다.");
    }
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">객실 운영</p>
          <h1>객실 관리</h1>
          <p>
            예약 가능 {rows.filter((r) => r.status === "AVAILABLE").length}개 · 불가{" "}
            {rows.filter((r) => r.status === "UNAVAILABLE").length}개
          </p>
          {notice ? <p>{notice}</p> : null}
        </div>
      </div>

      <div className="dash-table-split dash-table-split-rooms">
        <section className="dash-content-section seller-rooms-table-section" style={{ marginBottom: 0 }}>
          {isLoading ? <div className="my-empty-inline">객실 목록을 불러오는 중입니다.</div> : null}
          {!isLoading && !rows.length ? (
            <div className="my-empty-inline">등록된 객실이 없습니다. 우측 카드에서 첫 객실을 추가하세요.</div>
          ) : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedId}
            onRowClick={(row) => {
              setSelectedId(row.id);
              setMode("edit");
            }}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>
            {mode === "create"
              ? "신규 객실 등록"
              : selected?.name ?? "객실을 선택해 주세요"}
          </h3>
          <p>
            {mode === "create"
              ? "본인 숙소에 객실을 추가하면 즉시 판매자 객실 목록에 반영됩니다."
              : selected
                ? `${selected.lodging} · ${selected.type}`
                : "목록에서 객실을 선택하면 상태 변경과 수정이 가능합니다."}
          </p>

          <div className="dash-action-grid">
            <button
              type="button"
              className={getActionButtonClass({
                tone: "primary",
                isActive: mode !== "create" && selected?.status === "AVAILABLE",
              })}
              aria-pressed={mode !== "create" && selected?.status === "AVAILABLE"}
              onClick={() => updateStatus("AVAILABLE")}
              disabled={!selected || mode === "create"}
            >
              예약 가능
            </button>
            <button
              type="button"
              className={getActionButtonClass({
                tone: "danger",
                isActive: mode !== "create" && selected?.status === "UNAVAILABLE",
              })}
              aria-pressed={mode !== "create" && selected?.status === "UNAVAILABLE"}
              onClick={() => updateStatus("UNAVAILABLE")}
              disabled={!selected || mode === "create"}
            >
              예약 불가
            </button>
            <button type="button" className={getActionButtonClass({ isActive: mode === "create" })} aria-pressed={mode === "create"} onClick={openCreate}>
              객실 등록
            </button>
            <button type="button" className="dash-action-btn" onClick={openEdit} disabled={!selected}>
              폼 초기화
            </button>
            <button type="button" className="dash-action-btn is-danger" onClick={handleDelete} disabled={!selected || mode === "create"}>
              객실 삭제
            </button>
          </div>

          <form className="dash-create-form-grid" onSubmit={handleSubmit}>
            <label className="dash-field">
              <span>숙소</span>
              {mode === "create" ? (
                <select
                  value={form.lodgingId}
                  onChange={(event) => handleChange("lodgingId", event.target.value)}
                >
                  {!lodgings.length ? <option value="">등록된 숙소 없음</option> : null}
                  {lodgings.map((lodging) => (
                    <option key={lodging.id} value={String(lodging.id)}>
                      {lodging.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={lodgingNameById[form.lodgingId] ?? "등록된 숙소 없음"}
                  readOnly
                />
              )}
            </label>
            <label className="dash-field">
              <span>1박 가격</span>
              <input type="number" min="0" value={form.pricePerNight} onChange={(event) => handleChange("pricePerNight", event.target.value)} placeholder="예: 189000" />
            </label>
            <label className="dash-field">
              <span>객실명</span>
              <input value={form.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="예: 오션 디럭스 더블" />
            </label>
            <label className="dash-field">
              <span>객실 유형</span>
              <input value={form.type} onChange={(event) => handleChange("type", event.target.value)} placeholder="DOUBLE" />
            </label>
            <label className="dash-field">
              <span>상태</span>
              <select value={form.status} onChange={(event) => handleChange("status", event.target.value)}>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="UNAVAILABLE">UNAVAILABLE</option>
              </select>
            </label>
            <label className="dash-field">
              <span>최대 인원</span>
              <input type="number" min="1" value={form.maxGuestCount} onChange={(event) => handleChange("maxGuestCount", event.target.value)} />
            </label>
            <label className="dash-field">
              <span>객실 수</span>
              <input type="number" min="1" value={form.roomCount} onChange={(event) => handleChange("roomCount", event.target.value)} />
            </label>
            <label className="dash-field dash-field-wide">
              <span>객실 설명</span>
              <textarea rows={4} value={form.description} onChange={(event) => handleChange("description", event.target.value)} placeholder="객실 특징과 구성, 전망 정보를 입력해 주세요." />
            </label>
            <div className="dash-create-form-actions">
              <button type="submit" className="dash-action-btn is-primary" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : mode === "create" ? "객실 등록 저장" : "객실 수정 저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
