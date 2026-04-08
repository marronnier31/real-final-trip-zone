import { Link } from "react-router-dom";

export function BookingFormSection({
  authSession,
  bookingChecklist,
  checkInRef,
  checkOutRef,
  form,
  setForm,
  openMenu,
  setOpenMenu,
  selectedCoupon,
  selectedPayment,
  roomOptions,
  bookingCouponOptions,
  bookingPaymentOptions,
  formatBookingDate,
  mileageBalance,
}) {
  return (
    <div className="booking-form-surface">
      <div className={`booking-login-banner${authSession ? " is-active" : ""}`}>
        <div>
          <strong>{authSession ? `${authSession.name}´Ô ¿¹¾àÀ» ÁøÇàÇÕ´Ï´Ù` : "·Î±×ÀÎ ÈÄ ¿¹¾àÀÌ °¡´ÉÇÕ´Ï´Ù"}</strong>
          <p>
            {authSession
              ? "?ˆì•½ ?„ë£Œ ?????ˆì•½ê³??™ë°• ?„ë£Œ ?„ê¸° ?‘ì„± ?ë¦„?¼ë¡œ ë°”ë¡œ ?´ì–´ì§‘ë‹ˆ??"
              : "?ˆì•½ ?´ì—­ê³??œíƒ???Œì› ?•ë³´?€ ?°ê²°?˜ë ¤ë©?ë¨¼ì? ë¡œê·¸?¸í•´ ì£¼ì„¸??"}
          </p>
        </div>
        {!authSession && (
          <Link className="secondary-button" to="/login">
            ë¡œê·¸?¸í•˜ê¸?
          </Link>
        )}
      </div>

      <div className="booking-inline-guide">
        {bookingChecklist.map((item, i) => (
          <span key={item} className="booking-guide-chip">
            <span className="booking-guide-num">{i + 1}</span>
            {item}
          </span>
        ))}
      </div>

      <div className="booking-section-head">
        <h2>?¬ìˆ™ ?•ë³´ ?…ë ¥</h2>
      </div>

      <div className="booking-form-mock booking-form-grid">
        <label className="booking-field booking-date-field" ref={checkInRef}>
          <span>Ã¼Å©ÀÎ</span>
          <strong>{formatBookingDate(form.checkIn)}</strong>
          <small>15:00 ?´í›„ ?…ì‹¤</small>
          <button
            type="button"
            className="booking-date-hitbox"
            onClick={() => setOpenMenu((current) => (current === "date-start" ? null : "date-start"))}
          />
        </label>

        <label className="booking-field booking-date-field" ref={checkOutRef}>
          <span>ì²´í¬?„ì›ƒ</span>
          <strong>{formatBookingDate(form.checkOut)}</strong>
          <small>11:00 ?´ì „ ?´ì‹¤</small>
          <button
            type="button"
            className="booking-date-hitbox"
            onClick={() => setOpenMenu((current) => (current === "date-end" ? null : "date-end"))}
          />
        </label>

        <label className="booking-field booking-field-half booking-field-compact">
          <span>°´½Ç ¼±ÅÃ</span>
          <div className="booking-picker">
            <button
              type="button"
              className={`booking-picker-trigger${openMenu === "room" ? " is-open" : ""}`}
              onClick={() => setOpenMenu((current) => (current === "room" ? null : "room"))}
            >
              <div className="booking-picker-copy">
                <strong>{form.room}</strong>
                <span>? íƒ ê°€?¥í•œ ê°ì‹¤ ?µì…˜ ?•ì¸</span>
              </div>
              <span className="booking-picker-arrow">¡å</span>
            </button>
            {openMenu === "room" && (
              <div className="booking-picker-menu">
                {roomOptions.map((option) => {
                  const isActive = form.room === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`booking-picker-item${isActive ? " is-active" : ""}`}
                      onClick={() => {
                        setForm((current) => ({ ...current, room: option }));
                        setOpenMenu(null);
                      }}
                    >
                      <strong>{option}</strong>
                      <span>ê°ì‹¤ ì¡°ê±´ê³??¬í•¨ ?œíƒ ?•ì¸</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </label>

        <label className="booking-field booking-field-half">
          <span>?¬ìˆ™ ?¸ì›</span>
          <div className="booking-guest-stepper">
            <div className="booking-guest-copy">
              <strong>¼ºÀÎ {form.guests}¸í</strong>
              <span>ê°ì‹¤ 1ê°?ê¸°ì?</span>
            </div>
            <div className="booking-guest-controls">
              <button
                type="button"
                className="booking-guest-button"
                onClick={() => setForm((current) => ({ ...current, guests: Math.max(1, current.guests - 1) }))}
              >
                -
              </button>
              <strong>{form.guests}</strong>
              <button
                type="button"
                className="booking-guest-button"
                onClick={() => setForm((current) => ({ ...current, guests: current.guests + 1 }))}
              >
                +
              </button>
            </div>
          </div>
        </label>

        <label className="booking-field booking-field-half">
          <span>ì¿ í°</span>
          <div className="booking-picker">
            <button
              type="button"
              className={`booking-picker-trigger${openMenu === "coupon" ? " is-open" : ""}`}
              onClick={() => setOpenMenu((current) => (current === "coupon" ? null : "coupon"))}
            >
              <div className="booking-picker-copy">
                <strong>{selectedCoupon.label}</strong>
                <span>{selectedCoupon.discount > 0 ? selectedCoupon.discountLabel : "? ì¸ ?†ìŒ"}</span>
              </div>
              <span className="booking-picker-arrow">¡å</span>
            </button>
            {openMenu === "coupon" && (
              <div className="booking-picker-menu">
                {bookingCouponOptions.map((item) => {
                  const isActive = form.couponLabel === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`booking-picker-item${isActive ? " is-active" : ""}`}
                      onClick={() => {
                        setForm((current) => ({ ...current, couponLabel: item.label }));
                        setOpenMenu(null);
                      }}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.discount > 0 ? item.discountLabel : "? ì¸ ?†ìŒ"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </label>

        <label className="booking-field booking-field-half">
          <span>ë§ˆì¼ë¦¬ì?</span>
          <div className="booking-inline-input">
            <input
              type="number"
              min="0"
              step="1000"
              className="booking-number-input"
              value={form.mileageToUse}
              disabled={!authSession || mileageBalance <= 0}
              placeholder="0"
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                setForm((current) => ({
                  ...current,
                  mileageToUse: Math.max(0, Number.isFinite(nextValue) ? nextValue : 0),
                }));
              }}
            />
            <button
              type="button"
              className="secondary-button booking-inline-button"
              disabled={!authSession || mileageBalance <= 0}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  mileageToUse: mileageBalance,
                }))
              }
            >
              ?„ì•¡ ?¬ìš©
            </button>
          </div>
          <small>
            {authSession
              ? `ë³´ìœ  ${Number(mileageBalance ?? 0).toLocaleString()}P`
              : "ë¡œê·¸????ë³´ìœ  ë§ˆì¼ë¦¬ì?ë¥??¬ìš©?????ˆìŠµ?ˆë‹¤"}
          </small>
        </label>

        <label className="booking-field booking-field-full">
          <span>ê²°ì œ ?˜ë‹¨</span>
          <div className="booking-picker">
            <button
              type="button"
              className={`booking-picker-trigger${openMenu === "payment" ? " is-open" : ""}`}
              onClick={() => setOpenMenu((current) => (current === "payment" ? null : "payment"))}
            >
              <div className="booking-picker-copy">
                <strong>{selectedPayment.label}</strong>
                <span>{selectedPayment.pg}</span>
              </div>
              <span className="booking-picker-arrow">¡å</span>
            </button>
            {openMenu === "payment" && (
              <div className="booking-picker-menu booking-picker-menu-wide">
                {bookingPaymentOptions.map((item) => {
                  const isActive = form.paymentMethod === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`booking-picker-item${isActive ? " is-active" : ""}`}
                      onClick={() => {
                        setForm((current) => ({ ...current, paymentMethod: item.value }));
                        setOpenMenu(null);
                      }}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.pg}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </label>

        <label className="booking-field booking-field-full">
          <span>?”ì²­?¬í•­</span>
          <textarea
            className="booking-textarea"
            rows="3"
            value={form.request}
            placeholder="¹Ì¸® Ã¼Å©ÀÎ, Ä§´ë, ¿äÃ» »çÇ×ÀÌ ÀÖÀ¸¸é Àû¾îÁÖ¼¼¿ä."
            onChange={(event) => setForm((current) => ({ ...current, request: event.target.value }))}
          />
        </label>
      </div>
    </div>
  );
}

export function BookingSummarySection({
  lodging,
  baseAmount,
  nightCount,
  roomTotal,
  couponDiscount,
  serviceFee,
  mileageUsed,
  totalAmount,
  form,
  selectedCoupon,
  selectedPayment,
  bookingStatusNotes,
  authSession,
  canSubmit,
  isSubmitting,
  submitError,
  onSubmit,
}) {
  return (
    <div className="booking-payment-card">
      <div className="booking-payment-head">
        <span className="small-label">? íƒ ?™ì†Œ</span>
        <h2>{lodging.name}</h2>
        <div className="booking-place-meta">
          <span>{lodging.region} Â· {lodging.district}</span>
          <span>{lodging.reviewCount}</span>
        </div>
        <span className="small-label">1¹Ú ±âÁØ {baseAmount.toLocaleString()}¿ø</span>
        <strong>{totalAmount.toLocaleString()}¿ø</strong>
        <p>{selectedPayment.label} Â· {selectedPayment.pg}</p>
      </div>

      <div className="booking-summary-box">
        <div className="booking-summary-row">
          <span>ê°ì‹¤ ?”ê¸ˆ</span>
          <strong>{roomTotal.toLocaleString()}¿ø</strong>
        </div>
        <div className="booking-summary-row">
          <span>?™ë°• ?¼ì •</span>
          <strong>{nightCount}¹Ú</strong>
        </div>
        <div className="booking-summary-row">
          <span>? íƒ ê°ì‹¤</span>
          <strong>{form.room}</strong>
        </div>
        <div className="booking-summary-row">
          <span>ì¿ í° ? ì¸</span>
          <strong>{couponDiscount > 0 ? `-${couponDiscount.toLocaleString()}¿ø` : "ÇÒÀÎ ¾øÀ½"}</strong>
        </div>
        <div className="booking-summary-row">
          <span>ë§ˆì¼ë¦¬ì? ?¬ìš©</span>
          <strong>-{mileageUsed.toLocaleString()}P</strong>
        </div>
        {serviceFee > 0 ? (
          <div className="booking-summary-row">
            <span>¼­ºñ½º ¼ö¼ö·á</span>
            <strong>{serviceFee.toLocaleString()}¿ø</strong>
          </div>
        ) : null}
        <div className="booking-summary-row total">
          <span>ÃÑ °áÁ¦ ¿¹Á¤</span>
          <strong>{totalAmount.toLocaleString()}¿ø</strong>
        </div>
      </div>

      <div className="booking-status-stack">
        <span className="inline-chip">PG ¿¬µ¿ ÁØºñ</span>
        <span className="inline-chip">ê²°ì œ ?„ë£Œ ???ˆì•½ ?•ì •</span>
      </div>

      <div className="booking-summary-box booking-note-box">
        {bookingStatusNotes.map((item) => (
          <div key={item} className="booking-summary-row booking-summary-row-note">
            <span className="booking-note-dot" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={`primary-button booking-card-button${canSubmit ? "" : " is-disabled"}`}
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {isSubmitting ? "?ˆì•½???ì„±?˜ëŠ” ì¤?.." : authSession ? "ê²°ì œ ???ˆì•½ ?„ë£Œ" : "ë¡œê·¸?????ˆì•½ ì§„í–‰"}
      </button>
    </div>
  );
}





