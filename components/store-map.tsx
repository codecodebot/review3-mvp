import type { Store } from "@/lib/types";

type StoreMapProps = {
  store: Pick<Store, "name" | "address" | "lat" | "lng">;
};

export function StoreMap({ store }: StoreMapProps) {
  const lat = store.lat;
  const lng = store.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return (
      <section id="location-map" className="tt-detail-map-card">
        <div className="tt-detail-map-card__header">
          <div>
            <div className="tt-card-title">위치</div>
            <p className="tt-card-description">좌표 상태</p>
          </div>
        </div>
        <div className="tt-detail-map-card__empty">
          <div>
            <p>지도 좌표가 아직 등록되지 않았습니다.</p>
            {store.address ? (
              <p>{store.address}</p>
            ) : (
              <p>주소 또는 좌표를 등록하면 위치가 표시됩니다.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  const delta = 0.006;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;

  return (
    <section id="location-map" className="tt-detail-map-card">
      <div className="tt-detail-map-card__header">
        <div>
          <div className="tt-card-title">위치</div>
          <p className="tt-card-description">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
        <span className="tt-badge tt-badge--muted">
          임베디드 지도
        </span>
      </div>
      <iframe
        title={`${store.name} 위치 지도`}
        src={embedUrl}
        className="tt-detail-map-iframe"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {store.address ? (
        <div className="tt-detail-map-address">{store.address}</div>
      ) : null}
    </section>
  );
}
