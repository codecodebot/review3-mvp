"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Check, Clipboard, LocateFixed, ListTree, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { formatCategoryLabel, formatRegionLabel } from "@/lib/constants";
import type { StoreMapPoint } from "@/lib/types";

type StoreMapExplorerProps = {
  stores: StoreMapPoint[];
};

type Size = {
  width: number;
  height: number;
};

type PixelPoint = {
  x: number;
  y: number;
};

type ScreenPoint = {
  left: number;
  top: number;
};

type ProjectedMarker = ScreenPoint & {
  store: StoreMapPoint;
};

type StoreMarkerItem = ProjectedMarker & {
  key: string;
  type: "marker";
};

type StoreClusterItem = ScreenPoint & {
  count: number;
  key: string;
  stores: StoreMapPoint[];
  type: "cluster";
};

const TILE_SIZE = 256;
const MIN_ZOOM = 7;
const MAX_ZOOM = 18;
const DEFAULT_CENTER = { lat: 37.4979, lng: 126.8844 };
const DEFAULT_SIZE = { width: 960, height: 540 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lngToWorldX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

function latToWorldY(lat: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    TILE_SIZE *
    2 ** zoom
  );
}

function projectPoint(lat: number, lng: number, zoom: number): PixelPoint {
  return {
    x: lngToWorldX(lng, zoom),
    y: latToWorldY(lat, zoom)
  };
}

function getBounds(stores: StoreMapPoint[]) {
  if (!stores.length) {
    return {
      minLat: DEFAULT_CENTER.lat,
      maxLat: DEFAULT_CENTER.lat,
      minLng: DEFAULT_CENTER.lng,
      maxLng: DEFAULT_CENTER.lng
    };
  }

  return stores.reduce(
    (bounds, store) => ({
      minLat: Math.min(bounds.minLat, store.lat),
      maxLat: Math.max(bounds.maxLat, store.lat),
      minLng: Math.min(bounds.minLng, store.lng),
      maxLng: Math.max(bounds.maxLng, store.lng)
    }),
    {
      minLat: stores[0].lat,
      maxLat: stores[0].lat,
      minLng: stores[0].lng,
      maxLng: stores[0].lng
    }
  );
}

function getCenter(stores: StoreMapPoint[]) {
  const bounds = getBounds(stores);

  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2
  };
}

function getFitZoom(stores: StoreMapPoint[], size: Size) {
  if (stores.length <= 1) {
    return 15;
  }

  const bounds = getBounds(stores);
  const paddedWidth = Math.max(size.width * 0.82, 320);
  const paddedHeight = Math.max(size.height * 0.78, 260);

  for (let zoom = MAX_ZOOM; zoom >= MIN_ZOOM; zoom -= 1) {
    const northwest = projectPoint(bounds.maxLat, bounds.minLng, zoom);
    const southeast = projectPoint(bounds.minLat, bounds.maxLng, zoom);
    const width = Math.abs(southeast.x - northwest.x);
    const height = Math.abs(southeast.y - northwest.y);

    if (width <= paddedWidth && height <= paddedHeight) {
      return zoom;
    }
  }

  return MIN_ZOOM;
}

function tileUrl(x: number, y: number, zoom: number) {
  const tilesPerAxis = 2 ** zoom;
  const wrappedX = ((x % tilesPerAxis) + tilesPerAxis) % tilesPerAxis;

  return `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${wrappedX}/${y}@2x.png`;
}

function getClusterCellSize(zoom: number, storeCount: number) {
  if (storeCount < 80 || zoom >= 16) return 0;
  if (zoom <= 10) return 96;
  if (zoom <= 12) return 80;
  if (zoom <= 14) return 64;
  return 52;
}

function getClusterSize(count: number) {
  if (count >= 100) return 48;
  if (count >= 25) return 42;
  return 36;
}

export function StoreMapExplorer({ stores }: StoreMapExplorerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const [zoomOffset, setZoomOffset] = useState(0);
  const [panOffset, setPanOffset] = useState<PixelPoint>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<PixelPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(stores[0]?.id ?? null);
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setSize({
        width: Math.max(rect.width, 320),
        height: Math.max(rect.height, 420)
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setSelectedStoreId(stores[0]?.id ?? null);
    setZoomOffset(0);
    setPanOffset({ x: 0, y: 0 });
  }, [stores]);

  const center = useMemo(() => getCenter(stores), [stores]);
  const fitZoom = useMemo(() => getFitZoom(stores, size), [stores, size]);
  const zoom = clamp(fitZoom + zoomOffset, MIN_ZOOM, MAX_ZOOM);
  const centerPixel = projectPoint(center.lat, center.lng, zoom);
  const topLeft = {
    x: centerPixel.x - size.width / 2 - panOffset.x,
    y: centerPixel.y - size.height / 2 - panOffset.y
  };
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? null;

  const tiles = useMemo(() => {
    const minTileX = Math.floor(topLeft.x / TILE_SIZE);
    const maxTileX = Math.floor((topLeft.x + size.width) / TILE_SIZE);
    const minTileY = Math.max(0, Math.floor(topLeft.y / TILE_SIZE));
    const maxTileY = Math.min(2 ** zoom - 1, Math.floor((topLeft.y + size.height) / TILE_SIZE));
    const nextTiles = [];

    for (let x = minTileX; x <= maxTileX; x += 1) {
      for (let y = minTileY; y <= maxTileY; y += 1) {
        nextTiles.push({
          key: `${zoom}-${x}-${y}`,
          src: tileUrl(x, y, zoom),
          left: x * TILE_SIZE - topLeft.x,
          top: y * TILE_SIZE - topLeft.y
        });
      }
    }

    return nextTiles;
  }, [size.height, size.width, topLeft.x, topLeft.y, zoom]);

  const markers = useMemo<ProjectedMarker[]>(
    () =>
      stores.map((store) => {
        const point = projectPoint(store.lat, store.lng, zoom);

        return {
          store,
          left: point.x - topLeft.x,
          top: point.y - topLeft.y
        };
      }),
    [stores, topLeft.x, topLeft.y, zoom]
  );

  const mapItems = useMemo(() => {
    const cellSize = getClusterCellSize(zoom, stores.length);

    if (!cellSize) {
      return {
        clusterCount: 0,
        items: markers.map<StoreMarkerItem>((marker) => ({
          ...marker,
          key: marker.store.id,
          type: "marker"
        })),
        markerCount: markers.length
      };
    }

    const buckets = new Map<
      string,
      {
        leftTotal: number;
        stores: StoreMapPoint[];
        topTotal: number;
      }
    >();
    const items: Array<StoreMarkerItem | StoreClusterItem> = [];

    markers.forEach((marker) => {
      if (marker.store.id === selectedStoreId) {
        items.push({ ...marker, key: marker.store.id, type: "marker" });
        return;
      }

      const gridX = Math.floor(marker.left / cellSize);
      const gridY = Math.floor(marker.top / cellSize);
      const key = `${gridX}:${gridY}`;
      const bucket = buckets.get(key);

      if (bucket) {
        bucket.leftTotal += marker.left;
        bucket.topTotal += marker.top;
        bucket.stores.push(marker.store);
      } else {
        buckets.set(key, {
          leftTotal: marker.left,
          stores: [marker.store],
          topTotal: marker.top
        });
      }
    });

    buckets.forEach((bucket, key) => {
      if (bucket.stores.length === 1) {
        const store = bucket.stores[0];
        const point = projectPoint(store.lat, store.lng, zoom);
        items.push({
          key: store.id,
          left: point.x - topLeft.x,
          store,
          top: point.y - topLeft.y,
          type: "marker"
        });
        return;
      }

      items.push({
        count: bucket.stores.length,
        key: `cluster-${zoom}-${key}`,
        left: bucket.leftTotal / bucket.stores.length,
        stores: bucket.stores,
        top: bucket.topTotal / bucket.stores.length,
        type: "cluster"
      });
    });

    return {
      clusterCount: items.filter((item) => item.type === "cluster").length,
      items,
      markerCount: items.filter((item) => item.type === "marker").length
    };
  }, [markers, selectedStoreId, stores.length, topLeft.x, topLeft.y, zoom]);

  function updateZoom(nextOffset: number) {
    setZoomOffset(clamp(nextOffset, MIN_ZOOM - fitZoom, MAX_ZOOM - fitZoom));
  }

  function resetView() {
    setZoomOffset(0);
    setPanOffset({ x: 0, y: 0 });
  }

  function focusStore(store: StoreMapPoint, zoomStep = 2) {
    const nextZoomOffset = clamp(zoomOffset + zoomStep, MIN_ZOOM - fitZoom, MAX_ZOOM - fitZoom);
    const nextZoom = clamp(fitZoom + nextZoomOffset, MIN_ZOOM, MAX_ZOOM);
    const baseCenter = projectPoint(center.lat, center.lng, nextZoom);
    const targetPoint = projectPoint(store.lat, store.lng, nextZoom);

    setSelectedStoreId(store.id);
    setZoomOffset(nextZoomOffset);
    setPanOffset({
      x: baseCenter.x - targetPoint.x,
      y: baseCenter.y - targetPoint.y
    });
  }

  function focusCluster(storesInCluster: StoreMapPoint[]) {
    const [firstStore] = storesInCluster;
    if (!firstStore) return;
    focusStore(firstStore, 2);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button,a")) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({ x: event.clientX, y: event.clientY });
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart) {
      return;
    }

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    setPanOffset((value) => ({ x: value.x + deltaX, y: value.y + deltaY }));
    setDragStart({ x: event.clientX, y: event.clientY });
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragStart(null);
    setIsDragging(false);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    updateZoom(zoomOffset + (event.deltaY > 0 ? -1 : 1));
  }

  async function copySelectedStoreAddress() {
    if (!selectedStore) {
      return;
    }

    const value =
      selectedStore.address ??
      `${selectedStore.name} (${selectedStore.lat.toFixed(6)}, ${selectedStore.lng.toFixed(6)})`;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedStoreId(selectedStore.id);
      window.setTimeout(() => setCopiedStoreId(null), 1600);
    } catch {
      setCopiedStoreId(null);
    }
  }

  function scrollSelectedStoreIntoList() {
    if (!selectedStore) {
      return;
    }

    const elementId = `store-${selectedStore.id}`;
    const target = document.getElementById(elementId);
    window.history.pushState(null, "", `#${elementId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (!stores.length) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-6">
        <div className="text-sm font-semibold text-zinc-950">전체 지도</div>
        <div className="mt-4 flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
          현재 조건에서 지도에 표시할 좌표가 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.035)]">
      <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-950">전체 지도</div>
          <p className="mt-1 text-xs text-zinc-500">
            현재 필터의 좌표 등록 매장 {stores.length.toLocaleString("ko-KR")}개를 고해상도 지도에 표시합니다.
            드래그로 이동하고 휠로 확대/축소할 수 있습니다.
          </p>
          {mapItems.clusterCount > 0 ? (
            <p className="mt-1 text-xs font-medium text-zinc-600">
              가까운 좌표는 {mapItems.clusterCount.toLocaleString("ko-KR")}개 묶음으로 정리했습니다.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateZoom(zoomOffset - 1)}
            aria-label="지도 축소"
            title="축소"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950"
          >
            <ZoomOut className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="지도 전체 보기"
            title="전체 보기"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950"
          >
            <LocateFixed className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => updateZoom(zoomOffset + 1)}
            aria-label="지도 확대"
            title="확대"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        role="application"
        aria-label="매장 위치 인터랙티브 지도"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={stopDragging}
        onWheel={handleWheel}
        className={`relative h-[540px] touch-none overflow-hidden bg-zinc-100 outline-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            aria-hidden="true"
            className="absolute h-64 w-64 select-none"
            style={{ left: tile.left, top: tile.top }}
            draggable={false}
          />
        ))}
        <div className="absolute left-3 top-3 z-20 rounded-full border border-zinc-200 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-[0_6px_18px_rgba(15,23,42,0.08)] backdrop-blur">
          표시 {mapItems.markerCount.toLocaleString("ko-KR")}개
          {mapItems.clusterCount > 0 ? ` · 묶음 ${mapItems.clusterCount.toLocaleString("ko-KR")}개` : null}
        </div>
        <div className="absolute inset-0">
          {mapItems.items.map((item) => {
            if (item.type === "cluster") {
              const size = getClusterSize(item.count);

              return (
                <button
                  key={item.key}
                  type="button"
                  aria-label={`근처 매장 ${item.count.toLocaleString("ko-KR")}개 확대해서 보기`}
                  title={`${item.count.toLocaleString("ko-KR")}개 매장`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => focusCluster(item.stores)}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 bg-zinc-950/90 text-xs font-semibold tabular-nums text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)] transition hover:scale-105 hover:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
                  style={{ height: size, left: item.left, top: item.top, width: size }}
                >
                  {item.count.toLocaleString("ko-KR")}
                </button>
              );
            }

            const { store, left, top } = item;
            const isSelected = store.id === selectedStore?.id;

            return (
              <button
                key={store.id}
                type="button"
                aria-label={`${store.name} 지도 마커`}
                title={store.name}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setSelectedStoreId(store.id)}
                className={`group absolute -translate-x-1/2 -translate-y-full outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${
                  isSelected
                    ? "z-20 h-9 w-7 text-zinc-950 drop-shadow-[0_10px_16px_rgba(15,23,42,0.22)]"
                    : "z-10 h-6 w-5 text-zinc-900/80 drop-shadow-[0_4px_8px_rgba(15,23,42,0.16)] hover:h-7 hover:w-6 hover:text-zinc-950"
                }`}
                style={{ left, top }}
              >
                <svg viewBox="0 0 28 36" className="h-full w-full" aria-hidden="true">
                  <path
                    d="M14 1.6c6.5 0 11.7 5.2 11.7 11.5 0 8.4-9.2 18.3-11.1 20.2a.9.9 0 0 1-1.2 0C11.5 31.4 2.3 21.5 2.3 13.1 2.3 6.8 7.5 1.6 14 1.6Z"
                    className={isSelected ? "fill-amber-400 stroke-zinc-950" : "fill-white/95 stroke-zinc-900/80"}
                    strokeWidth="1.6"
                  />
                  <circle
                    cx="14"
                    cy="13"
                    r={isSelected ? "4.2" : "3.6"}
                    className={isSelected ? "fill-zinc-950" : "fill-zinc-900/80 group-hover:fill-amber-500"}
                  />
                </svg>
              </button>
            );
          })}
        </div>
        {selectedStore ? (
          <div className="absolute bottom-4 left-4 right-4 max-w-md rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="space-y-3">
              <div>
                <div className="line-clamp-1 text-sm font-semibold text-zinc-950">{selectedStore.name}</div>
                <p className="mt-1 text-xs font-medium text-zinc-500">
                  {formatRegionLabel(selectedStore.region)} · {formatCategoryLabel(selectedStore.category)}
                </p>
                {selectedStore.address ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-600">{selectedStore.address}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={scrollSelectedStoreIntoList}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                  <ListTree className="h-3.5 w-3.5" aria-hidden="true" />
                  목록에서 보기
                </button>
                <Link
                  href={`/stores/${selectedStore.id}#location-map`}
                  className="inline-flex h-8 items-center rounded-full border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                  상세
                </Link>
                <button
                  type="button"
                  onClick={copySelectedStoreAddress}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                  {copiedStoreId === selectedStore.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {copiedStoreId === selectedStore.id ? "복사됨" : "주소 복사"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="absolute bottom-2 right-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-zinc-500">
          © OpenStreetMap contributors · © CARTO
        </div>
      </div>
    </section>
  );
}
