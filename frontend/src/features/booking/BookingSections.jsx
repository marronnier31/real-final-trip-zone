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
          <strong>{authSession ? `${authSession.name}님 예약을 진행합니다` : "로그인 시 예약이 가능합니다"}</strong>
          <p>
            {authSession
              ? "예약 완료 후 내 예약과 숙박 완료 후기 작성 흐름으로 바로 이어집니다."
              : "예약 내역과 혜택을 회원 정보와 연결하려면 먼저 로그인해 주세요."}
          </p>
        </div>
        {!authSession && (
          <Link className="secondary-button" to="/login">
            로그인하기
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
        <h2>투숙 정보 입력</h2>
      </div>

      <div className="booking-form-mock booking-form-grid">
        <label className="booking-field booking-date-field" ref={checkInRef}>
          <span>체크인</span>
          <strong>{formatBookingDate(form.checkIn)}</strong>
          <small>15:00 이후 입실</small>
          <button
            type="button"
            className="booking-date-hitbox"
            onClick={() => setOpenMenu((current) => (current === "date-start" ? null : "date-start"))}
          />
        </label>

        <label className="booking-field booking-date-field" ref={checkOutRef}>
          <span>체크아웃</span>
          <strong>{formatBookingDate(form.checkOut)}</strong>
          <small>11:00 이전 퇴실</small>
          <button
            type="button"
            className="booking-date-hitbox"
            onClick={() => setOpenMenu((current) => (current === "date-end" ? null : "date-end"))}
          />
        </label>

        <label className="booking-field booking-field-half booking-field-compact">
          <span>객실 타입</span>
          <div className="booking-picker">
            <button
              type="button"
              className={`booking-picker-trigger${openMenu === "room" ? " is-open" : ""}`}
              onClick={() => setOpenMenu((current) => (current === "room" ? null : "room"))}
            >
              <div className="booking-picker-copy">
                <strong>{form.room}</strong>
                <span>선택 가능한 객실 옵션 확인</span>
              </div>
              <span className="booking-picker-arrow">⌄</span>
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
                      <span>객실 조건과 포함 혜택 확인</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </label>

        <label className="booking-field booking-field-half">
          <span>투숙 인원</span>
          <div className="booking-guest-stepper">
            <div className="booking-guest-copy">
              <strong>성인 {form.guests}명</strong>
              <span>객실 1개 기준</span>
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
          <span>쿠폰</span>
          <div className="booking-picker">
            <button
              type="button"
              className={`booking-picker-trigger${openMenu === "coupon" ? " is-open" : ""}`}
              onClick={() => setOpenMenu((current) => (current === "coupon" ? null : "coupon"))}
            >
              <div className="booking-picker-copy">
                <strong>{selectedCoupon.label}</strong>
                <span>{selectedCoupon.discount > 0 ? selectedCoupon.discountLabel : "할인 없음"}</span>
              </div>
              <span className="booking-picker-arrow">⌄</span>
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
                      <span>{item.discount > 0 ? item.discountLabel : "할인 없음"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </label>

        <label className="booking-field booking-field-half">
          <span>마일리지</span>
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
              전액 사용
            </button>
          </div>
          <small>
            {authSession
              ? `보유 ${Number(mileageBalance ?? 0).toLocaleString()}P`
              : "로그인 후 보유 마일리지를 사용할 수 있습니다"}
          </small>
        </label>

        <label className="booking-field booking-field-full">
          <span>결제 수단</span>
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
              <span className="booking-picker-arrow">⌄</span>
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
          <span>요청사항</span>
          <textarea
            className="booking-textarea"
            rows="3"
            value={form.request}
            placeholder="얼리 체크인, 침대 요청 등 필요한 내용을 남겨주세요"
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
        <span className="small-label">선택 숙소</span>
        <h2>{lodging.name}</h2>
        <div className="booking-place-meta">
          <span>{lodging.region} · {lodging.district}</span>
          <span>{lodging.reviewCount}</span>
        </div>
        <span className="small-label">1박 기준 {baseAmount.toLocaleString()}원</span>
        <strong>{totalAmount.toLocaleString()}원</strong>
        <p>{selectedPayment.label} · {selectedPayment.pg}</p>
      </div>

      <div className="booking-summary-box">
        <div className="booking-summary-row">
          <span>객실 요금</span>
          <strong>{roomTotal.toLocaleString()}원</strong>
        </div>
        <div className="booking-summary-row">
          <span>숙박 일정</span>
          <strong>{nightCount}박</strong>
        </div>
        <div className="booking-summary-row">
          <span>선택 객실</span>
          <strong>{form.room}</strong>
        </div>
        <div className="booking-summary-row">
          <span>쿠폰 할인</span>
          <strong>-{selectedCoupon.discount.toLocaleString()}원</strong>
        </div>
        <div className="booking-summary-row">
          <span>마일리지 사용</span>
          <strong>-{mileageUsed.toLocaleString()}P</strong>
        </div>
        {serviceFee > 0 ? (
          <div className="booking-summary-row">
            <span>서비스 수수료</span>
            <strong>{serviceFee.toLocaleString()}원</strong>
          </div>
        ) : null}
        <div className="booking-summary-row total">
          <span>총 결제 예정</span>
          <strong>{totalAmount.toLocaleString()}원</strong>
        </div>
      </div>

      <div className="booking-status-stack">
        <span className="inline-chip">PG 연동 준비</span>
        <span className="inline-chip">결제 완료 후 예약 확정</span>
      </div>

      <div className="booking-summary-box booking-note-box">
        {bookingStatusNotes.map((item) => (
          <div key={item} className="booking-summary-row booking-summary-row-note">
            <span className="booking-note-dot" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {submitError ? <p className="booking-submit-error">{submitError}</p> : null}
      <button
        type="button"
        className={`primary-button booking-card-button${canSubmit ? "" : " is-disabled"}`}
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {isSubmitting ? "예약을 생성하는 중..." : authSession ? "결제 후 예약 완료" : "로그인 후 예약 진행"}
      </button>
    </div>
  );
}
