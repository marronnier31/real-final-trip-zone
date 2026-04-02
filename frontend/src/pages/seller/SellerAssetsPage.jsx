import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import {
  deleteSellerAsset,
  getSellerAssets,
  uploadSellerAsset,
  updateSellerAsset,
} from "../../services/dashboardService";

const columns = [
  { key: "lodging", label: "숙소명" },
  { key: "type", label: "이미지 유형" },
  { key: "order", label: "정렬 순서" },
  { key: "status", label: "노출 상태" },
];

export default function SellerAssetsPage() {
  const [rows, setRows] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const selected = rows.find((row) => row.id === selectedKey) ?? rows[0];

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getSellerAssets();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedKey(nextRows[0]?.id ?? null);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load seller assets.", error);
        setNotice("이미지 목록을 불러오지 못했습니다.");
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

  const updateSelected = async (patch) => {
    if (!selected) return;
    try {
      setIsSubmitting(true);
      const updated = await updateSellerAsset(selected.id, patch);
      const nextRows = await getSellerAssets();
      setRows(nextRows);
      setSelectedKey(updated?.id ?? nextRows[0]?.id ?? null);
      setNotice("대표 이미지를 변경했습니다.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async () => {
    if (!selected?.lodgingId) return;
    if (!uploadFiles.length) {
      setNotice("첨부할 이미지를 선택해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      const nextRows = await uploadSellerAsset(selected.lodgingId, uploadFiles);
      setRows(nextRows);
      setSelectedKey(nextRows.find((row) => row.lodgingId === selected.lodgingId)?.id ?? nextRows[0]?.id ?? null);
      setUploadFiles([]);
      setNotice("이미지를 첨부했습니다.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected?.fileName) return;
    try {
      setIsSubmitting(true);
      const nextRows = await deleteSellerAsset(selected.id);
      setRows(nextRows);
      setSelectedKey(nextRows.find((row) => row.lodgingId === selected.lodgingId)?.id ?? nextRows[0]?.id ?? null);
      setNotice("이미지를 삭제했습니다.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">이미지 운영</p>
          <h1>숙소 이미지 관리</h1>
          <p>대표 {rows.filter((r) => r.type === "대표 이미지").length}개 · 일반 {rows.filter((r) => r.type === "일반 이미지").length}개</p>
          {notice ? <p>{notice}</p> : null}
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          {isLoading ? <div className="my-empty-inline">이미지 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedKey}
            onRowClick={(row) => setSelectedKey(row.id)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.lodging ?? "—"}</h3>
          <p>{selected?.type} · 순서 {selected?.order}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateSelected({ mode: "PRIMARY" })} disabled={!selected || !selected.fileName || isSubmitting}>대표 지정</button>
            <button type="button" className="dash-action-btn is-danger" onClick={handleDelete} disabled={!selected || !selected.fileName || isSubmitting}>이미지 삭제</button>
          </div>
          <div className="dash-create-form-grid seller-assets-upload-grid">
            <label className="dash-field dash-field-wide">
              <span>이미지 첨부</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
              />
              {uploadFiles.length ? <small>새 이미지 {uploadFiles.length}장 선택</small> : null}
            </label>
            <div className="dash-create-form-actions">
              <button type="button" className="dash-action-btn" onClick={handleUpload} disabled={!selected?.lodgingId || !uploadFiles.length || isSubmitting}>
                {isSubmitting ? "처리 중..." : "이미지 첨부"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
