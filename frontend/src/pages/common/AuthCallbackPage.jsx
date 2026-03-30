import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithSessionPayload, loginWithSocialCode } from "../../features/auth/authViewModels";

function getProviderFromPath(pathname) {
  if (pathname.includes("/auth/kakao/")) return "KAKAO";
  if (pathname.includes("/auth/naver/")) return "NAVER";
  return null;
}

export default function AuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const provider = useMemo(() => getProviderFromPath(location.pathname), [location.pathname]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (!provider) {
      setErrorMessage("지원하지 않는 소셜 로그인 경로입니다.");
      return;
    }

    if (error) {
      setErrorMessage("소셜 로그인 인증이 취소되었거나 실패했습니다.");
      return;
    }

    if (!code) {
      setErrorMessage("인가 코드가 없습니다.");
      return;
    }

    if (provider === "NAVER") {
      const savedState = window.sessionStorage.getItem("tripzone-naver-state");
      if (!state || !savedState || state !== savedState) {
        setErrorMessage("네이버 로그인 state 검증에 실패했습니다.");
        return;
      }
      window.sessionStorage.removeItem("tripzone-naver-state");
    }

    let cancelled = false;

    async function run() {
      try {
        const session = await loginWithSocialCode(provider, code, state);
        if (cancelled) return;
        navigate(loginWithSessionPayload(session), { replace: true });
      } catch (nextError) {
        if (cancelled) return;
        setErrorMessage(nextError.message || "소셜 로그인 처리에 실패했습니다.");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate, provider]);

  return (
    <div className="container page-stack">
      <section className="auth-shell auth-shell-compact">
        <div className="auth-panel auth-panel-strong">
          <div className="auth-panel-header">
            <strong>{provider ?? "소셜"} 로그인 처리 중</strong>
            <span>백엔드 인증 결과를 확인하고 있습니다.</span>
          </div>
          {errorMessage ? <p className="auth-feedback-message" role="alert">{errorMessage}</p> : null}
          {!errorMessage ? <p className="auth-feedback-message">잠시만 기다려 주세요.</p> : null}
        </div>
      </section>
    </div>
  );
}
