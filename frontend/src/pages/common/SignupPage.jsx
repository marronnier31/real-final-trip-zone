import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authProviders, defaultSignupForm } from "../../data/authData";
import {
  getAuthProviderMark,
  getKakaoAuthUrl,
  getNaverAuthUrl,
  loginWithGooglePopup,
  loginWithSessionPayload,
  signupWithCredentials,
} from "../../features/auth/authViewModels";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultSignupForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = form.name.trim() && form.email.trim() && form.phone.trim() && form.password.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await signupWithCredentials({
        ...form,
        phone: form.phone.trim().replace(/[^\d]/g, ""),
      });
      setSuccessMessage("회원가입이 완료되었습니다. 로그인해 주세요.");
      navigate("/login", {
        state: {
          email: form.email.trim(),
          registered: true,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = async (providerKey) => {
    setErrorMessage("");

    try {
      if (providerKey === "KAKAO") {
        window.location.href = getKakaoAuthUrl();
        return;
      }

      if (providerKey === "NAVER") {
        window.location.href = getNaverAuthUrl();
        return;
      }

      const session = await loginWithGooglePopup();
      navigate(loginWithSessionPayload(session));
    } catch (error) {
      setErrorMessage(error.message || "소셜 회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="container page-stack">
      <section className="auth-shell auth-shell-compact">
        <div className="auth-copy">
          <div
            className="auth-copy-visual"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80)",
            }}
          >
            <div className="auth-copy-overlay">
              <p className="eyebrow">회원가입</p>
              <h1>지금 가입하고 국내 숙소 예약을 시작</h1>
              <p>기본 가입 후 권한은 일반회원으로 생성되며, 예약과 결제 흐름을 바로 이어서 이용할 수 있습니다.</p>
              <div className="auth-copy-points">
                <span>일반회원 기본 생성</span>
                <span>쿠폰/혜택 자동 연결</span>
                <span>소셜 로그인 확장 가능</span>
              </div>
            </div>
          </div>
        </div>

        <form className="auth-panel auth-panel-strong" onSubmit={handleSubmit}>
          <div className="auth-panel-header">
            <strong>회원 정보 입력</strong>
            <span>예약에 필요한 정보만 먼저 입력합니다</span>
          </div>

          <label className="auth-field">
            <span>이름</span>
            <input
              className="auth-input"
              value={form.name}
              placeholder="이름을 입력하세요"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label className="auth-field">
            <span>이메일</span>
            <input
              className="auth-input"
              type="email"
              value={form.email}
              placeholder="tripzone@example.com"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label className="auth-field">
            <span>전화번호</span>
            <input
              className="auth-input"
              value={form.phone}
              placeholder="010-1234-5678"
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </label>

          <label className="auth-field">
            <span>비밀번호</span>
            <input
              className="auth-input"
              type="password"
              value={form.password}
              placeholder="8자 이상 입력"
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          <label className="auth-check">
            <input
              type="checkbox"
              checked={form.marketing}
              onChange={(event) => setForm((current) => ({ ...current, marketing: event.target.checked }))}
            />
            <span>혜택 및 특가 알림 수신</span>
          </label>

          {errorMessage ? <p className="auth-feedback-message" role="alert">{errorMessage}</p> : null}
          {successMessage ? <p className="auth-feedback-message is-success">{successMessage}</p> : null}

          <button className={`primary-button booking-card-button${canSubmit ? "" : " is-disabled"}`} type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "가입 중..." : "회원가입"}
          </button>

          <div className="auth-divider">
            <span>간편 회원가입</span>
          </div>

          <div className="auth-provider-stack">
            {authProviders
              .filter((provider) => provider.key !== "LOCAL")
              .map((provider) => (
                <button
                  key={provider.key}
                  type="button"
                  className={`auth-provider-line auth-provider-${provider.key.toLowerCase()}`}
                  onClick={() => handleSocialSignup(provider.key)}
                >
                  <span className="auth-provider-mark" aria-hidden="true">
                    {getAuthProviderMark(provider.key)}
                  </span>
                  <strong>{provider.label}로 가입하기</strong>
                </button>
              ))}
          </div>

          <div className="auth-links">
            <span className="auth-muted">이미 계정이 있나요?</span>
            <Link className="text-link" to="/login">
              로그인
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
