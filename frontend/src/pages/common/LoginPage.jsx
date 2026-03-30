import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authProviders, defaultLoginForm, demoLoginAccounts } from "../../data/authData";
import {
  getAuthProviderMark,
  getKakaoAuthUrl,
  getNaverAuthUrl,
  getSelectedAuthProvider,
  loginWithCredentials,
  loginWithGooglePopup,
  loginWithSessionPayload,
} from "../../features/auth/authViewModels";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultLoginForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedProvider = getSelectedAuthProvider(form.provider);
  const canSubmit = form.email.trim() && form.password.trim();

  const commitSession = (payload) => {
    navigate(loginWithSessionPayload(payload));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await loginWithCredentials(form);
      commitSession(session);
    } catch (error) {
      setErrorMessage(error.message || "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerKey) => {
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
      commitSession(session);
    } catch (error) {
      setErrorMessage(error.message || "소셜 로그인에 실패했습니다.");
    }
  };

  return (
    <div className="container page-stack">
      <section className="auth-shell auth-shell-compact auth-shell-login">
        <div className="auth-copy">
          <div
            className="auth-copy-visual"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80)",
            }}
          >
            <div className="auth-copy-overlay">
              <p className="eyebrow">로그인</p>
              <h1>예약 내역과 혜택을 바로 이어서 확인</h1>
              <p>이메일 로그인과 간편 로그인을 같은 화면에서 빠르게 선택할 수 있습니다.</p>
              <div className="auth-copy-points">
                <span>예약 내역 확인</span>
                <span>찜한 숙소 이어보기</span>
                <span>쿠폰/마일리지 확인</span>
              </div>
            </div>
          </div>
        </div>

        <form className="auth-panel auth-panel-strong" onSubmit={handleSubmit}>
          <div className="auth-panel-header">
            <strong>이메일 로그인</strong>
            <span>회원 정보로 바로 로그인</span>
          </div>
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
            <span>비밀번호</span>
            <input
              className="auth-input"
              type="password"
              value={form.password}
              placeholder="비밀번호를 입력하세요"
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          <div className="auth-inline-row">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
              />
              <span>로그인 상태 유지</span>
            </label>
            <div className="auth-links auth-links-tight">
              <Link className="text-link" to="/find-id">
                아이디 찾기
              </Link>
              <Link className="text-link" to="/find-password">
                비밀번호 찾기
              </Link>
            </div>
          </div>

          {errorMessage ? <p className="auth-feedback-message" role="alert">{errorMessage}</p> : null}

          <button className={`primary-button booking-card-button${canSubmit ? "" : " is-disabled"}`} type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>

          <div className="auth-divider">
            <span>간편 로그인</span>
          </div>

          <div className="auth-provider-stack">
            {authProviders
              .filter((provider) => provider.key !== "LOCAL")
              .map((provider) => (
                <button
                  key={provider.key}
                  type="button"
                  className={`auth-provider-line auth-provider-${provider.key.toLowerCase()}${selectedProvider.key === provider.key ? " is-active" : ""}`}
                  onClick={() => handleSocialLogin(provider.key)}
                >
                  <span className="auth-provider-mark" aria-hidden="true">
                    {getAuthProviderMark(provider.key)}
                  </span>
                  <strong>{provider.label}로 계속하기</strong>
                </button>
              ))}
          </div>

          <div className="auth-links">
            <span className="auth-muted">아직 계정이 없나요?</span>
            <Link className="text-link" to="/signup">
              회원가입
            </Link>
          </div>
        </form>

        <aside className="auth-demo-panel auth-demo-panel-side">
          <div className="auth-demo-head">
            <strong>시현 계정</strong>
            <span>배포 전 제거 예정</span>
          </div>
          <p className="auth-demo-copy">개발 확인용 계정이다. 클릭하면 로그인 폼에 자동 입력된다.</p>
          <div className="auth-demo-list">
            {demoLoginAccounts.map((account) => (
              <button
                key={account.key}
                type="button"
                className="auth-demo-account"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    provider: "LOCAL",
                    email: account.email,
                    password: account.password,
                  }))
                }
              >
                <strong>{account.label}</strong>
                <span>{account.email}</span>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
