import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  getSellerApplicationDraft,
  getSellerApplicationSteps,
  getSellerApplicationTemplate,
  submitSellerApplication,
} from "../../services/dashboardService";

function getStatusLabel(status) {
  if (status === "READY") return "신청 전";
  if (status === "PENDING") return "승인 대기";
  if (status === "APPROVED") return "승인 완료";
  if (status === "REJECTED") return "반려";
  if (status === "SUSPENDED") return "중지";
  return status;
}

function formatSubmittedAt(value) {
  if (!value) return "아직 제출 전";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MySellerApplyPage() {
  const [status, setStatus] = useState("READY");
  const [submittedAt, setSubmittedAt] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    businessNo: "",
    businessName: "",
    owner: "",
    account: "",
  });
  const sellerApplicationStatus = getSellerApplicationTemplate();
  const sellerApplicationSteps = getSellerApplicationSteps();
  const statusToneClass =
    status === "APPROVED"
      ? "is-approved"
      : status === "REJECTED"
        ? "is-rejected"
        : status === "SUSPENDED"
          ? "is-suspended"
          : "is-pending";

  useEffect(() => {
    let cancelled = false;

    async function loadDraft() {
      try {
        setIsLoading(true);
        const initialDraft = await getSellerApplicationDraft();
        if (cancelled) return;
        setStatus(initialDraft?.status ?? "READY");
        setSubmittedAt(initialDraft?.submittedAt ?? null);
        setForm({
          businessNo: initialDraft?.businessNo ?? "",
          businessName: initialDraft?.businessName ?? "",
          owner: initialDraft?.owner ?? "",
          account: initialDraft?.account ?? "",
        });
      } catch (loadError) {
        if (cancelled) return;
        console.error("Failed to load seller application draft.", loadError);
        setError("호스트 신청 상태를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateForm = () => {
    if (!form.businessNo.trim()) return "사업자번호를 입력해 주세요.";
    if (!form.businessName.trim()) return "상호명을 입력해 주세요.";
    if (!form.owner.trim()) return "대표자명을 입력해 주세요.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextError = validateForm();
    if (nextError) {
      setError(nextError);
      setNotice("");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const nextDraft = await submitSellerApplication(form);
      setStatus(nextDraft?.status ?? "READY");
      setSubmittedAt(nextDraft?.submittedAt ?? null);
      setNotice("호스트 신청서를 제출했습니다.");
    } catch (submitError) {
      console.error("Failed to submit seller application.", submitError);
      setError(submitError.message || "호스트 신청서를 제출하지 못했습니다.");
      setNotice("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MyPageLayout>
        <form className="my-form-sheet" onSubmit={handleSubmit} noValidate>
          <div className="mypage-header-row">
            <div className="mypage-header-copy">
              <strong>호스트 신청</strong>
              <p>사업자 정보를 제출하고 승인 결과를 이 화면에서 바로 확인합니다.</p>
            </div>
          </div>

          <section className="seller-apply-hero">
            <div className="seller-apply-hero-copy">
              <span className="seller-apply-eyebrow">Seller Onboarding</span>
              <strong>{getStatusLabel(status)} 상태입니다.</strong>
              <p>
                {status === "SUSPENDED"
                  ? "현재 판매자 기능이 중지된 상태입니다. 상세 사유는 관리자에게 확인해 주세요."
                  : "신청 후 승인 전까지는 일반회원 흐름을 유지하고, 승인 완료 시 판매자센터 기능이 열립니다."}
              </p>
            </div>
            <div className={`seller-apply-status-card ${statusToneClass}`}>
              <span>현재 상태</span>
              <strong>{getStatusLabel(status)}</strong>
              <p>마지막 제출 {formatSubmittedAt(submittedAt)}</p>
            </div>
          </section>

          <section className="seller-apply-glance-grid" aria-label="판매자 신청 요약">
            {sellerApplicationStatus.map((item) => (
              <article key={item.label} className="seller-apply-glance-card">
                <span>{item.label}</span>
                <strong>{item.label === "현재 상태" ? getStatusLabel(status) : item.display ?? item.value}</strong>
              </article>
            ))}
          </section>

          <section className="seller-apply-grid">
            <div className="seller-apply-panel">
              <div className="mypage-subsection-head">
                <strong>신청 절차</strong>
                <span>사업자 정보 제출 후 관리자 승인</span>
              </div>
              <div className="seller-apply-step-list">
                {sellerApplicationSteps.map((item, index) => (
                  <div key={item} className="seller-apply-step-item">
                    <span className="seller-apply-step-no">{index + 1}</span>
                    <div>
                      <strong>{item}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="seller-apply-note-list">
                <article className="seller-apply-note-card">
                  <span>심사 기준</span>
                  <strong>사업자 정보 일치 여부와 제출 상태</strong>
                </article>
                <article className="seller-apply-note-card">
                  <span>확인 위치</span>
                  <strong>마이페이지와 헤더 메뉴에서 상태 확인</strong>
                </article>
              </div>
            </div>

            <div className="seller-apply-panel">
              <div className="mypage-subsection-head">
                <strong>신청서 작성</strong>
                <span>현재 백엔드가 지원하는 사업자 정보만 먼저 제출합니다.</span>
              </div>

              <div className="profile-summary-note">
                {isLoading ? <span>호스트 신청 상태를 불러오는 중입니다.</span> : null}
                <span>현재 상태: {getStatusLabel(status)}</span>
                <span>마지막 제출: {formatSubmittedAt(submittedAt)}</span>
                <span>정산 계좌는 승인 후 별도 운영 절차에서 관리합니다.</span>
                {notice ? <span>{notice}</span> : null}
                {error ? <span>{error}</span> : null}
              </div>

              <div className="seller-apply-form-grid">
                <label className="field-block seller-apply-field">
                  <span>사업자번호</span>
                  <input value={form.businessNo} onChange={(e) => handleChange("businessNo", e.target.value)} placeholder="123-45-67890" />
                </label>
                <label className="field-block seller-apply-field">
                  <span>상호명</span>
                  <input value={form.businessName} onChange={(e) => handleChange("businessName", e.target.value)} placeholder="TripZone Stay" />
                </label>
                <label className="field-block seller-apply-field">
                  <span>대표자명</span>
                  <input value={form.owner} onChange={(e) => handleChange("owner", e.target.value)} placeholder="대표자 이름" />
                </label>
                <label className="field-block seller-apply-field">
                  <span>정산 계좌</span>
                  <input value={form.account} onChange={(e) => handleChange("account", e.target.value)} placeholder="승인 후 별도 관리" />
                </label>
              </div>

              <div className="seller-apply-action-bar">
                <button type="submit" className="coupon-action-button inquiry-submit-link" disabled={isSubmitting || status === "SUSPENDED"}>
                  {isSubmitting ? "제출 중..." : "신청 제출"}
                </button>
                <Link className="text-link" to="/my/profile">내 정보 관리</Link>
              </div>
            </div>
          </section>
        </form>
    </MyPageLayout>
  );
}
