import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import { geocodeAddress } from "../../utils/kakaoAddress";
import {
  createSellerLodging,
  deleteSellerLodging,
  getSellerLodgings,
  updateSellerLodging,
  updateSellerLodgingStatus,
} from "../../services/dashboardService";

const columns = [
  { key: "name", label: "숙소명" },
  { key: "type", label: "유형" },
  { key: "region", label: "지역" },
  { key: "status", label: "상태" },
  { key: "roomCount", label: "객실" },
];

const INITIAL_FORM = {
  name: "",
  type: "HOTEL",
  region: "",
  address: "",
  detailAddress: "",
  zipCode: "",
  latitude: "",
  longitude: "",
  description: "",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  status: "ACTIVE",
  uploadFileNames: [],
};

function toLodgingForm(lodging) {
  return {
    name: lodging?.name ?? "",
    type: lodging?.type ?? "HOTEL",
    region: lodging?.region ?? "",
    address: lodging?.address ?? "",
    detailAddress: lodging?.detailAddress ?? "",
    zipCode: lodging?.zipCode ?? "",
    latitude: lodging?.latitude != null ? String(lodging.latitude) : "",
    longitude: lodging?.longitude != null ? String(lodging.longitude) : "",
    description: lodging?.description ?? "",
    checkInTime: lodging?.checkInTime ?? "15:00",
    checkOutTime: lodging?.checkOutTime ?? "11:00",
    status: lodging?.status ?? "ACTIVE",
    files: [],
    uploadFileNames: lodging?.uploadFileNames ?? [],
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

function hasValidCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

export default function SellerLodgingsPage() {
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("edit");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getSellerLodgings();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedId(nextRows[0]?.id ?? null);
        setMode(nextRows[0] ? "edit" : "create");
        setForm(nextRows[0] ? toLodgingForm(nextRows[0]) : INITIAL_FORM);
        setNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load seller lodgings.", error);
        setRows([]);
        setSelectedId(null);
        setMode("create");
        setForm(INITIAL_FORM);
        setNotice(
          toUserFacingErrorMessage(error, "숙소 목록을 불러오지 못했습니다."),
        );
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
      setForm((current) => ({ ...INITIAL_FORM, status: current.status || "ACTIVE" }));
      return;
    }

    if (!selected) return;
    setForm(toLodgingForm(selected));
  }, [mode, selectedId]);

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    try {
      const updated = await updateSellerLodgingStatus(selected.id, nextStatus);
      setRows((prev) => prev.map((row) => (row.id === selected.id ? updated : row)));
      setSelectedId(updated.id);
      setForm(toLodgingForm(updated));
      setNotice("");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "숙소 상태를 변경하지 못했습니다."));
    }
  };

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setMode("create");
    setForm(INITIAL_FORM);
    setNotice("");
  };

  const handleDelete = async () => {
    if (!selected || mode === "create") return;
    try {
      await deleteSellerLodging(selected.id);
      const refreshedRows = await getSellerLodgings();
      const refreshed = refreshedRows[0] ?? null;
      setRows(refreshedRows);
      setSelectedId(refreshed?.id ?? null);
      setMode(refreshed ? "edit" : "create");
      setForm(refreshed ? toLodgingForm(refreshed) : INITIAL_FORM);
      setNotice("숙소를 삭제했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "숙소 삭제에 실패했습니다."));
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) return "숙소명을 입력해 주세요.";
    if (!form.region.trim()) return "지역을 입력해 주세요.";
    if (!form.address.trim()) return "주소를 입력해 주세요.";
    if (!form.zipCode.trim()) return "우편번호를 입력해 주세요.";
    if (!form.description.trim()) return "숙소 설명을 입력해 주세요.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextError = validateForm();
    if (nextError) {
      setNotice(nextError);
      return;
    }

    try {
      setIsSubmitting(true);
      let nextPayload = { ...form };
      let geocodeWarning = "";

      try {
        const geocoded = await geocodeAddress(form.address);
        nextPayload = {
          ...nextPayload,
          latitude: String(geocoded.latitude),
          longitude: String(geocoded.longitude),
        };
      } catch (error) {
        const fallbackLatitude = String(form.latitude ?? "").trim();
        const fallbackLongitude = String(form.longitude ?? "").trim();
        const canReuseExistingCoordinates =
          mode !== "create" && hasValidCoordinates(fallbackLatitude, fallbackLongitude);

        if (!canReuseExistingCoordinates) {
          throw new Error("주소 좌표를 확인하지 못했습니다. 주소를 다시 확인한 뒤 다시 저장해 주세요.");
        }

        nextPayload = {
          ...nextPayload,
          latitude: fallbackLatitude,
          longitude: fallbackLongitude,
        };
        geocodeWarning = "주소 좌표를 새로 확인하지 못해 기존 위치를 유지했습니다.";
        console.warn("Failed to geocode lodging address.", error);
      }
      setForm(nextPayload);
      if (mode === "create") {
        const created = await createSellerLodging(nextPayload);
        const refreshedRows = await getSellerLodgings();
        const createdWithRooms = refreshedRows.find((row) => row.id === created.id) ?? created;
        setRows(refreshedRows);
        setSelectedId(createdWithRooms.id);
        setMode("edit");
        setForm(toLodgingForm(createdWithRooms));
        setNotice("숙소를 등록했습니다. 객실 가격은 객실 관리에서 입력해 주세요.");
      } else if (selected) {
        const updated = await updateSellerLodging(selected.id, nextPayload);
        const refreshedRows = await getSellerLodgings();
        const refreshed = refreshedRows.find((row) => row.id === updated.id) ?? updated;
        setRows(refreshedRows);
        setSelectedId(updated.id);
        setForm(toLodgingForm(refreshed));
        setNotice("숙소 정보를 수정했습니다.");
      }
    } catch (error) {
      setNotice(error.message || "숙소 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="seller">
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section seller-lodgings-table-section">
          {isLoading ? <div className="my-empty-inline">숙소 목록을 불러오는 중입니다.</div> : null}
          {!isLoading && !rows.length ? (
            <div className="my-empty-inline">아직 등록된 숙소가 없습니다. 우측 폼에서 첫 숙소를 추가하세요.</div>
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

        <aside className="saas-bento-panel">
          <div className="saas-bento-head">
            <strong>{mode === "create" ? "신규 숙소 등록" : selected?.name ?? "숙소를 선택해 주세요"}</strong>
            {selected && mode !== "create" ? <p>{selected.region} · {selected.type}</p> : null}
          </div>

          <div className="saas-form-actions saas-form-actions-start">
            <button
              type="button"
              className="saas-btn-primary"
              onClick={openCreate}
            >
              숙소 등록
            </button>
            <button
              type="button"
              className="saas-btn-primary"
              onClick={() => updateStatus("ACTIVE")}
              disabled={!selected || mode === "create" || selected?.status === "ACTIVE"}
            >
              운영 시작
            </button>
            <button
              type="button"
              className="saas-btn-danger"
              onClick={() => updateStatus("INACTIVE")}
              disabled={!selected || mode === "create" || selected?.status === "INACTIVE"}
            >
              비노출 전환
            </button>
            <button
              type="button"
              className="saas-btn-ghost"
              onClick={handleDelete}
              disabled={!selected || mode === "create"}
            >
              숙소 삭제
            </button>
          </div>

          <form className="saas-create-form-grid" onSubmit={handleSubmit}>
            <label className="saas-field">
              <span>숙소명</span>
              <input value={form.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="예: 한강 브리즈 호텔" />
            </label>
            <label className="saas-field">
              <span>숙소 유형</span>
              <select value={form.type} onChange={(event) => handleChange("type", event.target.value)}>
                <option value="HOTEL">HOTEL</option>
                <option value="PENSION">PENSION</option>
                <option value="GUESTHOUSE">GUESTHOUSE</option>
                <option value="MOTEL">MOTEL</option>
                <option value="RESORT">RESORT</option>
              </select>
            </label>
            <label className="saas-field">
              <span>지역</span>
              <input value={form.region} onChange={(event) => handleChange("region", event.target.value)} placeholder="서울" />
            </label>
            <label className="saas-field">
              <span>우편번호</span>
              <input value={form.zipCode} onChange={(event) => handleChange("zipCode", event.target.value)} placeholder="04524" />
            </label>
            <label className="saas-field">
              <span>기본 주소</span>
              <input value={form.address} onChange={(event) => handleChange("address", event.target.value)} placeholder="서울 중구 세종대로 1" />
            </label>
            <label className="saas-field">
              <span>상세 주소</span>
              <input value={form.detailAddress} onChange={(event) => handleChange("detailAddress", event.target.value)} placeholder="오션타워 8층" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <label className="saas-field">
                <span>체크인</span>
                <input type="time" value={form.checkInTime} onChange={(event) => handleChange("checkInTime", event.target.value)} />
              </label>
              <label className="saas-field">
                <span>체크아웃</span>
                <input type="time" value={form.checkOutTime} onChange={(event) => handleChange("checkOutTime", event.target.value)} />
              </label>
            </div>
            <label className="saas-field">
              <span>숙소 설명</span>
              <textarea rows={4} value={form.description} onChange={(event) => handleChange("description", event.target.value)} placeholder="메인에 노출될 숙소 소개를 입력해 주세요." />
            </label>
            {notice ? <p className="dash-form-notice">{notice}</p> : null}
            <div className="saas-form-actions">
              <button type="submit" className="saas-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : mode === "create" ? "숙소 등록 완료" : "숙소 수정 완료"}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
