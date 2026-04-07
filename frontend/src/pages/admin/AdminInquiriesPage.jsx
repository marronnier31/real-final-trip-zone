import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { toUserFacingErrorMessage } from "../../lib/appClient";
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
  const threadListRef = useRef(null);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getAdminInquiries();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedId(nextRows[0]?.id ?? null);
        setNotice("");
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

  useEffect(() => {
    setReplyDraft("");
  }, [selectedId]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (!threadListRef.current) return;
      threadListRef.current.scrollTop = threadListRef.current.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selected?.messages, selectedId]);

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    try {
      const updated = await updateAdminInquiryStatus(selected.id, nextStatus);
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setSelectedId(updated.id);
      setNotice("문의 상태를 변경했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "문의 상태를 변경하지 못했습니다."));
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
      setNotice(toUserFacingErrorMessage(error, "문의 답변을 등록하지 못했습니다."));
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section">
          {isLoading ? <div className="my-empty-inline">문의 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedId}
            onRowClick={(row) => setSelectedId(row.id)}
          />
        </section>

        <aside className="saas-bento-panel">
          <div className="saas-bento-head">
            <strong>{selected?.title ?? "문의를 선택해 주세요"}</strong>
            {selected ? <p>{selected.type} · {selected.date} · {selected.owner}</p> : null}
          </div>
          <div className="dash-chips">
            <span className="dash-chip is-warning">접수 {rows.filter((row) => row.status === "OPEN").length}건</span>
            <span className="dash-chip is-accent">답변 완료 {rows.filter((row) => row.status === "ANSWERED").length}건</span>
            <span className="dash-chip">종료 {rows.filter((row) => row.status === "CLOSED").length}건</span>
          </div>
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className="saas-btn-primary" onClick={submitReply} disabled={!selected || isReplying}>
              {isReplying ? "답변 저장 중" : "답변 보내기"}
            </button>
            <button type="button" className="saas-btn-ghost" onClick={() => updateStatus("ANSWERED")} disabled={!selected}>
              답변 완료
            </button>
            <button type="button" className="saas-btn-danger" onClick={() => updateStatus("CLOSED")} disabled={!selected}>
              종료
            </button>
          </div>
          <form className="saas-create-form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="saas-field">
              <span>문의 요약</span>
              <textarea rows={3} value={selected?.summary ?? ""} readOnly />
            </label>
            <div ref={threadListRef} className="inquiry-thread-list admin-inquiry-thread-list">
              {(selected?.messages ?? []).map((message) => (
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
            <label className="saas-field">
              <span>답변 작성</span>
              <textarea
                rows={4}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder="회원 문의에 대한 답변을 입력하세요."
              />
            </label>
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
