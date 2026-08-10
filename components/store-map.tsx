import type { Store } from "@/lib/types";

type StoreMapProps = {
  store: Pick<Store, "name" | "address" | "lat" | "lng">;
};

export function StoreMap({ store }: StoreMapProps) {
  const lat = store.lat;
  const lng = store.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return (
      <section id="location-map" className="rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-semibold text-zinc-950">위치</div>
        <div className="mt-4 flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
          <div>
            <p className="text-sm font-medium text-zinc-700">지도 좌표가 아직 등록되지 않았습니다.</p>
            {store.address ? (
              <p className="mt-2 text-sm leading-6 text-zinc-500">{store.address}</p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                주소 또는 좌표를 등록하면 위치가 표시됩니다.
              </p>
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
    <section id="location-map" className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-zinc-950">위치</div>
          <p className="mt-1 text-xs text-zinc-500">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-600">
          임베디드 지도
        </span>
      </div>
      <iframe
        title={`${store.name} 위치 지도`}
        src={embedUrl}
        className="h-72 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {store.address ? (
        <div className="border-t border-zinc-200 px-5 py-3 text-sm text-zinc-600">{store.address}</div>
      ) : null}
    </section>
  );
}
