# TripFinder

[![CI](https://github.com/minjuko/trip-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/minjuko/trip-finder/actions/workflows/ci.yml)

공공 관광 데이터를 활용해 **지역·카테고리·키워드로 국내 여행지를 탐색하고, 상세 정보를 확인하거나 관심 여행지로 저장하는 반응형 웹서비스**입니다.

Next.js App Router의 렌더링 경계, TourAPI 데이터 검증, URL 기반 검색 상태 관리를 직접 설계·구현했습니다.

- **Production**: https://trip-finder-mauve.vercel.app/
- **Portfolio**: https://app.notion.com/p/3e2622cea8638106bf2ce92c1a25543e
- **Technical Document**: https://app.notion.com/p/3e2622cea863810581c9dc081a76bcdf

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 형태 | 개인 프로젝트 |
| 주요 기술 | Next.js · React · TypeScript · Tailwind CSS · Zod |
| 외부 데이터 | 한국관광공사 TourAPI |
| 품질 검증 | Vitest · Playwright · GitHub Actions |

## 주요 기능 및 화면

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/images/01-home-desktop.png" alt="TripFinder 홈 화면" />
      <br />
      <sub>홈 — 키워드 검색과 빠른 탐색으로 여행지 탐색을 시작합니다.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/images/02-explore-search-desktop.png" alt="지역과 키워드가 적용된 여행지 탐색 결과" />
      <br />
      <sub>탐색 — 키워드·지역 필터와 URL 기반 조건으로 결과를 조회합니다.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/images/03-detail-desktop.png" alt="경복궁 여행지 상세 화면" />
      <br />
      <sub>상세 — 이미지, 주소, 저장·공유·지도 이동을 한 화면에서 제공합니다.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/images/04-bookmarks-desktop.png" alt="저장한 여행지 목록 화면" />
      <br />
      <sub>관심 여행지 — 브라우저에 저장한 여행지를 다시 확인하고 삭제합니다.</sub>
    </td>
  </tr>
</table>

### 주요 기능

- **여행지 탐색**: 지역 → 시군구, 관광 분류 1 → 2 → 3단계 종속 필터, 키워드 검색, 정렬·페이지네이션, 카드·목록·지도 보기 전환
- **상세 정보**: 이미지 갤러리·확대, 개요·유형별 정보, 주소 복사, 링크 공유, 지도·공식 홈페이지 이동
- **관심 여행지**: localStorage 기반 저장·삭제, 손상된 저장 데이터 복구, 목록과 버튼의 실시간 상태 동기화
- **검색 노출·접근성**: metadata, robots.txt, sitemap.xml, 장소 구조화 데이터와 키보드 조작 가능한 이미지 모달 제공

## 기술 스택

| 구분     | 기술                                                                        |
| -------- | --------------------------------------------------------------------------- |
| Frontend | Next.js 16.4.2, React 19.2.8, TypeScript 5 (strict), Tailwind CSS 4         |
| Data     | 한국관광공사 TourAPI, Zod 4, Leaflet, OpenStreetMap                         |
| Quality  | Vitest, React Testing Library, Playwright, axe-core, GitHub Actions, Vercel |

## 담당 역할 및 핵심 구현

- **렌더링 경계:** Home·Explore·Detail은 Server Component 중심으로 구성하고, 필터·북마크 등 상호작용을 Client Component로 분리했습니다.
- **데이터 검증:** TourAPI 응답을 Zod로 검증하고 정규화해 외부 DTO와 UI 도메인 모델을 분리했습니다.
- **검색 상태:** 지역·분류·검색어·정렬·페이지를 URL Search Params로 관리해 직접 접근과 새로고침에서도 조건을 유지합니다.
- **오류 대응:** 인증·호출 제한·서버 오류를 구분하고 데이터 유형에 따라 재검증 정책을 적용했습니다.

자세한 API 계약·캐시 정책·문제 해결 과정은 [상세 기술문서](https://app.notion.com/p/3e2622cea863810581c9dc081a76bcdf)에서 확인할 수 있습니다.

## 실행 방법

```bash
npm install

# .env.local
TOUR_API_SERVICE_KEY=your_service_key

npm run dev
```

| Script              | 설명                         |
| ------------------- | ---------------------------- |
| `npm run lint`      | ESLint 검사                  |
| `npm run typecheck` | TypeScript strict 검사       |
| `npm run test`      | Vitest unit/component 테스트 |
| `npm run test:e2e`  | Playwright E2E 테스트        |
| `npm run build`     | Next.js production build     |

## 테스트 및 검증

| 항목              | 결과                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Unit / Component  | Vitest **30개 파일 / 154개 테스트** 통과                                                            |
| E2E / 접근성      | Playwright **12개 시나리오**(고정 fixture 기반) 및 axe 검사 통과 |
| 정적 검사·배포    | ESLint, TypeScript strict, Next.js production build, GitHub Actions CI, Vercel Production 검증 완료 |
| 운영 의존성 보안  | `npm audit --omit=dev` 취약점 0건 |

## 관련 문서

- [포트폴리오](https://app.notion.com/p/3e2622cea8638106bf2ce92c1a25543e) · [기술문서](https://app.notion.com/p/3e2622cea863810581c9dc081a76bcdf)
- [모바일·접근성 검증](docs/mobile-accessibility-audit-2026.md) · [성능 측정](docs/explore-performance-audit-2026.md)
