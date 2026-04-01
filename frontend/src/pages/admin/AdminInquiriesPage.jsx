import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getAdminInquiries, replyAdminInquiry, updateAdminInquiryStatus } from "../../services/dashboardService";

const columns = [
  { key: "title", label: "제목" },
  { key: "type", label: "유형" },
  { key: "status", label: "상태" },
  { key: "date", label: "접수일" },
];

export default function AdminInquiriesPage() {
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [replyDraft, setReplyDraft] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getAdminInquiries();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedId(nextRows[0]?.id ?? null);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load admin inquiries.", error);
        setNotice("관리자 문의 목록을 불러오지 못했습니다.");
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
    if (!selected) return;
    try {
      const updated = await updateAdminInquiryStatus(selected.id, nextStatus);
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setSelectedId(updated.id);
      setNotice("문의 상태를 변경했습니다.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const submitReply = async () => {
    if (!selected || isReplying) return;
    try {
      setIsReplying(true);
      const updated = await replyAdminInquiry(selected.id, replyDraft);
      if (updated) {
        setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        setSelectedId(updated.id);
      }
      setReplyDraft("");
      setNotice("문의 답변을 등록했습니다.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">문의 운영</p>
          <h1>상세 문의 관리</h1>
          <p>접수 {rows.filter((r) => r.status === "OPEN").length} · 답변완료 {rows.filter((r) => r.status === "ANSWERED").length} · 종료 {rows.filter((r) => r.status === "CLOSED").length}</p>
          {notice ? <p>{notice}</p> : null}
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          {isLoading ? <div className="my-empty-inline">문의 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedId}
            onRowClick={(row) => setSelectedId(row.id)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.title ?? "—"}</h3>
          <p>{selected?.type} · {selected?.date} · {selected?.owner}</p>
          <p>{selected?.summary}</p>
          <div className="inquiry-thread-list" style={{ marginTop: 20 }}>
            {selected?.messages?.map((message) => (
              <article
                key={`${selected?.id}-${message.id}`}
                className={`inquiry-message${message.sender === "회원" ? " is-user" : " is-operator"}`}
              >
                <div className="inquiry-message-head">
                  <strong>{message.sender}</strong>
                  <span>{message.time}</span>
                </div>
                <p>{message.body}</p>
              </article>
            ))}
          </div>
          <div className="my-form-card" style={{ marginTop: 20 }}>
            <label className="my-form-field" htmlFor="admin-inquiry-reply">
              <span>답변 작성</span>
              <textarea
                id="admin-inquiry-reply"
                rows={4}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder="회원 문의에 대한 답변을 입력하세요."
              />
            </label>
          </div>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={submitReply} disabled={!selected || isReplying}>
              {isReplying ? "답변 저장 중" : "답변 보내기"}
            </button>
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("ANSWERED")} disabled={!selected}>답변 완료</button>
            <button type="button" className="dash-action-btn" onClick={() => updateStatus("CLOSED")} disabled={!selected}>종료</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
