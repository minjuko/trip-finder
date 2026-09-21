# TripFinder

공공 관광 데이터를 활용해 **지역·카테고리·키워드로 국내 관광 콘텐츠를 탐색하고, 상세정보를 확인하거나 관심 장소를 저장할 수 있는 반응형 웹서비스**입니다.

기존 React SPA에서 경험한 클라이언트 중심 상태 관리와 API 연동을 넘어, **Next.js App Router의 Server Component를 기본 경계로 두고 서버/클라이언트 책임, 외부 API runtime validation, 캐시 정책, URL 기반 검색 상태, 테스트·접근성·CI까지 직접 설계하고 검증한 개인 프로젝트**입니다.

- **Production**: https://trip-finder-mauve.vercel.app/
- **Portfolio**: https://app.notion.com/p/3e2622cea8638106bf2ce92c1a25543e
- **Technical Document**: https://app.notion.com/p/3e2622cea863810581c9dc081a76bcdf

## 핵심 구현

- **Server / Client Component 경계**: Home·Explore·Detail은 Server Component 중심으로 구성하고, 종속 필터와 Bookmark처럼 브라우저 상호작용이 필요한 영역만 Client Component로 분리
- **TourAPI server-only 통합**: 서비스 키와 외부 API 호출을 서버에 유지하고 Client Component는 필요한 경우 내부 Route Handler를 통해 데이터 조회
- **Runtime validation**: TourAPI 응답을 `unknown → Zod → Normalizer → Domain Model` 흐름으로 검증·정규화
- **URL 기반 탐색 상태**: 지역·시군구·3단계 관광 분류·키워드·페이지를 Search Params로 관리
- **외부 저장소 검증**: localStorage 북마크 데이터도 Zod로 검증하고 `useSyncExternalStore`로 UI 상태 동기화
- **품질 검증**: Vitest·React Testing Library·Playwright·axe-core와 GitHub Actions를 이용해 unit/component/E2E·접근성·CI 검증
- **Production 검증**: Vercel 배포 후 핵심 사용자 흐름 smoke test와 Lighthouse Mobile 측정

## 주요 기능

### 관광 콘텐츠 탐색

- 지역 → 시군구 기반 탐색
- 관광 분류 1 → 2 → 3단계 종속 필터
- 키워드 검색
- 12개 단위 페이지네이션
- 필터·검색·페이지 상태를 URL Search Params에 유지

검색어가 있으면 `searchKeyword2`, 없으면 `areaBasedList2`를 사용하며, 지역과 관광 분류 조건은 서버 요청 단계에서 TourAPI에 전달합니다.

### 상세정보

- 기본정보와 주소
- 이미지 갤러리
- 개요
- 콘텐츠 유형별 이용정보
- 홈페이지 링크
- 북마크 저장/해제

`detailIntro2`는 실제 응답 계약을 검증한 다음 콘텐츠 유형에 대해 제공합니다.

| contentTypeId | 유형 |
| --- | --- |
| 12 | 관광지 |
| 14 | 문화시설 |
| 39 | 음식점 |

그 외 콘텐츠 유형은 상세 페이지 자체를 실패시키지 않고 공통정보와 이미지를 제공하며, 유형별 이용정보만 생략합니다.

### 북마크

- localStorage 기반 저장/삭제
- 저장 데이터 Zod runtime validation
- 손상된 JSON 또는 잘못된 구조는 빈 목록으로 복구
- `storage` event + 같은 document의 custom event로 변경 알림
- `useSyncExternalStore`를 사용해 BookmarkButton과 BookmarkList 상태 동기화

## Tech Stack

| 구분 | 기술 |
| --- | --- |
| Framework | Next.js 16.3.5 (App Router) |
| UI | React 19.2.8, Tailwind CSS 4 |
| Language | TypeScript 5 (strict) |
| Validation | Zod 4 |
| Data | 한국관광공사 국문 관광정보 서비스(TourAPI) |
| Test | Vitest, React Testing Library, Playwright, axe-core |
| CI/CD | GitHub Actions, Vercel |

별도의 전역 상태 라이브러리나 클라이언트 데이터 패칭 라이브러리를 추가하지 않고, **Server Component·URL Search Params·브라우저 저장소라는 상태의 성격에 맞는 도구를 사용**했습니다.

## Architecture

```text
Browser
  │
  ├─ URL Search Params
  │
  ▼
Next.js App Router
  │
  ├─ Server Components ──────────────┐
  │                                  │
  ├─ Route Handlers                  │ server-only
  │   └─ 종속 필터 option 조회       │
  │                                  ▼
  │                            TourAPI Client
  │                                  │
  │                                  ▼
  │                         External DTO (unknown)
  │                                  │
  │                                  ▼
  │                            Zod Validation
  │                                  │
  │                                  ▼
  │                              Normalizer
  │                                  │
  │                                  ▼
  └──────────────────────────── Domain Model
                                     │
                                     ▼
                               UI Rendering

Client Components
  ├─ 종속 지역/분류 필터
  └─ Bookmark interaction ── localStorage
```

### Server / Client 경계

| 영역 | 경계 | 역할 |
| --- | --- | --- |
| Home | Server Component | 탐색 진입점 렌더링 |
| Explore | Server Component 중심 | Search Params 해석, TourAPI 조회, 결과 렌더링 |
| Detail | Server Component | 상세 orchestration, metadata, 렌더링 |
| 지역·분류 필터 | Client Component | 선택 변경 및 종속 option 조회 |
| BookmarkButton | Client Component | localStorage 저장/해제 |
| BookmarkList | Client Component | 브라우저 저장소 구독 및 목록 렌더링 |

TourAPI 호출 모듈과 환경변수 모듈에는 `server-only` 경계를 두어 서비스 키가 클라이언트 번들로 전달되지 않도록 했습니다.

## 외부 API 데이터 경계

TourAPI 응답을 화면에서 직접 사용하지 않습니다.

```text
TourAPI response (unknown)
        ↓
     Zod schema
        ↓
 External DTO validation
        ↓
     Normalizer
        ↓
    Domain Model
        ↓
        UI
```

실제 API를 호출하며 다음과 같은 응답 계약 차이를 확인했습니다.

- 목록 결과가 없을 때 `items: ""` 반환
- `ldongCode2`가 `{ rnum, code, name }` 형태로 지역 코드 반환
- 현재 GW API에서 과거 Detail API 예시의 일부 query parameter가 `INVALID_REQUEST_PARAMETER_ERROR` 발생
- `detailCommon2.homepage`가 plain URL이 아니라 HTML anchor markup으로 반환

이 차이를 schema와 normalizer 계층에서 흡수해 UI에는 일관된 `TourContent`, `TourContentDetail` domain model만 전달합니다.

### Service Key 정규화

data.go.kr에서 제공하는 인코딩된 서비스 키를 `URLSearchParams`에 그대로 추가하면 이미 인코딩된 값이 다시 인코딩될 수 있습니다.

```text
%2F → %252F
```

환경변수 경계에서 서비스 키를 먼저 정규화하고 URL 인코딩은 `URLSearchParams`에 맡겨 인코딩 키와 디코딩 키 입력을 동일하게 처리합니다.

## URL Search Params

Explore의 검색 상태는 별도 전역 store 대신 URL을 source of truth로 사용합니다.

```text
/explore
  ?region=
  &district=
  &category1=
  &category2=
  &category3=
  &keyword=
  &page=
```

상위 지역이나 분류가 없으면 종속된 하위 값을 제거하고, 유효하지 않은 page 값은 1로 정규화합니다. 검색 조건이 URL에 남기 때문에 직접 접근과 새로고침에서도 동일한 탐색 상태를 복원할 수 있습니다.

## Cache / Revalidation

TourAPI 데이터의 변경 특성에 따라 server-side fetch의 revalidation 시간을 구분했습니다.

| 데이터 | Revalidation |
| --- | ---: |
| 지역·분류 코드 | 24시간 |
| 목록·검색 결과 | 10분 |
| 상세정보 | 1시간 |

변경 빈도가 낮은 코드 데이터와 관광 콘텐츠에 동일한 정책을 적용하지 않고, **데이터 최신성과 외부 API 호출량 사이의 균형**을 기준으로 정책을 분리했습니다.

## Test & Quality

### Unit / Component

Vitest와 React Testing Library로 다음 영역을 검증합니다.

- TourAPI schema와 normalizer
- 지역·관광 분류 응답 변환
- 목록·키워드 검색 wrapper의 query 전달
- 상세 common / intro / image 응답 처리
- 상세정보 orchestration
- Explore query parsing 및 data orchestration
- 지역·3단계 관광 분류 필터
- 검색과 페이지네이션
- Tour card/list
- Bookmark parsing, 저장, 삭제 및 UI 동기화

외부 API fixture도 해당 endpoint의 Zod schema로 파싱해 fixture 자체와 runtime contract의 불일치를 방지합니다.

### E2E / Accessibility

Playwright E2E는 **실제 TourAPI를 사용하는 로컬 integration test**로 구성했습니다.

현재 E2E 7건은 다음 흐름을 검증합니다.

- Home 키워드 검색 → Explore
- Home 지역 진입 → Explore 필터 상태
- Detail → Bookmark 저장 → Bookmarks → 삭제
- Home / Explore / Detail / Bookmarks의 serious·critical 접근성 위반 검사

`@axe-core/playwright` 자동 검사에서 실제로 TourCard 이미지 fallback 텍스트의 색상 대비 문제를 발견했고, 대비를 수정한 뒤 E2E를 다시 통과시켰습니다.

실제 TourAPI E2E는 API key·일일 quota·외부 서비스 상태가 CI 신뢰성에 영향을 주지 않도록 CI와 분리했습니다.

## CI

GitHub Actions는 `main` push와 pull request에서 deterministic quality gate를 실행합니다.

```text
npm ci
→ ESLint
→ TypeScript typecheck
→ Vitest unit/component tests
→ Next.js production build
```

CI에서는 실제 TourAPI를 호출하지 않으며 production build에 필요한 placeholder 환경변수만 주입합니다.

Clean CI 환경에서는 로컬의 Next.js 생성 타입에 가려져 있던 Root Layout 타입 의존성 문제를 발견했고, 생성된 global 타입 대신 명시적인 `ReactNode` 기반 props 타입으로 수정해 CI를 통과시켰습니다.

## Performance & Accessibility

Vercel Production 환경에서 Chrome Lighthouse Mobile을 측정했습니다.

| Page | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | **99** | 100 | 100 | 100 | 2.0s | 80ms | 0 |
| Explore | **97** | 100 | 100 | 100 | 2.4s | 130ms | 0 |
| Detail | **92** | 100 | 100 | 100 | 2.1s | 320ms | 0 |

Explore에서 이미지 전송량 개선 가능성, Detail에서 TBT 증가와 bfcache 제한을 확인했습니다. LCP·CLS와 전체 결과를 함께 검토해 Lighthouse 점수만을 높이기 위한 추가 복잡성은 도입하지 않고 개선 후보로 기록했습니다.

## Project Structure

```text
src/
├── app/
│   ├── api/                    # 종속 필터용 Route Handlers
│   ├── bookmarks/
│   ├── explore/
│   └── places/[contentId]/
├── components/
│   ├── bookmark/
│   ├── layout/
│   ├── search/
│   └── tour/
├── lib/
│   ├── bookmarks/              # schema / localStorage
│   ├── search/                 # query parsing / explore orchestration
│   └── tour-api/
│       ├── __fixtures__/
│       ├── normalizers/
│       └── schemas/
├── test/
└── types/
e2e/
├── accessibility.spec.ts
├── bookmark.spec.ts
└── home-explore.spec.ts
```

## Getting Started

### 환경

CI와 최종 검증은 **Node.js 22** 환경을 기준으로 수행했습니다.

### 설치

```bash
npm install
```

### 환경변수

프로젝트 루트에 `.env.local`을 만들고 data.go.kr에서 발급받은 TourAPI 서비스 키를 설정합니다.

```bash
TOUR_API_SERVICE_KEY=your_service_key
```

### 개발 서버

```bash
npm run dev
```

기본 개발 주소는 `http://localhost:3000`입니다.

## Scripts

```bash
npm run dev          # 개발 서버
npm run build        # production build
npm run start        # production server
npm run lint         # ESLint
npm run typecheck    # TypeScript strict typecheck
npm run test         # Vitest
npm run test:watch   # Vitest watch
npm run test:e2e     # Playwright
npm run test:e2e:ui  # Playwright UI
```

Playwright 최초 실행 전 Chromium이 설치되어 있지 않다면 다음 명령이 필요합니다.

```bash
npx playwright install chromium
```

실제 TourAPI를 사용하는 E2E 실행에는 유효한 `TOUR_API_SERVICE_KEY`가 필요합니다.

## Data Source

TripFinder는 한국관광공사 **국문 관광정보 서비스(TourAPI)**를 사용합니다.

| Endpoint | 용도 |
| --- | --- |
| `ldongCode2` | 지역·시군구 코드 |
| `lclsSystmCode2` | 관광 분류 체계 |
| `areaBasedList2` | 조건 기반 관광 콘텐츠 목록 |
| `searchKeyword2` | 키워드 검색 |
| `detailCommon2` | 상세 기본정보 |
| `detailIntro2` | 콘텐츠 유형별 이용정보 |
| `detailImage2` | 상세 이미지 |

## Verification

최종 검증 범위:

- TypeScript strict typecheck
- ESLint
- Vitest unit/component tests
- Playwright core E2E 7건
- axe automated accessibility checks
- Next.js production build
- GitHub Actions CI
- Vercel Production smoke test
- `npm audit`: **0 vulnerabilities**
- Production Lighthouse Mobile 측정

의존성 최종 점검에서는 `npm audit` 0건을 확인했으며, 검증된 프로젝트 조합을 유지하기 위해 완성 시점의 major dependency upgrade는 별도로 진행하지 않았습니다.

## Documentation

구현 과정에서 확인한 TourAPI 응답 계약, Server/Client Component 경계, cache 전략, 테스트 설계, CI 문제 해결과 성능 측정 과정은 포트폴리오와 상세 기술문서에 정리했습니다.

- **Portfolio**: https://app.notion.com/p/3e2622cea8638106bf2ce92c1a25543e
- **Technical Document**: https://app.notion.com/p/3e2622cea863810581c9dc081a76bcdf
