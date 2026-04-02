import { useEffect, useState } from "react";
import {
  WEEK_DAYS,
  betweenDate,
  clamp,
  computePosition,
  createPortal,
  formatDateSummary,
  isBeforeDate,
  monthGrid,
  parseISO,
  sameDate,
  startOfDay,
  toISO,
} from "./bookingUtils";

function CalendarMonth({ baseDate, startDate, endDate, onPick, minimumDate }) {
  const days = monthGrid(baseDate);

  return (
    <div className="calendar-month">
      <div className="calendar-month-head">
        <strong>
          {baseDate.getFullYear()}.{String(baseDate.getMonth() + 1).padStart(2, "0")}
        </strong>
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
          const isDisabled = isBeforeDate(day, minimumDate);

          if (!isCurrentMonth) {
            return <span key={toISO(day)} className="calendar-day-placeholder" aria-hidden="true" />;
          }

          return (
            <button
              key={toISO(day)}
              type="button"
              className={`calendar-day${isStart ? " is-start" : ""}${isEnd ? " is-end" : ""}${isBetween ? " is-between" : ""}`}
              disabled={isDisabled}
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

export function DateRangePopover({ open, anchorRef, panelRef, visibleMonth, setVisibleMonth, checkIn, checkOut, onPick, onClose }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 960;
      const wantedWidth = isMobile ? Math.min(window.innerWidth - 24, 420) : Math.min(window.innerWidth - 24, 720);
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
  const minimumDate = startOfDay(new Date());

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
      <div className="calendar-toolbar">
        <button type="button" className="calendar-nav" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
          이전
        </button>
        <button type="button" className="calendar-nav" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
          다음
        </button>
      </div>
      <div className="calendar-month-grid" style={{ gridTemplateColumns: position.isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        <CalendarMonth baseDate={visibleMonth} startDate={startDate} endDate={endDate} onPick={onPick} minimumDate={minimumDate} />
        {!position.isMobile ? (
          <CalendarMonth
            baseDate={new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)}
            startDate={startDate}
            endDate={endDate}
            onPick={onPick}
            minimumDate={minimumDate}
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
