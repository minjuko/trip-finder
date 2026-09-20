export interface TourContent {
  id: string;
  contentTypeId: string;
  title: string;

  address: {
    primary: string;
    detail: string | null;
    zipCode: string | null;
  } | null;

  thumbnail: {
    url: string;
    copyrightType: string | null;
  } | null;

  region: {
    regionCode: string;
    districtCode: string;
  } | null;

  classification: {
    depth1: string;
    depth2: string | null;
    depth3: string | null;
  } | null;

  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface TourImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  alt: string | null;
  copyrightType: string | null;
}

export interface InformationItem {
  key: string;
  label: string;
  value: string;
}

export interface TourContentDetail extends TourContent {
  homepage: string | null;
  overview: string | null;
  images: TourImage[];
  information: InformationItem[];
}

export interface Bookmark {
  contentId: string;
  contentTypeId: string;
  title: string;
  address: string | null;
  thumbnailUrl: string | null;
  savedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}