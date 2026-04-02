import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup } from "react-leaflet";
import OpenFreeMapLayer from "../../components/common/OpenFreeMapLayer";
import { buildPriceMarkerIcon, buildPriceMeta } from "./lodgingListUtils";

function formatCardPrice(priceLabel) {
  if (!priceLabel || priceLabel === "문의 필요" || priceLabel.endsWith("~")) {
    return priceLabel;
  }

  return `${priceLabel}~`;
}

function getMapCenter(rows) {
  return [
    rows.reduce((sum, item) => sum + Number(item.latitude), 0) / rows.length,
    rows.reduce((sum, item) => sum + Number(item.longitude), 0) / rows.length,
  ];
}

export function LodgingResultsLayout({
  filteredLodgings,
  activeLodgingId,
  focusLodging,
  handleListPointer,
  mapInstance,
  setMapInstance,
}) {
  if (filteredLodgings.length === 0) {
    return (
      <section className="lodging-results">
        <div className="list-empty-state list-empty-state-full">
          <strong>검색 결과가 없습니다.</strong>
          <p>조건을 하나씩 해제하거나 지역, 가격대, 숙소유형을 다시 선택해보세요.</p>
        </div>
      </section>
    );
  }

  const center = getMapCenter(filteredLodgings);

  return (
    <section className="lodging-results">
      <div className="lodging-results-grid">
        <div
          className="lodging-list"
          onMouseMoveCapture={handleListPointer}
          onPointerMoveCapture={handleListPointer}
          onClickCapture={handleListPointer}
        >
          {filteredLodgings.map((lodging, index) => {
            const priceMeta = buildPriceMeta(lodging, index);

            return (
              <article
                key={lodging.id}
                data-lodging-id={lodging.id}
                className={`lodging-compact-card${activeLodgingId === lodging.id ? " is-active" : ""}`}
                onMouseEnter={() => focusLodging(lodging.id)}
                onPointerEnter={() => focusLodging(lodging.id)}
                onMouseOver={() => focusLodging(lodging.id)}
                onMouseMove={() => focusLodging(lodging.id)}
                onPointerMove={() => focusLodging(lodging.id)}
                onFocus={() => focusLodging(lodging.id)}
                onClick={() => focusLodging(lodging.id)}
              >
                <Link
                  className="lodging-compact-visual"
                  to={`/lodgings/${lodging.id}`}
                  style={{ backgroundImage: `url(${lodging.image})` }}
                  onMouseEnter={() => focusLodging(lodging.id)}
                  onPointerEnter={() => focusLodging(lodging.id)}
                  onMouseOver={() => focusLodging(lodging.id)}
                  onMouseMove={() => focusLodging(lodging.id)}
                  onPointerMove={() => focusLodging(lodging.id)}
                  onFocus={() => focusLodging(lodging.id)}
                  onClick={() => focusLodging(lodging.id)}
                />
                <div className="lodging-compact-body">
                  <strong className="lodging-compact-name">{lodging.name}</strong>
                  <div className="lodging-compact-top">
                    <span className="lodging-compact-region">
                      {lodging.region} · {lodging.district}
                      <span className="lodging-compact-review-inline">
                        ★ {lodging.rating} · 후기 {lodging.reviewCount}
                      </span>
                    </span>
                  </div>
                  <p className="lodging-compact-room">{lodging.room}</p>
                  <div className="lodging-compact-bottom">
                    <div className="lodging-compact-price-stack">
                      {priceMeta.discount ? (
                        <div className="lodging-compact-price-top">
                          <span className="lodging-compact-discount">{priceMeta.discount}</span>
                          <span className="lodging-compact-original">{priceMeta.original}</span>
                        </div>
                      ) : null}
                      <div className="lodging-compact-price">
                        <strong>{formatCardPrice(priceMeta.current)}</strong>
                        <span>/ 1박</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="map-preview">
          <div className="stay-map-wrap">
            <MapContainer
              center={center}
              zoom={6.4}
              scrollWheelZoom
              style={{ width: "100%", height: "100%" }}
              zoomControl={false}
              whenReady={(event) => setMapInstance(event.target)}
            >
              <OpenFreeMapLayer />
              {filteredLodgings.map((lodging) => (
                <Marker
                  key={lodging.id}
                  position={[Number(lodging.latitude), Number(lodging.longitude)]}
                  icon={buildPriceMarkerIcon(lodging.price, activeLodgingId === lodging.id)}
                  zIndexOffset={activeLodgingId === lodging.id ? 200 : 0}
                  eventHandlers={{ click: () => focusLodging(lodging.id) }}
                >
                  <Popup>
                    <strong>{lodging.name}</strong>
                    <br />
                    {lodging.region} · {lodging.district}
                    <br />
                    {lodging.price}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="stay-map-controls">
              <button type="button" className="stay-map-control" onClick={() => mapInstance?.zoomIn()} aria-label="지도 확대">+</button>
              <button type="button" className="stay-map-control" onClick={() => mapInstance?.zoomOut()} aria-label="지도 축소">-</button>
              <button
                type="button"
                className="stay-map-control"
                onClick={() => {
                  if (!mapInstance || !filteredLodgings.length) return;
                  mapInstance.setView(center, 6.4);
                }}
                aria-label="지도 재중앙"
              >
                ⌖
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
