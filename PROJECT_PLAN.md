# TripFinder

## Project Goal

공공 관광 데이터를 활용해 지역·카테고리·키워드로 국내 관광 콘텐츠를 탐색하고,
상세정보를 확인하거나 관심 장소를 저장할 수 있는 Desktop-first 반응형 웹서비스.

## Core Features

- 지역 기반 관광 콘텐츠 탐색
- 키워드 검색
- 관광지 / 문화시설 / 음식점 필터
- 관광 콘텐츠 상세정보
- 북마크

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zod
- Vitest
- React Testing Library
- Playwright

## Architecture Decisions

1. Server Component by default
2. TourAPI is accessed only from the server
3. Search/filter state is stored in URL Search Params
4. External DTO and domain models are separated
5. External API responses are validated with Zod
6. Bookmarks use localStorage in v1
7. No global state library unless a concrete requirement emerges

## Routes

- /
- /explore
- /places/[contentId]
- /bookmarks

## Supported Content Types

- 12: 관광지
- 14: 문화시설
- 39: 음식점

## Quality Goals

- TypeScript strict
- Runtime validation
- Responsive UI
- Accessibility
- Unit/component tests
- Core E2E journeys
- GitHub Actions CI
- Production deployment
- Lighthouse/Core Web Vitals measurement