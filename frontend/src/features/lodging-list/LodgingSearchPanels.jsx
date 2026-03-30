import { useEffect, useState } from "react";
import { createPortal, betweenDate, clamp, computePosition, formatDateSummary, monthGrid, parseISO, sameDate, toISO } from "./lodgingListUtils";
import { WEEK_DAYS } from "./lodgingListConstants";

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
          if (!isCurrentMonth) {
            return <span key={toISO(day)} className="calendar-day-placeholder" aria-hidden="true" />;
          }
          const isStart = sameDate(day, startDate);
          const isEnd = sameDate(day, endDate);
          const isBetween = betweenDate(day, startDate, endDate);

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

export function SuggestionsPanel({ open, anchorRef, panelRef, items, onPick }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 520);
      const next = computePosition(rect, width, 340);
      setPosition({
        left: next.left,
        top: next.top,
        width,
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
      style={{ left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px`, maxHeight: `${position.maxHeight}px` }}
    >
      <div className="search-suggestion-group">
        <span className="search-chip-label">연관 검색</span>
        <div className="search-suggestion-list search-suggestion-list-stacked">
          {items.length ? (
            items.map((item) => (
              <button key={`${item.type}-${item.label}`} type="button" className="search-suggestion-item" onClick={() => onPick(item)}>
                <span className="search-suggestion-icon">{item.type === "hotel" ? "■" : item.type === "station" ? "◆" : "●"}</span>
                <div className="search-suggestion-copy">
                  <strong>{item.label}</strong>
                  <span>{item.subtitle}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="search-suggestion-empty">
              <strong>검색어를 입력하세요</strong>
              <span>지역명, 숙소명, 랜드마크를 입력하면 연관 검색이 표시됩니다.</span>
            </div>
          )}
        </div>
      </div>
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
      const width = isMobile ? Math.min(window.innerWidth - 24, 420) : Math.min(window.innerWidth - 24, 720);
      const next = computePosition(rect, width, isMobile ? 540 : 500, { preferBelow: true });
      setPosition({
        left: next.left,
        top: next.top,
        width,
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
      style={{ left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px`, maxHeight: `${position.maxHeight}px` }}
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
          <CalendarMonth baseDate={new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)} startDate={startDate} endDate={endDate} onPick={onPick} />
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

export function GuestPopover({ open, anchorRef, panelRef, guests, onChange, onClose }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = clamp(Math.max(rect.width, 320), 280, 360);
      const next = computePosition(rect, width, 156);
      setPosition({ left: next.left, top: next.top, width });
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
    <div ref={panelRef} className="search-floating-panel guest-panel" style={{ left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px` }}>
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
