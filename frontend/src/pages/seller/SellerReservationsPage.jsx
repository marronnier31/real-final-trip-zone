import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import { getSellerReservations, updateSellerReservationStatus } from "../../services/dashboardService";

const columns = [
  { key: "no", label: "예약번호" },
  { key: "guest", label: "예약자" },
  { key: "lodging", label: "숙소명" },
  { key: "stay", label: "숙박일" },
  { key: "status", label: "상태" },
  { key: "amount", label: "결제금액" },
];

const PAGE_SIZE = 10;
const PAGE_GROUP_SIZE = 10;

export default function SellerReservationsPage() {
  const [rows, setRows] = useState([]);
  const [selectedNo, setSelectedNo] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const selected = rows.find((row) => row.no === selectedNo) ?? rows[0];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentGroup = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE);
  const pageNumbers = useMemo(() => {
    const startPage = currentGroup * PAGE_GROUP_SIZE + 1;
    const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);
    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [currentGroup, totalPages]);
  const pagedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, rows]);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getSellerReservations();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedNo(nextRows[0]?.no ?? null);
        setCurrentPage(1);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load seller reservations.", error);
        setNotice("예약 목록을 불러오지 못했습니다.");
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
    if (!rows.length) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, rows.length, totalPages]);

  useEffect(() => {
    if (!selectedNo) return;
    const selectedIndex = rows.findIndex((row) => row.no === selectedNo);
    if (selectedIndex < 0) return;
    const nextPage = Math.floor(selectedIndex / PAGE_SIZE) + 1;
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  }, [currentPage, rows, selectedNo]);

  const moveToPage = (nextPage) => {
    const safePage = Math.min(Math.max(1, nextPage), totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const nextRow = rows[startIndex] ?? null;

    setCurrentPage(safePage);
    if (nextRow) {
      setSelectedNo(nextRow.no);
    }
  };

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    try {
      const updated = await updateSellerReservationStatus(selected.no, nextStatus);
      setRows((prev) => prev.map((row) => (row.no === selected.no ? { ...row, ...updated } : row)));
      setNotice("");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "예약 상태를 변경하지 못했습니다."));
    }
  };

  return (
    <DashboardLayout role="seller">
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section seller-reservations-table-section">
          {isLoading ? <div className="my-empty-inline">예약 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={pagedRows}
            getRowKey={(row) => row.no}
            selectedKey={selectedNo}
            onRowClick={(row) => setSelectedNo(row.no)}
          />
          <div className="seller-pagination">
            <button
              type="button"
              className="seller-pagination-arrow"
              onClick={() => moveToPage(Math.max(1, currentGroup * PAGE_GROUP_SIZE))}
              disabled={currentGroup === 0}
            >
              이전
            </button>
            <div className="seller-pagination-pages">
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`seller-pagination-page${pageNumber === currentPage ? " is-active" : ""}`}
                  onClick={() => moveToPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="seller-pagination-arrow"
              onClick={() => moveToPage(Math.min(totalPages, (currentGroup + 1) * PAGE_GROUP_SIZE + 1))}
              disabled={pageNumbers[pageNumbers.length - 1] >= totalPages}
            >
              다음
            </button>
          </div>
        </section>

        <aside className="saas-bento-panel">
          <div className="saas-bento-head">
            <strong>{selected?.no ? `예약 ${selected.no}` : "예약을 선택해 주세요."}</strong>
            {selected ? <p>{selected.guest} · {selected.lodging} · {selected.stay}</p> : null}
          </div>
          <div className="dash-chips">
            <span className="dash-chip is-warning">대기 {rows.filter((r) => r.status === "PENDING").length}건</span>
            <span className="dash-chip is-accent">확정 {rows.filter((r) => r.status === "CONFIRMED").length}건</span>
            <span className="dash-chip">취소 {rows.filter((r) => r.status === "CANCELED").length}건</span>
          </div>
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className="saas-btn-primary" onClick={() => updateStatus("CONFIRMED")} disabled={!selected}>확정</button>
            <button type="button" className="saas-btn-ghost" onClick={() => updateStatus("COMPLETED")} disabled={!selected}>완료</button>
            <button type="button" className="saas-btn-danger" onClick={() => updateStatus("CANCELED")} disabled={!selected}>취소</button>
          </div>
          <form className="saas-create-form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="saas-field">
              <span>예약자</span>
              <input value={selected?.guest ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>숙박일</span>
              <input value={selected?.stay ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>숙소명</span>
              <input value={selected?.lodging ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>상태</span>
              <input value={selected?.status ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>결제금액</span>
              <input value={selected?.amount ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>원래 금액</span>
              <input value={selected ? `${selected.originalAmount.toLocaleString()}\uC6D0` : ""} readOnly />
            </label>
            <label className="saas-field">
              <span>최종결제 금액</span>
              <input value={selected ? `${selected.totalPrice.toLocaleString()}\uC6D0` : ""} readOnly />
            </label>
            <label className="saas-field">
              <span>쿠폰 사용</span>
              <input value={selected?.couponUsed ? "사용" : "미사용"} readOnly />
            </label>
            <label className="saas-field">
              <span>마일리지 사용</span>
              <input value={selected?.mileageUsed > 0 ? "사용" : "미사용"} readOnly />
            </label>
            <label className="saas-field">
              <span>요청사항</span>
              <textarea rows={4} value={selected?.requestMessage?.trim() ? selected.requestMessage : "없음"} readOnly />
            </label>
            <label className="saas-field">
              <span>상세 정보</span>
              <textarea rows={4} value={selected?.detail ?? ""} readOnly />
            </label>
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
