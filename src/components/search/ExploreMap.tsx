"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import type { TourContent } from "@/types/tour";

interface ExploreMapProps {
  contents: TourContent[];
}

const markerIcon = L.divIcon({
  className: "tripfinder-map-marker",
  html: '<span aria-hidden="true"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

const MapViewport = ({ contents }: { contents: TourContent[] }) => {
  const map = useMap();

  useEffect(() => {
    const coordinates = contents.flatMap((content) =>
      content.coordinates ? [content.coordinates] : [],
    );

    if (coordinates.length === 1) {
      map.setView([coordinates[0].latitude, coordinates[0].longitude], 13);
      return;
    }

    const bounds = L.latLngBounds(
      coordinates.map(({ latitude, longitude }) => [latitude, longitude]),
    );

    map.fitBounds(bounds, {
      padding: [32, 32],
      maxZoom: 13,
    });
  }, [contents, map]);

  return null;
};

export const ExploreMap = ({ contents }: ExploreMapProps) => {
  const mappedContents = contents.filter((content) => content.coordinates);

  if (mappedContents.length === 0) {
    return (
      <div className="flex min-h-[28rem] items-center justify-center rounded-3xl border border-dashed border-line bg-surface-subtle px-6 text-center">
        <div>
          <p className="font-semibold text-slate-900">
            지도에 표시할 위치 정보가 없습니다.
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            카드형 보기로 전환해 다른 여행지를 확인해보세요.
          </p>
        </div>
      </div>
    );
  }

  const first = mappedContents[0].coordinates!;

  return (
    <div
      role="region"
      aria-label="검색 결과 지도"
      className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm shadow-slate-200/40"
    >
      <MapContainer
        center={[first.latitude, first.longitude]}
        zoom={10}
        scrollWheelZoom
        className="h-[28rem] w-full sm:h-[38rem]"
        aria-label="검색 결과 지도"
      >
        <MapViewport contents={mappedContents} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappedContents.map((content) => {
          const coordinates = content.coordinates!;

          return (
            <Marker
              key={content.id}
              position={[coordinates.latitude, coordinates.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="min-w-40">
                  <p className="font-semibold text-slate-900">
                    {content.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {content.address?.primary ?? "주소 정보 없음"}
                  </p>
                  <Link
                    href={`/places/${content.id}`}
                    className="mt-3 inline-flex text-xs font-semibold text-brand"
                  >
                    상세정보 보기 →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <p className="border-t border-line px-4 py-3 text-xs text-ink-muted">
        현재 페이지의 {mappedContents.length}개 여행지를 지도에 표시했습니다.
      </p>
    </div>
  );
};
