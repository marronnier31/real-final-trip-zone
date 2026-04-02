import { Link } from "react-router-dom";
import { getDiscountRate, getRoomCapacity, getRoomMeta, getRoomTitle } from "./lodgingDetailUtils";

function renderStars(score) {
  const numericScore = Number(score);
  return Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const isFull = numericScore >= starValue;
    const isHalf = !isFull && numericScore >= starValue - 0.5;
    return (
      <span key={`${numericScore}-${starValue}`} className={`review-star-display${isFull ? " is-full" : ""}${isHalf ? " is-half" : ""}`} aria-hidden="true">
        ★
      </span>
    );
  });
}

function renderInteractiveStars(score, onChange) {
  return Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const isFull = score >= starValue;
    const isHalf = !isFull && score >= starValue - 0.5;

    return (
      <span key={`interactive-${starValue}`} className="detail-review-star-wrap">
        <button type="button" className="detail-review-star-hit detail-review-star-hit-left" onClick={() => onChange(starValue - 0.5)} aria-label={`${starValue - 0.5}점`} />
        <button type="button" className="detail-review-star-hit detail-review-star-hit-right" onClick={() => onChange(starValue)} aria-label={`${starValue}점`} />
        <span className={`detail-review-star-visual${isFull ? " is-full" : ""}${isHalf ? " is-half" : ""}`} aria-hidden="true">
          ★
        </span>
      </span>
    );
  });
}

export function RoomOptionsSection({ lodging, roomOptions, selectedRoom, onSelectRoom }) {
  return (
    <section className="detail-review-section">
      <div className="detail-headline">
        <span className="small-label">객실 선택</span>
        <h2>예약 가능한 객실</h2>
        <p>{lodging.room}</p>
      </div>
      {!roomOptions.length ? (
        <div className="list-empty-state">
          <strong>등록된 객실이 없습니다.</strong>
          <p>판매자 페이지에서 객실과 가격을 먼저 등록해야 예약 화면에 노출됩니다.</p>
        </div>
      ) : null}
      <div className="room-option-list">
        {roomOptions.map((room) => (
          <button
            key={room.id ?? room.name}
            type="button"
            className={`room-option-card${selectedRoom?.id === room.id ? " is-active" : ""}`}
            onClick={() => onSelectRoom(room)}
          >
            <div className="room-option-visual" style={{ backgroundImage: `url(${room.image})` }}>
              <span>{room.badge}</span>
            </div>
            <div className="room-option-body">
              <div className="room-option-top">
                <strong>{room.name}</strong>
                <span>{getRoomMeta(room.name)}</span>
              </div>
              <p>{room.description}</p>
              <div className="room-option-meta">
                <span>{lodging.checkInTime} 체크인</span>
                <span>{lodging.checkOutTime} 체크아웃</span>
                <span>{getRoomMeta(room.name)}</span>
              </div>
              <div className="room-option-inline">
                <span>{getRoomCapacity(room.name, room.maxGuestCount)}</span>
                <span>{room.badge}</span>
                <span>{room.description.split(" · ")[0]}</span>
              </div>
              <div className="room-option-bottom">
                <div className="room-option-price">
                  {room.originalPrice ? <em>{getDiscountRate(room.price, room.originalPrice)} 할인</em> : null}
                  {room.originalPrice ? <span>{room.originalPrice}</span> : null}
                  <strong>{room.price}</strong>
                </div>
                <span>1박 기준</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ReviewSection({ authSession, canWriteReview, galleryImages, lodging, reviewAverage, reviewDraft, reviews, onChangeDraft, onSubmit, onImageChange }) {
  return (
    <section className="detail-review-section">
      <div className="detail-headline">
        <span className="small-label">리뷰</span>
        <h2>최근 이용 후기</h2>
      </div>
      <div className="review-summary-strip">
        <span className="accent-rating">★ {reviewAverage}</span>
        <span>{lodging.reviewCount}</span>
        <span className="accent-benefit">{lodging.benefit}</span>
        <span>{lodging.cancellation}</span>
      </div>
      {canWriteReview ? (
        <form className="detail-review-form" onSubmit={onSubmit}>
          <div className="detail-review-form-head">
            <strong>후기 작성</strong>
            <div className="detail-review-stars" role="radiogroup" aria-label="별점 선택">
              {renderInteractiveStars(reviewDraft.score, (score) => onChangeDraft({ score }))}
            </div>
          </div>
          <textarea className="detail-review-textarea" rows="4" placeholder="객실 상태, 위치, 서비스 경험을 남겨보세요." value={reviewDraft.body} onChange={(event) => onChangeDraft({ body: event.target.value })} />
          <div className="detail-review-upload">
            <label className="detail-review-upload-button">
              사진 첨부
              <input type="file" accept="image/*" multiple onChange={onImageChange} hidden />
            </label>
            {reviewDraft.images.length ? (
              <div className="detail-review-upload-preview">
                {reviewDraft.images.map((image) => (
                  <div key={image} className="detail-review-upload-thumb" style={{ backgroundImage: `url(${image})` }} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="detail-review-form-foot">
            <span>{reviewDraft.body.trim().length}자</span>
            <button type="submit" className="primary-button detail-review-submit">
              후기 등록
            </button>
          </div>
        </form>
      ) : (
        <div className="detail-review-gate">
          <strong>{authSession ? "숙박 완료 예약 후 후기 작성 가능" : "로그인 후 후기 작성 가능"}</strong>
          <p>{authSession ? "설계 기준에 따라 숙박 완료된 예약에 대해서만 리뷰를 등록할 수 있습니다." : "후기 작성은 로그인 후 이용할 수 있습니다."}</p>
          <Link className="secondary-button" to={authSession ? "/my/bookings" : "/login"}>
            {authSession ? "내 예약에서 완료 내역 보기" : "로그인하기"}
          </Link>
        </div>
      )}
      <div className="detail-review-list">
        {reviews.map((item, index) => (
          <article key={item.id ?? `${item.author}-${item.stay}-${index}`} className="detail-review-item">
            <div className="detail-review-head">
              <strong>{item.author}</strong>
              <span className="detail-review-stars-readonly">
                {renderStars(item.score)}
                <em>{item.stay}</em>
              </span>
            </div>
            <p>{item.body}</p>
            <div className="detail-review-gallery">
              {(item.images?.length ? item.images : galleryImages.slice(0, 2)).map((image, imageIndex) => (
                <div
                  key={`${item.id ?? item.author}-${imageIndex}`}
                  className="detail-review-thumb"
                  style={{ backgroundImage: `url(${image}${item.images?.length ? "" : index === 1 ? "&sat=6" : ""})` }}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StickyBookingCard({ lodging, selectedRoom, roomBaseMeta }) {
  if (!selectedRoom) {
    return (
      <aside className="sticky-booking-card">
        <span className="small-label">예약 요약</span>
        <div className="list-empty-state">
          <strong>객실 등록 필요</strong>
          <p>판매자 페이지에서 객실명과 가격을 먼저 등록해야 예약을 받을 수 있습니다.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky-booking-card">
      <span className="small-label">예약 요약</span>
      <div className="sticky-booking-room">
        <div className="sticky-booking-room-visual" style={{ backgroundImage: `url(${selectedRoom.image})` }} />
        <div className="sticky-booking-room-copy">
          <strong>{getRoomTitle(selectedRoom.name)}</strong>
          <span>{getRoomCapacity(selectedRoom.name, selectedRoom.maxGuestCount)} · {roomBaseMeta}</span>
        </div>
      </div>
      <div className="sticky-booking-price">
        {selectedRoom.originalPrice ? <span className="sticky-booking-strike">{selectedRoom.originalPrice}</span> : null}
        <strong>{selectedRoom.price}</strong>
        <span>1박 기준</span>
      </div>
      <div className="sticky-booking-meta">
        <span>★ {lodging.rating}</span>
        <span>{lodging.reviewCount}</span>
      </div>
      <div className="sticky-booking-note">
        <p><span className="sticky-booking-dot" aria-hidden="true" />{selectedRoom.description}</p>
        <p><span className="sticky-booking-dot" aria-hidden="true" />체크인 {lodging.checkInTime} · 체크아웃 {lodging.checkOutTime}</p>
        <p><span className="sticky-booking-dot" aria-hidden="true" />{lodging.cancellation}</p>
      </div>
      <div className="sticky-booking-facts">
        <div>
          <span>객실 혜택</span>
          <strong>{selectedRoom.badge}</strong>
        </div>
        <div>
          <span>주요 조건</span>
          <strong>{lodging.highlights[0]}</strong>
        </div>
      </div>
      <div className="sticky-booking-facts">
        <div>
          <span>위치</span>
          <strong>{lodging.region} · {lodging.district}</strong>
        </div>
        <div>
          <span>선택 객실</span>
          <strong>{roomBaseMeta}</strong>
        </div>
      </div>
      <div className="feature-chip-row">
        <span className="inline-chip">즉시 확정</span>
        <span className="inline-chip">무료 취소 확인</span>
      </div>
      <Link className="primary-button booking-card-button" to={`/booking/${lodging.id}?room=${encodeURIComponent(selectedRoom.name)}`}>
        객실 선택 후 예약
      </Link>
    </aside>
  );
}
