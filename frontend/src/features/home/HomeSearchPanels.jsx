import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WEEK_DAYS } from "./homeConstants";
import {
  betweenDate,
  clamp,
  computePosition,
  formatDateSummary,
  monthGrid,
  parseISO,
  sameDate,
  toISO,
} from "./homeUtils";

function CalendarMonth({ baseDate, startDate, endDate, onPick, controls = null }) {
  const days = monthGrid(baseDate);

  return (
    <div className="calendar-month">
      <div className="calendar-month-head">
        <strong>
          {baseDate.getFullYear()}.{String(baseDate.getMonth() + 1).padStart(2, "0")}
        </strong>
        {controls}
      </div>
      <div className="calendar-week-row">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === baseDate.getMonth();
          const isStart = sameDate(day, startDate);
          const isEnd = sameDate(day, endDate);
          const isBetween = betweenDate(day, startDate, endDate);

          if (!isCurrentMonth) {
            return <span key={toISO(day)} className="calendar-day-placeholder" aria-hidden="true" />;
          }

          return (
            <button
              key={toISO(day)}
              type="button"
              className={`calendar-day${isStart ? " is-start" : ""}${isEnd ? " is-end" : ""}${isBetween ? " is-between" : ""}`}
              onClick={() => onPick(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SuggestionsPanel({
  open,
  anchorRef,
  panelRef,
  recentSearches,
  filteredSuggestions,
  keyword,
  suggestionIcon,
  activeSuggest,
  onHoverSuggestion,
  onPickRecent,
  onPickSuggestion,
}) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const wantedWidth = clamp(Math.max(rect.width, 420), 420, 520);
      const next = computePosition(rect, wantedWidth, 340);
      setPosition({
        left: next.left,
        top: next.top,
        width: wantedWidth,
        maxHeight: clamp(window.innerHeight - next.top - 12, 220, 360),
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="search-floating-panel search-suggestion-panel"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        maxHeight: `${position.maxHeight}px`,
      }}
    >
      <div className="search-suggestion-group">
        <span className="search-chip-label">연관 검색</span>
        <div className="search-suggestion-list search-suggestion-list-stacked">
          {filteredSuggestions.map((item) => (
            <button
              key={`${item.type}-${item.label}`}
              type="button"
              className={`search-suggestion-item${filteredSuggestions[activeSuggest] === item ? " is-active" : ""}`}
              onMouseEnter={() => onHoverSuggestion(filteredSuggestions.findIndex((candidate) => candidate === item))}
              onClick={() => onPickSuggestion(item)}
            >
              <span className="search-suggestion-icon">{suggestionIcon[item.type] ?? "●"}</span>
              <div className="search-suggestion-copy">
                <strong>{item.label}</strong>
                <span>{item.subtitle}</span>
              </div>
            </button>
          ))}
          {!filteredSuggestions.length ? (
            <div className="search-empty-state">{keyword.trim() ? "연관 검색 결과가 없습니다." : "지역, 역, 숙소명을 입력해보세요."}</div>
          ) : null}
        </div>
      </div>
      {recentSearches.length ? (
        <div className="search-suggestion-group">
          <span className="search-chip-label">최근 검색</span>
          <div className="search-chip-row">
            {recentSearches.map((item) => (
              <button key={item} type="button" className="search-chip" onClick={() => onPickRecent(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

export function GuestPopover({ open, anchorRef, panelRef, guests, onChange, onClose }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const wantedWidth = clamp(Math.max(rect.width, 320), 280, 360);
      const next = computePosition(rect, wantedWidth, 156);
      setPosition({
        left: next.left,
        top: next.top,
        width: wantedWidth,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="search-floating-panel guest-panel"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
      }}
    >
      <div className="guest-panel-row">
        <div>
          <strong>성인</strong>
          <span>객실 1개 기준</span>
        </div>
        <div className="guest-stepper">
          <button type="button" className="guest-stepper-button" onClick={() => onChange(String(Math.max(1, Number(guests) - 1)))}>
            -
          </button>
          <strong>{guests}</strong>
          <button type="button" className="guest-stepper-button" onClick={() => onChange(String(Math.min(8, Number(guests) + 1)))}>
            +
          </button>
        </div>
      </div>
      <button type="button" className="primary-button search-flyout-confirm" onClick={onClose}>
        인원 선택 완료
      </button>
    </div>,
    document.body,
  );
}

export function DateRangePopover({ open, anchorRef, panelRef, visibleMonth, setVisibleMonth, checkIn, checkOut, onPick, onClose }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 960;
      const wantedWidth = isMobile ? Math.min(window.innerWidth - 24, 420) : Math.min(window.innerWidth - 24, 640);
      const next = computePosition(rect, wantedWidth, isMobile ? 540 : 500, { preferBelow: true });
      setPosition({
        left: next.left,
        top: next.top,
        width: wantedWidth,
        maxHeight: clamp(window.innerHeight - next.top - 12, 320, isMobile ? 540 : 500),
        isMobile,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open]);

  if (!open || !position) return null;

  const startDate = parseISO(checkIn);
  const endDate = parseISO(checkOut);

  return createPortal(
    <div
      ref={panelRef}
      className="search-floating-panel search-calendar-panel"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        maxHeight: `${position.maxHeight}px`,
      }}
    >
      <div className="calendar-month-grid" style={{ gridTemplateColumns: position.isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        <CalendarMonth
          baseDate={visibleMonth}
          startDate={startDate}
          endDate={endDate}
          onPick={onPick}
          controls={(
            <div className="calendar-toolbar">
              <button type="button" className="calendar-nav" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                이전
              </button>
              <button type="button" className="calendar-nav" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                다음
              </button>
            </div>
          )}
        />
        {!position.isMobile ? (
          <CalendarMonth
            baseDate={new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)}
            startDate={startDate}
            endDate={endDate}
            onPick={onPick}
          />
        ) : null}
      </div>
      <div className="calendar-footer">
        <span className="calendar-footer-text">{formatDateSummary(checkIn, checkOut)}</span>
        <button type="button" className="primary-button calendar-apply-button" onClick={onClose}>
          적용
        </button>
      </div>
    </div>,
    document.body,
  );
}
