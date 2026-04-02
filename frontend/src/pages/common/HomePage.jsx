import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { homeSearchDefaults, promoBanners } from "../../data/homeData";
import { DateRangePopover, GuestPopover, SuggestionsPanel } from "../../features/home/HomeSearchPanels";
import { HomeCollectionSection, HomePromoSection } from "../../features/home/HomeSections";
import { SEARCH_TABS, SUGGESTION_ICON } from "../../features/home/homeConstants";
import { buildCollectionCards, formatDateSummary, parseISO, toISO } from "../../features/home/homeUtils";
import {
  buildHomeSuggestionItems,
  filterHomeSuggestions,
  readRecentSearches,
  writeRecentSearches,
} from "../../features/home/homeViewModel";
import { getCachedLodgingsSnapshot, getLodgingCollections, getLodgings, getSearchSuggestionItems, subscribeLodgingsInvalidated } from "../../services/lodgingService";

export default function HomePage() {
  const cachedLodgings = getCachedLodgingsSnapshot();
  const cachedCollections = cachedLodgings.length ? [
    {
      title: "이번 주말 예약 가능한 부산 숙소",
      region: "부산",
      ids: cachedLodgings.filter((item) => item.region === "부산").map((item) => item.id).slice(0, 4),
    },
    {
      title: "제주 감도 높은 스테이",
      region: "제주",
      ids: cachedLodgings.filter((item) => item.region === "제주").map((item) => item.id).slice(0, 4),
    },
    {
      title: "지금 둘러보기 좋은 숙소",
      region: cachedLodgings[0]?.region ?? "국내",
      ids: cachedLodgings.map((item) => item.id).slice(0, 4),
    },
  ].filter((collection) => collection.ids.length) : [];
  const navigate = useNavigate();
  const searchShellRef = useRef(null);
  const keywordRef = useRef(null);
  const dateRef = useRef(null);
  const guestsRef = useRef(null);
  const suggestPanelRef = useRef(null);
  const calendarPanelRef = useRef(null);
  const guestPanelRef = useRef(null);
  const [searchForm, setSearchForm] = useState(homeSearchDefaults);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [activeSuggest, setActiveSuggest] = useState(0);
  const [activeTab, setActiveTab] = useState("domestic");
  const [visibleMonth, setVisibleMonth] = useState(parseISO(homeSearchDefaults.checkIn) ?? new Date());
  const [lodgings, setLodgings] = useState(cachedLodgings);
  const [lodgingCollections, setLodgingCollections] = useState(cachedCollections);
  const [searchSuggestionItems, setSearchSuggestionItems] = useState([]);
  const currentTab = SEARCH_TABS.find((tab) => tab.key === activeTab) ?? SEARCH_TABS[0];

  const allSuggestionItems = useMemo(
    () => buildHomeSuggestionItems(lodgings, searchSuggestionItems),
    [lodgings, searchSuggestionItems],
  );
  const heroStats = useMemo(() => {
    const availableLodgings = lodgings.length;
    const weekendDeals = lodgings.filter((lodging) => Number(String(lodging.price ?? "").replace(/[^\d]/g, "")) <= 180000).length;
    const instantRooms = lodgings.reduce((sum, lodging) => {
      return sum + (lodging.rooms ?? []).filter((room) => room.status === "AVAILABLE").length;
    }, 0);

    return [
      { label: "오늘 확인 가능한 숙소", value: `${availableLodgings}+` },
      { label: "이번 주말 특가", value: String(weekendDeals) },
      { label: "즉시 확정 객실", value: String(instantRooms) },
    ];
  }, [lodgings]);

  const filteredSuggestions = useMemo(() => filterHomeSuggestions(allSuggestionItems, searchForm.keyword), [allSuggestionItems, searchForm.keyword]);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      try {
        const nextLodgings = await getLodgings();
        const [nextCollections, nextSuggestions] = await Promise.all([
          getLodgingCollections(nextLodgings),
          getSearchSuggestionItems(nextLodgings),
        ]);

        if (cancelled) return;
        setLodgings(nextLodgings);
        setLodgingCollections(nextCollections);
        setSearchSuggestionItems(nextSuggestions);
      } catch (error) {
        console.error("Failed to load home lodging data.", error);
      }
    }

    loadHomeData();

    const unsubscribe = subscribeLodgingsInvalidated(() => {
      loadHomeData();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setActiveSuggest(0);
  }, [searchForm.keyword]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        searchShellRef.current &&
        !searchShellRef.current.contains(event.target) &&
        (!suggestPanelRef.current || !suggestPanelRef.current.contains(event.target)) &&
        (!calendarPanelRef.current || !calendarPanelRef.current.contains(event.target)) &&
        (!guestPanelRef.current || !guestPanelRef.current.contains(event.target))
      ) {
        setActivePanel(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchForm.keyword.trim()) params.set("keyword", searchForm.keyword.trim());
    if (searchForm.checkIn) params.set("checkIn", searchForm.checkIn);
    if (searchForm.checkOut) params.set("checkOut", searchForm.checkOut);
    if (searchForm.guests) params.set("guests", searchForm.guests);
    if (activeTab !== "domestic") params.set("tab", activeTab);
    if (searchForm.keyword.trim()) {
      const nextRecent = writeRecentSearches(searchForm.keyword, recentSearches);
      setRecentSearches(nextRecent);
    }
    navigate(`/lodgings?${params.toString()}`);
  };

  const handleDatePick = (day) => {
    const picked = toISO(day);

    if (!searchForm.checkIn || searchForm.checkOut) {
      setSearchForm((current) => ({ ...current, checkIn: picked, checkOut: "" }));
      return;
    }

    if (picked <= searchForm.checkIn) {
      setSearchForm((current) => ({ ...current, checkIn: picked, checkOut: "" }));
      return;
    }

    setSearchForm((current) => ({ ...current, checkOut: picked }));
    setActivePanel(null);
  };

  const handleKeywordKeyDown = (event) => {
    if (activePanel !== "keyword" || !filteredSuggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggest((current) => (current + 1) % filteredSuggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggest((current) => (current - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const picked = filteredSuggestions[activeSuggest];
      if (!picked) return;
      setSearchForm((current) => ({ ...current, keyword: picked.label }));
      setActivePanel(null);
    }

    if (event.key === "Escape") {
      setActivePanel(null);
    }
  };

  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="home-hero-backdrop" />
        <div className="home-hero-overlay" />
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <div className="home-hero-brand">국내 숙소 예약</div>
            <h1>오늘 갈 곳을 빠르게 정하고 바로 예약하세요</h1>
            <div className="hero-actions">
              <Link className="primary-button" to="/lodgings">
                숙소 검색하기
              </Link>
              <Link className="secondary-button hero-secondary" to="/events">
                오늘 특가 보기
              </Link>
            </div>
            <div className="hero-stat-row">
              {heroStats.map((item) => (
                <div key={item.label} className="hero-stat-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <form
            ref={searchShellRef}
            className="search-panel search-panel-classic search-panel-showcase"
            onSubmit={handleSearchSubmit}
          >
            <div className="search-panel-ambient" aria-hidden="true">
              <span className="search-panel-accent search-panel-accent-warm" />
              <span className="search-panel-accent search-panel-accent-cool" />
            </div>
            <div className="search-classic-stack">
              <label
                ref={keywordRef}
                className={`search-field search-field-button search-field-keyword${activePanel === "keyword" ? " is-active" : ""}`}
              >
                <span>숙소 검색</span>
                <input
                  className="search-input"
                  value={searchForm.keyword}
                  placeholder={currentTab.placeholder}
                  onFocus={() => setActivePanel("keyword")}
                  onKeyDown={handleKeywordKeyDown}
                  onChange={(event) => {
                    setSearchForm((current) => ({ ...current, keyword: event.target.value }));
                    setActivePanel("keyword");
                  }}
                />
              </label>

              <button
                ref={dateRef}
                type="button"
                className={`search-field search-field-button${activePanel === "date" ? " is-active" : ""}`}
                onClick={() => {
                  setVisibleMonth(parseISO(searchForm.checkIn) ?? new Date());
                  setActivePanel((current) => (current === "date" ? null : "date"));
                }}
              >
                <span>체크인 / 체크아웃</span>
                <strong>{formatDateSummary(searchForm.checkIn, searchForm.checkOut)}</strong>
              </button>

              <button
                ref={guestsRef}
                type="button"
                className={`search-field search-field-button${activePanel === "guests" ? " is-active" : ""}`}
                onClick={() => setActivePanel((current) => (current === "guests" ? null : "guests"))}
              >
                <span>인원</span>
                <strong>성인 {searchForm.guests}명 · 객실 1개</strong>
              </button>
            </div>

            <button className="primary-button search-submit" type="submit">
              조건으로 숙소 찾기
            </button>
          </form>

          <SuggestionsPanel
            open={activePanel === "keyword"}
            anchorRef={keywordRef}
            panelRef={suggestPanelRef}
            recentSearches={recentSearches}
            filteredSuggestions={filteredSuggestions}
            keyword={searchForm.keyword}
            suggestionIcon={SUGGESTION_ICON}
            activeSuggest={activeSuggest}
            onHoverSuggestion={setActiveSuggest}
            onPickRecent={(item) => {
              setSearchForm((current) => ({ ...current, keyword: item }));
              setActivePanel(null);
            }}
            onPickSuggestion={(item) => {
              setSearchForm((current) => ({ ...current, keyword: item.label }));
              setActivePanel(null);
            }}
          />

          <DateRangePopover
            open={activePanel === "date"}
            anchorRef={dateRef}
            panelRef={calendarPanelRef}
            visibleMonth={visibleMonth}
            setVisibleMonth={setVisibleMonth}
            checkIn={searchForm.checkIn}
            checkOut={searchForm.checkOut}
            onPick={handleDatePick}
            onClose={() => setActivePanel(null)}
          />

          <GuestPopover
            open={activePanel === "guests"}
            anchorRef={guestsRef}
            panelRef={guestPanelRef}
            guests={searchForm.guests}
            onChange={(next) => setSearchForm((current) => ({ ...current, guests: next }))}
            onClose={() => setActivePanel(null)}
          />
        </div>
      </section>

      <div className="container home-content">
        <HomePromoSection promoBanners={promoBanners} />

        {!lodgingCollections.length ? (
          <section className="home-section">
            <div className="home-section-head">
              <h2>추천 숙소</h2>
            </div>
            <div className="home-skeleton-grid" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="home-skeleton-card">
                  <div className="home-skeleton-visual" />
                  <div className="home-skeleton-line home-skeleton-line-title" />
                  <div className="home-skeleton-line" />
                  <div className="home-skeleton-line home-skeleton-line-short" />
                </div>
              ))}
            </div>
          </section>
        ) : (
          lodgingCollections.map((collection) => (
            <HomeCollectionSection
              key={collection.title}
              collection={collection}
              cards={buildCollectionCards(collection, lodgings)}
            />
          ))
        )}
      </div>
    </div>
  );
}
