import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { homeSearchDefaults } from "../../data/homeData";
import { lodgingSortOptions } from "../../data/lodgingData";
import { readRecentSearches, writeRecentSearches } from "../../features/home/homeViewModel";
import { DateRangePopover, GuestPopover, SuggestionsPanel } from "../../features/lodging-list/LodgingSearchPanels";
import { LodgingListToolbar } from "../../features/lodging-list/LodgingListToolbar";
import { LodgingResultsLayout, LodgingMapPanel } from "../../features/lodging-list/LodgingResultsLayout";
import {
  buildOptionCounts,
  buildSuggestionItems,
  buildFilterSummary,
  filterLodgings,
  filterSuggestions,
  parseLodgingSearchState,
} from "../../features/lodging-list/lodgingListViewModel";
import { clamp, formatDateSummary, parseISO, toISO } from "../../features/lodging-list/lodgingListUtils";
import { getCachedLodgingsSnapshot, getLodgings, getSearchSuggestionItems, subscribeLodgingsInvalidated } from "../../services/lodgingService";

const PAGE_SIZE = 24;
const PAGE_GROUP_SIZE = 10;

export default function LodgingListPage() {
  const cachedLodgings = getCachedLodgingsSnapshot();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchShellRef = useRef(null);
  const toolbarRef = useRef(null);
  const keywordRef = useRef(null);
  const dateRef = useRef(null);
  const guestsRef = useRef(null);
  const suggestPanelRef = useRef(null);
  const calendarPanelRef = useRef(null);
  const guestPanelRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [lodgings, setLodgings] = useState(cachedLodgings);
  const [searchSuggestionItems, setSearchSuggestionItems] = useState([]);
  const [loadState, setLoadState] = useState(cachedLodgings.length ? "ready" : "loading");
  const [loadError, setLoadError] = useState("");
  const filters = parseLodgingSearchState(searchParams, homeSearchDefaults);
  const keyword = filters.keyword;
  const checkIn = filters.checkIn;
  const checkOut = filters.checkOut;
  const guests = filters.guests;
  const sort = filters.sort;
  const type = filters.type;
  const priceBand = filters.priceBand;
  const regionFilter = filters.regionFilter;
  const features = filters.features;
  const tastes = filters.tastes;
  const discounts = filters.discounts;
  const grades = filters.grades;
  const facilities = filters.facilities;
  const minPrice = clamp(filters.minPrice, 0, 100000000);
  const maxPrice = clamp(filters.maxPrice, minPrice, 100000000);
  const availableOnly = filters.availableOnly;
  const filterPageResetKey = searchParams.toString();

  const [searchForm, setSearchForm] = useState({
    keyword,
    checkIn,
    checkOut,
    guests,
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parsed = parseISO(checkIn);
    return parsed && parsed >= today ? parsed : today;
  });
  const filterSummary = buildFilterSummary(filters, lodgingSortOptions);

  useEffect(() => {
    let cancelled = false;

    async function loadLodgingData() {
      try {
        setLoadState((current) => (lodgings.length ? current : "loading"));
        setLoadError("");
        const nextLodgings = await getLodgings();
        const nextSuggestions = await getSearchSuggestionItems(nextLodgings);
        if (cancelled) return;
        setLodgings(nextLodgings);
        setSearchSuggestionItems(nextSuggestions);
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load lodging list data.", error);
        setLoadError("숙소 목록을 불러오지 못했습니다.");
        setLoadState("error");
      }
    }

    loadLodgingData();

    const unsubscribe = subscribeLodgingsInvalidated(() => {
      loadLodgingData();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const allSuggestionItems = useMemo(() => {
    return buildSuggestionItems(lodgings, searchSuggestionItems);
  }, [lodgings, searchSuggestionItems]);

  const filteredSuggestions = useMemo(() => {
    return filterSuggestions(allSuggestionItems, searchForm.keyword);
  }, [allSuggestionItems, searchForm.keyword]);

  const optionCounts = useMemo(() => {
    return buildOptionCounts(lodgings);
  }, [lodgings]);

  const filteredLodgings = useMemo(() => {
    return filterLodgings(lodgings, { ...filters, minPrice, maxPrice });
  }, [filters, maxPrice, minPrice]);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredLodgings.length / PAGE_SIZE));
  const currentGroup = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE);
  const pageNumbers = useMemo(() => {
    const startPage = currentGroup * PAGE_GROUP_SIZE + 1;
    const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);
    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [currentGroup, totalPages]);
  const pagedLodgings = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredLodgings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredLodgings]);

  const [activeLodgingId, setActiveLodgingId] = useState(null);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    setSearchForm({ keyword, checkIn, checkOut, guests });
  }, [checkIn, checkOut, guests, keyword]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        searchShellRef.current &&
        !searchShellRef.current.contains(event.target) &&
        (!toolbarRef.current || !toolbarRef.current.contains(event.target)) &&
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterPageResetKey, lodgings.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!pagedLodgings.length) {
      setActiveLodgingId(null);
      return;
    }

    setActiveLodgingId((current) => {
      if (!current) return null;
      if (pagedLodgings.some((lodging) => lodging.id === current)) {
        return current;
      }
      return null;
    });
  }, [pagedLodgings]);

  const focusLodging = (lodgingId) => {
    setActiveLodgingId(lodgingId);
    if (!mapInstance) return;
    const target = pagedLodgings.find((lodging) => lodging.id === lodgingId);
    if (!target) return;
    const latitude = Number(target.latitude);
    const longitude = Number(target.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    mapInstance.stop();
    mapInstance.flyTo([latitude, longitude], 11, {
      animate: true,
      duration: 0.55,
      easeLinearity: 0.25,
    });
  };

  useEffect(() => {
    if (!mapInstance || !activeLodgingId) return;
    const target = pagedLodgings.find((lodging) => lodging.id === activeLodgingId);
    if (!target) return;
    const latitude = Number(target.latitude);
    const longitude = Number(target.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    mapInstance.stop();
    mapInstance.flyTo([latitude, longitude], 11, {
      animate: true,
      duration: 0.55,
      easeLinearity: 0.25,
    });
  }, [activeLodgingId, mapInstance, pagedLodgings]);

  const updateParams = (nextValues) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === "" || value == null) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchForm.keyword.trim()) {
      const nextRecent = writeRecentSearches(searchForm.keyword, recentSearches);
      setRecentSearches(nextRecent);
    }
    updateParams(searchForm);
    setActivePanel(null);
  };

  const updateSearchGlow = (event) => {
    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();
    currentTarget.style.setProperty("--search-glow-x", `${clientX - rect.left}px`);
    currentTarget.style.setProperty("--search-glow-y", `${clientY - rect.top}px`);
  };

  const resetSearchGlow = () => {
    if (!searchShellRef.current) return;
    searchShellRef.current.style.setProperty("--search-glow-x", "50%");
    searchShellRef.current.style.setProperty("--search-glow-y", "50%");
  };

  const handleDatePick = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day < today) return;

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

  const toggleQueryValue = (key, currentValues, value) => {
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    updateParams({ [key]: nextValues.length ? nextValues.join(",") : "" });
  };

  const handleListPointer = (event) => {
    const rawTarget = event.target;
    const baseElement =
      rawTarget instanceof Element
        ? rawTarget
        : rawTarget && rawTarget.parentElement
          ? rawTarget.parentElement
          : null;
    const target = baseElement?.closest("[data-lodging-id]");
    if (!target) return;
    const nextId = Number(target.getAttribute("data-lodging-id"));
    if (!Number.isFinite(nextId)) return;
    if (nextId === activeLodgingId) return;
    focusLodging(nextId);
  };

  const resetSearch = () => {
    setSearchParams(new URLSearchParams());
    setActiveFilterMenu(null);
    setActivePanel(null);
  };

  return (
    <div className="container list-page">
      <form
        ref={searchShellRef}
        className="list-search-bar list-search-bar-showcase list-search-bar-wide"
        onSubmit={handleSearchSubmit}
        onMouseMove={updateSearchGlow}
        onMouseLeave={resetSearchGlow}
      >
        <div className="list-search-ambient" aria-hidden="true">
          <span className="list-search-accent list-search-accent-warm" />
          <span className="list-search-accent list-search-accent-cool" />
        </div>
        <label
          ref={keywordRef}
          className={`list-search-field list-search-field-button${activePanel === "keyword" ? " is-active" : ""}`}
        >
          <span>지역</span>
          <input
            className="search-input"
            value={searchForm.keyword}
            placeholder="지역명 또는 숙소명을 입력하세요"
            onFocus={() => setActivePanel("keyword")}
            onChange={(event) => {
              setSearchForm((current) => ({ ...current, keyword: event.target.value }));
              setActivePanel("keyword");
            }}
          />
        </label>
        <button
          ref={dateRef}
          type="button"
          className={`list-search-field list-search-field-button${activePanel === "date" ? " is-active" : ""}`}
          onClick={() => {
            setVisibleMonth(parseISO(searchForm.checkIn) ?? new Date());
            setActivePanel((current) => (current === "date" ? null : "date"));
          }}
        >
          <span>일정</span>
          <strong>{formatDateSummary(searchForm.checkIn, searchForm.checkOut)}</strong>
        </button>
        <button
          ref={guestsRef}
          type="button"
          className={`list-search-field list-search-field-button${activePanel === "guests" ? " is-active" : ""}`}
          onClick={() => setActivePanel((current) => (current === "guests" ? null : "guests"))}
        >
          <span>인원</span>
          <strong>성인 {searchForm.guests}명 · 객실 1개</strong>
        </button>
        <button className="primary-button list-search-submit" type="submit">
          검색
        </button>
      </form>

      <SuggestionsPanel
        open={activePanel === "keyword"}
        anchorRef={keywordRef}
        panelRef={suggestPanelRef}
        items={filteredSuggestions}
        recentSearches={recentSearches}
        onPickRecent={(item) => {
          setSearchForm((current) => ({ ...current, keyword: item }));
          setActivePanel(null);
        }}
        onPick={(item) => {
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

      <LodgingListToolbar
        toolbarRef={toolbarRef}
        activeFilterMenu={activeFilterMenu}
        setActiveFilterMenu={setActiveFilterMenu}
        filterSummary={filterSummary}
        updateParams={updateParams}
        availableOnly={availableOnly}
        optionCounts={optionCounts}
        type={type}
        features={features}
        priceBand={priceBand}
        regionFilter={regionFilter}
        tastes={tastes}
        discounts={discounts}
        grades={grades}
        facilities={facilities}
        toggleQueryValue={toggleQueryValue}
        lodgingSortOptions={lodgingSortOptions}
        sort={sort}
      />

      <div className="list-body-grid">
        <div className="list-body-main">
          {loadState === "loading" ? (
            <section className="lodging-results">
              <div className="lodging-results lodging-results-grid-skeleton" aria-hidden="true">
                <div className="lodging-results-skeleton">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="lodging-skeleton-card">
                      <div className="lodging-skeleton-visual" />
                      <div className="lodging-skeleton-line lodging-skeleton-line-title" />
                      <div className="lodging-skeleton-line" />
                      <div className="lodging-skeleton-line lodging-skeleton-line-short" />
                      <div className="lodging-skeleton-price" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : loadState === "error" ? (
            <section className="lodging-results">
              <div className="list-empty-state list-empty-state-full list-empty-state-action">
                <strong>숙소 목록을 다시 불러와 주세요.</strong>
                <p>{loadError}</p>
                <button type="button" className="secondary-button" onClick={() => window.location.reload()}>
                  다시 시도
                </button>
              </div>
            </section>
          ) : !filteredLodgings.length ? (
            <section className="lodging-results">
              <div className="list-empty-state list-empty-state-full list-empty-state-action">
                <strong>조건을 조금 넓혀보세요.</strong>
                <p>지역, 가격대, 숙소 유형 중 한두 개만 먼저 풀면 더 좋은 숙소를 바로 비교할 수 있습니다.</p>
                <button type="button" className="secondary-button" onClick={resetSearch}>
                  전체 조건 다시 보기
                </button>
              </div>
            </section>
          ) : (
            <>
              <LodgingResultsLayout
                filteredLodgings={pagedLodgings}
                activeLodgingId={activeLodgingId}
                focusLodging={focusLodging}
                handleListPointer={handleListPointer}
              />
              {totalPages > 1 ? (
                <div className="list-pagination">
                  <button
                    type="button"
                    className="list-pagination-arrow"
                    onClick={() => setCurrentPage(Math.max(1, currentGroup * PAGE_GROUP_SIZE))}
                    disabled={currentGroup === 0}
                    aria-label="이전 페이지 그룹"
                  >
                    ←
                  </button>
                  <div className="list-pagination-pages">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`list-pagination-page${pageNumber === currentPage ? " is-active" : ""}`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="list-pagination-arrow"
                    onClick={() => setCurrentPage(Math.min(totalPages, (currentGroup + 1) * PAGE_GROUP_SIZE + 1))}
                    disabled={pageNumbers[pageNumbers.length - 1] >= totalPages}
                    aria-label="다음 페이지 그룹"
                  >
                    →
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <LodgingMapPanel
          filteredLodgings={pagedLodgings}
          activeLodgingId={activeLodgingId}
          focusLodging={focusLodging}
          mapInstance={mapInstance}
          setMapInstance={setMapInstance}
        />
      </div>
    </div>
  );
}
