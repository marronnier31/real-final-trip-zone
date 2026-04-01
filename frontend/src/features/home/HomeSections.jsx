import { Link } from "react-router-dom";

function formatCardPrice(priceLabel) {
  if (!priceLabel || priceLabel === "문의 필요" || priceLabel.endsWith("~")) {
    return priceLabel;
  }

  return `${priceLabel}~`;
}

export function HomePromoSection({ promoBanners }) {
  return (
    <section className="home-section">
      <div className="home-section-head">
        <h2>지금 예약이 빠른 특가</h2>
        <Link className="text-link" to="/events">
          이벤트 전체 보기
        </Link>
      </div>
      <div className="promo-grid">
        {promoBanners.map((item) => (
          <Link
            key={item.id ?? item.title}
            to={item.href ?? "/events"}
            className={`promo-card promo-${item.accent}`}
            style={{ backgroundImage: `linear-gradient(180deg, rgba(8, 24, 34, 0.12), rgba(8, 24, 34, 0.58)), url(${item.image})` }}
          >
            <strong>{item.title}</strong>
            <p>{item.subtitle}</p>
            <span className="promo-date">{item.date}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeCollectionSection({ collection, cards }) {
  return (
    <section className="home-section">
      <div className="home-section-head">
        <h2>{collection.title}</h2>
        <Link className="text-link" to={`/lodgings?region=${collection.region}`}>
          지역 전체 보기
        </Link>
      </div>
      <div className="lodging-showcase">
        {cards.map((lodging) => (
          <Link key={lodging.key} className="showcase-row" to={`/lodgings/${lodging.id}`}>
            <div className="rail-card-visual" style={{ backgroundImage: `url(${lodging.image})` }} />
            <div className="showcase-copy">
              <strong>{lodging.name}</strong>
              <div className="showcase-kicker">
                {lodging.region} · {lodging.district}
                <span className="showcase-review-inline">
                  ★ {lodging.rating} · {lodging.reviewCount}
                </span>
              </div>
              <p className="showcase-room-meta">{lodging.room}</p>
              <div className="showcase-foot">
                <div className="showcase-price-stack">
                  <div className="showcase-price-top">
                    <span className="showcase-discount">{lodging.discountRate}</span>
                    <span className="showcase-original-price">{lodging.originalPrice}</span>
                  </div>
                  <span className="showcase-price">{formatCardPrice(lodging.price)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
