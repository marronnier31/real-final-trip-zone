import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getAdminDashboardViewModel } from "../../features/dashboard/dashboardViewModels";
import { getAdminDashboardSnapshot } from "../../services/dashboardService";

const ADMIN_DASHBOARD_CACHE_KEY = "tripzone-admin-dashboard-snapshot";

function readAdminDashboardCache() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(ADMIN_DASHBOARD_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminDashboardPage() {
  const cachedSnapshot = readAdminDashboardCache();
  const [snapshot, setSnapshot] = useState(
    cachedSnapshot ?? {
      users: [],
      sellers: [],
      adminInquiries: [],
      auditLogs: [],
      adminTasks: [],
    },
  );
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(!cachedSnapshot);
  const vm = getAdminDashboardViewModel(snapshot);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        if (!cachedSnapshot) {
          setIsLoading(true);
        }
        const nextSnapshot = await getAdminDashboardSnapshot();
        if (cancelled) return;
        setSnapshot(nextSnapshot);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            ADMIN_DASHBOARD_CACHE_KEY,
            JSON.stringify(nextSnapshot),
          );
        }
        setNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load admin dashboard snapshot.", error);
        setNotice("관리자 대시보드 데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, []);

  const priorityRows = [...vm.watchRows]
    .sort((a, b) => {
      const score = (item) => {
        if (item.kind === "판매자" && item.status === "PENDING") return 0;
        if (item.kind === "문의" && item.status === "OPEN") return 1;
        if (item.status === "SUSPENDED") return 2;
        return 3;
      };
      return score(a) - score(b);
    })
    .slice(0, 4)
    .map((item) => ({
      ...item,
      label:
        item.kind === "판매자"
          ? item.status === "PENDING"
            ? "판매자 승인"
            : item.status === "SUSPENDED"
              ? "제재 검토"
              : "판매자 상태"
          : "문의 답변",
      actionLabel:
        item.kind === "판매자"
          ? item.status === "PENDING"
            ? "승인 처리"
            : item.status === "SUSPENDED"
              ? "제재 확인"
              : "상태 보기"
          : "문의 처리",
      tone:
        item.status === "PENDING" || item.status === "OPEN"
          ? "warning"
          : item.status === "SUSPENDED"
            ? "danger"
            : "normal",
    }));

  const pendingSellers =
    vm.metrics.find((item) => item.label === "승인 대기 판매자")?.value ?? "00";
  const openInquiries =
    vm.metrics.find((item) => item.label === "미답변 문의")?.value ?? "00";
  const totalUsers =
    vm.metrics.find((item) => item.label === "전체 회원")?.value ?? "00";
  const totalSellers =
    vm.metrics.find((item) => item.label === "전체 판매자")?.value ?? "00";
  const blockedUsers =
    vm.facts.find((item) => item.label === "차단 회원")?.value ?? "00";
  const dormantUsers =
    vm.facts.find((item) => item.label === "휴면 회원")?.value ?? "00";

  const kpiRows = [
    { label: "전체 회원", value: `${totalUsers}명`, tone: "normal" },
    { label: "전체 판매자", value: `${totalSellers}명`, tone: "normal" },
    {
      label: "승인 대기 판매자",
      value: `${pendingSellers}건`,
      tone: Number(pendingSellers) > 0 ? "warning" : "normal",
    },
    {
      label: "미답변 문의",
      value: `${openInquiries}건`,
      tone: Number(openInquiries) > 0 ? "danger" : "normal",
    },
  ];

  const operationRows = [
    {
      title: "승인 대기 판매자",
      value: `${pendingSellers}건`,
      note: "신청서와 사업자 정보 우선 확인",
      tone: Number(pendingSellers) > 0 ? "warning" : "normal",
    },
    {
      title: "미답변 문의",
      value: `${openInquiries}건`,
      note: "운영 문의와 민원성 문의 우선 처리",
      tone: Number(openInquiries) > 0 ? "danger" : "normal",
    },
    {
      title: "위험 회원",
      value: `${blockedUsers}명`,
      note: "차단 회원 상태와 이력 점검",
      tone: Number(blockedUsers) > 0 ? "warning" : "normal",
    },
  ];
  const monthlySales = snapshot.monthlySales ?? [];
  const maxMonthlySales = Math.max(
    ...monthlySales.map((item) => item.salesAmount),
    1,
  );

  return (
    <DashboardLayout role="admin">
      <div className="seller-board">
        {isLoading ? (
          <div className="my-empty-inline">
            관리자 대시보드를 불러오는 중입니다.
          </div>
        ) : null}
        {notice ? <div className="my-empty-inline">{notice}</div> : null}

        <div className="seller-saas-board">
          <div className="saas-header">
            <div className="saas-kpis">
              {kpiRows.map((item) => (
                <div
                  key={item.label}
                  className={`saas-kpi-card tone-${item.tone}`}
                >
                  <div className="kpi-header">
                    <span className="kpi-label">{item.label}</span>
                    {item.tone !== "normal" ? (
                      <span className="kpi-status-dot" aria-label={item.tone} />
                    ) : null}
                  </div>
                  <strong className="kpi-value">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="saas-bento-middle">
            <section className="saas-bento-panel panel-charts">
              <div className="saas-bento-head">
                <strong>월별 매출 흐름 (최근 6개월)</strong>
              </div>
              <div className="saas-chart">
                {monthlySales.map((item) => (
                  <div key={item.monthLabel} className="chart-bar-wrap">
                    <div className="chart-bar-bg">
                      <div
                        className="chart-bar-fill"
                        style={{
                          height: `${Math.max((item.salesAmount / maxMonthlySales) * 100, item.salesAmount > 0 ? 8 : 0)}%`,
                        }}
                      >
                        <span className="chart-value-float">
                          {item.salesAmount > 0
                            ? `${Math.round(item.salesAmount / 10000)}만`
                            : "-"}
                        </span>
                      </div>
                    </div>
                    <span className="chart-month-label">
                      {item.monthLabel.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="saas-bento-bottom">
            <section className="saas-bento-panel panel-tasks">
              <div className="saas-bento-head">
                <strong>운영 루틴</strong>
                <Link to="/admin/inquiries" className="saas-link">
                  업무 전체 보기
                </Link>
              </div>
              <div className="saas-task-list">
                {(vm.checklist ?? []).length
                  ? vm.checklist.slice(0, 4).map((item, index) => (
                      <article
                        key={`${item.title ?? item.label ?? "task"}-${index}`}
                        className="saas-task-row tone-normal"
                      >
                        <div className="task-content">
                          <div className="task-meta">
                            <span className="task-badge">운영 루틴</span>
                          </div>
                          <strong>
                            {item.title ?? item.label ?? "체크리스트 항목"}
                          </strong>
                          <p>
                            {item.description ??
                              item.note ??
                              "운영 루틴을 확인해 주세요."}
                          </p>
                        </div>
                      </article>
                    ))
                  : operationRows.map((item) => (
                      <article
                        key={item.title}
                        className={`saas-task-row tone-${item.tone}`}
                      >
                        <div className="task-content">
                          <div className="task-meta">
                            <span className={`task-badge tone-${item.tone}`}>
                              {item.title}
                            </span>
                          </div>
                          <strong>{item.value}</strong>
                          <p>{item.note}</p>
                        </div>
                      </article>
                    ))}
              </div>
            </section>

            <section className="saas-bento-alerts">
              <div className="saas-bento-head">
                <strong>리스크 회원</strong>
              </div>
              <div className="saas-feed-list">
                {vm.attentionUsers.length ? (
                  vm.attentionUsers.map((item) => (
                    <article
                      key={`${item.name}-${item.email}`}
                      className={`saas-feed-item tone-${item.status === "BLOCKED" ? "danger" : "warning"}`}
                    >
                      <div className="feed-info">
                        <span className="feed-title">{item.name}</span>
                        <p className="feed-note">
                          {item.role} · {item.email}
                        </p>
                      </div>
                      <strong className="feed-val">
                        {item.status === "BLOCKED" ? "차단" : "휴면"}
                      </strong>
                    </article>
                  ))
                ) : (
                  <div className="saas-empty">
                    지금 확인할 위험 회원이 없습니다.
                  </div>
                )}
              </div>
            </section>

            <section className="saas-bento-panel panel-lodgings">
              <div className="saas-bento-head">
                <strong>관리 메뉴 바로가기</strong>
              </div>
              <div className="saas-lodging-list">
                {vm.header.links.map((item) => (
                  <article
                    key={item.to}
                    className="saas-lodging-row tone-normal"
                  >
                    <div className="lodging-content">
                      <strong>{item.label}</strong>
                      <div className="lodging-meta">
                        <span>관리자 메뉴</span>
                        <span>{item.to}</span>
                      </div>
                    </div>
                    <Link to={item.to} className="saas-btn-ghost">
                      바로 이동
                    </Link>
                  </article>
                ))}
                <article className="saas-lodging-row tone-normal">
                  <div className="lodging-content">
                    <strong>휴면 회원</strong>
                    <div className="lodging-meta">
                      <span>회원 상태 점검</span>
                      <span>{dormantUsers}명</span>
                    </div>
                  </div>
                  <Link to="/admin/users" className="saas-btn-ghost">
                    회원 관리
                  </Link>
                </article>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
