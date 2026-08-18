"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Check, Clipboard, LocateFixed, ListTree, MapPinned, ZoomIn, ZoomOut } from "lucide-react";
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
      <section className="tt-map-shell">
        <div className="tt-map-shell__header">
          <div className="tt-map-title">전체 지도</div>
        </div>
        <div className="tt-empty-state">
          현재 조건에서 지도에 표시할 좌표가 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="tt-map-shell">
      <div className="tt-map-shell__header">
        <div className="tt-map-title-row">
          <div className="tt-map-icon">
            <MapPinned className="tt-icon-sm" aria-hidden="true" strokeWidth={2} />
          </div>
          <div>
          <div className="tt-map-title">인터랙티브 매장 지도</div>
          <p className="tt-map-description">
            현재 필터의 좌표 등록 매장 {stores.length.toLocaleString("ko-KR")}개를 고해상도 지도에 표시합니다.
            드래그로 이동하고 휠로 확대/축소할 수 있습니다.
          </p>
          {mapItems.clusterCount > 0 ? (
            <p className="tt-map-description">
              가까운 좌표는 {mapItems.clusterCount.toLocaleString("ko-KR")}개 묶음으로 정리했습니다.
            </p>
          ) : null}
          </div>
        </div>
        <div className="tt-map-controls">
          <button
            type="button"
            onClick={() => updateZoom(zoomOffset - 1)}
            aria-label="지도 축소"
            title="축소"
            className="tt-icon-button"
          >
            <ZoomOut className="tt-icon-sm" aria-hidden="true" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="지도 전체 보기"
            title="전체 보기"
            className="tt-icon-button"
          >
            <LocateFixed className="tt-icon-sm" aria-hidden="true" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => updateZoom(zoomOffset + 1)}
            aria-label="지도 확대"
            title="확대"
            className="tt-icon-button"
          >
            <ZoomIn className="tt-icon-sm" aria-hidden="true" strokeWidth={2} />
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
        className={`tt-map-canvas ${
          isDragging ? "tt-map-canvas--dragging" : "tt-map-canvas--idle"
        }`}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            aria-hidden="true"
            className="tt-map-tile"
            style={{ left: tile.left, top: tile.top }}
            draggable={false}
          />
        ))}
        <div className="tt-map-count">
          좌표 {stores.length.toLocaleString("ko-KR")}개 · 표시 {mapItems.markerCount.toLocaleString("ko-KR")}개
          {mapItems.clusterCount > 0 ? ` · 묶음 ${mapItems.clusterCount.toLocaleString("ko-KR")}개` : null}
        </div>
        <div className="tt-map-items">
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
                  className="tt-map-cluster"
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
                className={`tt-map-marker ${isSelected ? "tt-map-marker--selected" : ""}`}
                style={{
                  height: isSelected ? 40 : 28,
                  left,
                  top,
                  width: isSelected ? 32 : 24
                }}
              >
                <svg viewBox="0 0 28 36" className="tt-map-marker__pin" aria-hidden="true">
                  <path
                    d="M14 1.6c6.5 0 11.7 5.2 11.7 11.5 0 8.4-9.2 18.3-11.1 20.2a.9.9 0 0 1-1.2 0C11.5 31.4 2.3 21.5 2.3 13.1 2.3 6.8 7.5 1.6 14 1.6Z"
                    className="tt-map-marker__pin-body"
                    strokeWidth="1.6"
                  />
                  <circle
                    cx="14"
                    cy="13"
                    r={isSelected ? "4.2" : "3.6"}
                    className="tt-map-marker__pin-dot"
                  />
                </svg>
              </button>
            );
          })}
        </div>
        {selectedStore ? (
          <div className="tt-map-popover">
            <div>
              <div>
                <div className="tt-badge tt-badge--muted">
                  선택된 매장
                </div>
                <div className="tt-map-popover__title">{selectedStore.name}</div>
                <p className="tt-map-description">
                  {formatRegionLabel(selectedStore.region)} · {formatCategoryLabel(selectedStore.category)}
                </p>
                {selectedStore.address ? (
                  <p className="tt-map-description">{selectedStore.address}</p>
                ) : null}
              </div>
              <div className="tt-map-popover__actions">
                <button
                  type="button"
                  onClick={scrollSelectedStoreIntoList}
                  className="tt-button tt-button--outline tt-button--sm"
                >
                  <ListTree className="tt-icon-sm" aria-hidden="true" />
                  목록에서 보기
                </button>
                <Link
                  href={`/stores/${selectedStore.id}#location-map`}
                  className="tt-button tt-button--outline tt-button--sm"
                >
                  상세
                </Link>
                <button
                  type="button"
                  onClick={copySelectedStoreAddress}
                  className="tt-button tt-button--outline tt-button--sm"
                >
                  {copiedStoreId === selectedStore.id ? (
                    <Check className="tt-icon-sm" aria-hidden="true" />
                  ) : (
                    <Clipboard className="tt-icon-sm" aria-hidden="true" />
                  )}
                  {copiedStoreId === selectedStore.id ? "복사됨" : "주소 복사"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="tt-map-credit">
          © OpenStreetMap contributors · © CARTO
        </div>
      </div>
    </section>
  );
}
