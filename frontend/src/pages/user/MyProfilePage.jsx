import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { myProfileDetails, myProfileSummary } from "../../data/mypageData";
import { getProfileFieldGroups } from "../../features/mypage/mypageViewModels";
import { clearAuthSession } from "../../utils/authSession";
import { useEffect } from "react";
import { getMyProfileDetails, getMyProfileSummary } from "../../services/mypageService";

export default function MyProfilePage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(myProfileSummary);
  const [details, setDetails] = useState(myProfileDetails);
  const [isLoading, setIsLoading] = useState(true);
  const { accountInfoRows, accountMetaRows } = getProfileFieldGroups(details);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    nextPassword: "",
    confirmPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setIsLoading(true);
        const [nextSummary, nextDetails] = await Promise.all([getMyProfileSummary(), getMyProfileDetails()]);
        if (cancelled) return;
        setSummary(nextSummary);
        setDetails(nextDetails);
      } catch (error) {
        console.error("Failed to load my profile.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePasswordChange = (key, value) => {
    setPasswordForm((current) => ({ ...current, [key]: value }));
  };

  const handlePasswordSave = () => {
    if (!passwordForm.nextPassword.trim()) {
      setPasswordFeedback("새 비밀번호를 입력해 주세요.");
      return;
    }

    if (passwordForm.nextPassword.length < 8) {
      setPasswordFeedback("비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }

    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setPasswordFeedback("비밀번호가 변경되었습니다.");
    setPasswordForm({
      nextPassword: "",
      confirmPassword: "",
    });
    setIsPasswordEditing(false);
  };

  const handleWithdraw = () => {
    const confirmed = window.confirm("회원 탈퇴를 진행하시겠습니까?");
    if (!confirmed) return;
    clearAuthSession();
    navigate("/");
  };

  const handleLogoutAll = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <MyPageLayout>
      <section className="my-list-sheet profile-sheet profile-sheet-v2">
        {isLoading ? (
          <div className="my-empty-panel">
            <strong>회원 정보를 불러오는 중입니다.</strong>
            <p>프로필 요약과 계정 정보를 동기화하고 있습니다.</p>
          </div>
        ) : null}
        <div className="mypage-section-top">
          <strong>내 정보 관리</strong>
        </div>
        <section className="profile-form-section">
          <div className="profile-form-head">
            <div>
              <strong>회원 정보</strong>
              <p>현재 정보 수정은 앱에서 가능해요.</p>
            </div>
          </div>
          <div className="mypage-guide-banner">
            <span>가려진 내 정보를 확인할 수 있어요!</span>
          </div>
          <div className="profile-form-grid">
            {accountInfoRows.map((item) => (
              <div key={item.label} className="profile-form-field">
                <span>{item.label}</span>
                <input value={item.value} readOnly />
              </div>
            ))}
            {accountMetaRows.map((item) => (
              <>
                <div key={item.label} className={`profile-form-field${item.label === "비밀번호" ? " is-password" : ""}`}>
                  <span>{item.label}</span>
                  <div className="profile-form-input-wrap">
                    <input value={item.value} readOnly />
                    {item.label === "비밀번호" ? (
                      <button
                        type="button"
                        className="profile-inline-edit-button"
                        aria-label="비밀번호 변경"
                        onClick={() => {
                          setIsPasswordEditing((current) => !current);
                          setPasswordFeedback("");
                        }}
                      >
                        <span aria-hidden="true">✎</span>
                      </button>
                    ) : null}
                  </div>
                </div>
                {item.label === "비밀번호" && isPasswordEditing ? (
                  <div className="profile-password-panel profile-password-panel-inline">
                    <div className="profile-password-head">
                      <strong>비밀번호 변경</strong>
                      <p>지금은 mock 저장 기준으로 동작하며, 이후 실제 변경 API를 연결할 예정입니다.</p>
                    </div>
                    <div className="profile-password-grid">
                      <label className="profile-form-field">
                        <span>새 비밀번호</span>
                        <input
                          type="password"
                          value={passwordForm.nextPassword}
                          onChange={(event) => handlePasswordChange("nextPassword", event.target.value)}
                          placeholder="8자 이상 입력"
                        />
                      </label>
                      <label className="profile-form-field">
                        <span>비밀번호 확인</span>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
                          placeholder="비밀번호 다시 입력"
                        />
                      </label>
                    </div>
                    <div className="profile-password-actions">
                      <button type="button" className="coupon-action-button" onClick={handlePasswordSave}>변경 저장</button>
                      <button
                        type="button"
                        className="ghost-action-button"
                        onClick={() => {
                          setIsPasswordEditing(false);
                          setPasswordFeedback("");
                          setPasswordForm({ nextPassword: "", confirmPassword: "" });
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ))}
          </div>
        </section>
        <section className="profile-summary-note">
          <span>{summary.status}</span>
          <span>{summary.grade} 등급</span>
          <span>{summary.joinedAt}</span>
          {passwordFeedback ? <span>{passwordFeedback}</span> : null}
        </section>
        <section className="profile-device-strip">
          <div>
            <strong>접속 기기 관리</strong>
            <p>로그인 된 모든 기기에서 로그아웃 돼요.</p>
          </div>
          <button type="button" className="coupon-action-button" onClick={handleLogoutAll}>전체 로그아웃</button>
        </section>
        <section className="profile-exit-row">
          <span>더 이상 TripZone 이용을 원하지 않으신가요?</span>
          <button type="button" className="profile-withdraw-link" onClick={handleWithdraw}>
            회원탈퇴
          </button>
        </section>
      </section>
    </MyPageLayout>
  );
}
