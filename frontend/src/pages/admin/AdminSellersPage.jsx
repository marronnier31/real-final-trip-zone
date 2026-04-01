import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { deleteAdminSeller, getAdminSellers, updateAdminSellerStatus } from "../../services/dashboardService";

const columns = [
  { key: "business", label: "상호명" },
  { key: "owner", label: "대표자" },
  { key: "status", label: "승인 상태" },
  { key: "region", label: "지역" },
];

export default function AdminSellersPage() {
  const [rows, setRows] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const selectedSeller = rows.find((row) => row.id === selectedSellerId) ?? rows[0];

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getAdminSellers();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedSellerId(nextRows[0]?.id ?? null);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load admin sellers.", error);
        setNotice("판매자 목록을 불러오지 못했습니다.");
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

  const updateStatus = async (nextStatus) => {
    if (!selectedSeller) return;
    try {
      const nextRows = await updateAdminSellerStatus(selectedSeller.id, nextStatus);
      setRows(nextRows);
      setSelectedSellerId(nextRows.find((row) => row.id === selectedSeller.id)?.id ?? nextRows[0]?.id ?? null);
      setNotice("판매자 상태를 변경했습니다.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const removeSeller = async () => {
    if (!selectedSeller) return;
    try {
      const nextRows = await deleteAdminSeller(selectedSeller.id);
      setRows(nextRows);
      setSelectedSellerId(nextRows[0]?.id ?? null);
      setNotice("판매자 신청 이력을 삭제했습니다.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">판매자 운영</p>
          <h1>판매자 관리</h1>
          <p>대기 {rows.filter((r) => r.status === "PENDING").length} · 승인 {rows.filter((r) => r.status === "APPROVED").length} · 중지 {rows.filter((r) => r.status === "SUSPENDED").length}</p>
          {notice ? <p>{notice}</p> : null}
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          {isLoading ? <div className="my-empty-inline">판매자 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedSellerId}
            onRowClick={(row) => setSelectedSellerId(row.id)}
          />
        </section>

        <div className="dash-action-sheet admin-seller-sheet">
          <h3>{selectedSeller?.business ?? "—"}</h3>
          <p>{selectedSeller?.owner} · {selectedSeller?.region}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("ACTIVE")} disabled={!selectedSeller}>복구</button>
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("APPROVED")} disabled={!selectedSeller}>승인</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("REJECTED")} disabled={!selectedSeller}>반려</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("SUSPENDED")} disabled={!selectedSeller}>중지</button>
            <button type="button" className="dash-action-btn is-danger is-subtle" onClick={removeSeller} disabled={!selectedSeller}>삭제</button>
          </div>
          {selectedSeller ? (
            <div className="dash-detail-grid admin-seller-detail-grid">
              <div className="dash-detail-item">
                <span>사업자번호</span>
                <strong>{selectedSeller.businessNo || "-"}</strong>
              </div>
              <div className="dash-detail-item">
                <span>정산 계좌</span>
                <strong>{selectedSeller.account || "-"}</strong>
              </div>
              <div className="dash-detail-item">
                <span>신청일</span>
                <strong>{selectedSeller.submittedAt || "-"}</strong>
              </div>
              <div className="dash-detail-item">
                <span>최근 수정</span>
                <strong>{selectedSeller.updatedAt || "-"}</strong>
              </div>
              {selectedSeller.rejectReason ? (
                <div className="dash-detail-item dash-detail-item-wide">
                  <span>반려 사유</span>
                  <strong>{selectedSeller.rejectReason}</strong>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
