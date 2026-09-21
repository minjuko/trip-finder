# TripFinder

공공 관광 데이터를 활용해 **지역·카테고리·키워드로 국내 관광 콘텐츠를 탐색하고, 상세정보를 확인하거나 관심 장소를 저장할 수 있는 반응형 웹서비스**입니다.

기존 React SPA에서 경험한 클라이언트 중심 상태 관리와 API 연동을 넘어, Next.js App Router의 Server Component를 기본 경계로 두고 외부 API 검증, 서버 전용 인증정보, 캐시 정책, URL 기반 검색 상태, 접근성 및 E2E까지 포함한 구조를 구현했습니다.

## Live

- Production: https://trip-finder-mauve.vercel.app/

## 주요 기능

- **여행지 탐색**: 지역·시군구 및 3단계 관광 분류를 조합해 콘텐츠 탐색
- **키워드 검색**: 검색어 유무에 따라 TourAPI의 검색/목록 endpoint를 구분해 서버에서 조회
- **URL 기반 상태**: 지역, 카테고리, 키워드, 페이지 상태를 Search Params로 유지해 새로고침·직접 접근·공유 가능
- **상세정보**: 관광 콘텐츠의 기본정보, 이미지, 개요와 콘텐츠 유형별 이용정보 제공
- **북마크**: 관심 장소를 localStorage에 저장하고 별도 페이지에서 조회·삭제
- **반응형 UI**: Desktop sidebar를 기준으로 Tablet/Mobile까지 탐색 흐름 유지

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

별도의 전역 상태 라이브러리나 클라이언트 데이터 패칭 라이브러리를 추가하지 않고, Server Component·URL Search Params·브라우저 저장소라는 각 상태의 성격에 맞는 기본 도구를 사용했습니다.

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

페이지와 데이터 조회는 Server Component를 기본으로 구성하고, `useEffect`, 이벤트 처리, `localStorage`처럼 브라우저 기능이 필요한 부분만 Client Component로 분리했습니다. TourAPI 호출 모듈에는 `server-only` 경계를 두어 서비스 키가 클라이언트 번들로 전달되지 않도록 했습니다.

### 외부 API 경계

TourAPI 응답을 화면에서 직접 사용하지 않고 다음 단계로 분리했습니다.

```text
TourAPI response
→ Zod schema
→ DTO validation
→ normalizer
→ TourContent / TourContentDetail
→ UI
```

실제 TourAPI는 목록이 없을 때 `items`가 객체가 아닌 빈 문자열로 내려오는 등 응답 형태가 달라질 수 있습니다. 이러한 외부 응답 차이는 schema와 normalizer 계층에서 흡수하고, UI에는 일관된 domain model만 전달합니다.

### Server / Client 경계

- Home, Explore, Detail page는 Server Component 중심으로 구성
- TourAPI service key와 외부 API 호출은 서버에만 위치
- 지역·카테고리의 종속 select는 Client Component에서 내부 Route Handler를 호출
- Detail page 전체를 Client Component로 전환하지 않고 Bookmark 버튼만 client boundary로 격리
- 북마크 페이지의 브라우저 저장소 상태는 `useSyncExternalStore`를 사용해 같은 document와 다른 탭의 변경을 동기화

### 검색 상태

Explore의 상태는 별도 전역 store 대신 URL Search Params에 저장합니다.

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

상위 지역/분류가 변경되면 종속된 하위 값을 제거하고, 필터가 변경되면 페이지를 초기화합니다. 검색 조건이 URL에 남기 때문에 직접 접근과 새로고침에서도 동일한 탐색 상태를 복원할 수 있습니다.

### Cache / Revalidation

TourAPI의 데이터 성격에 따라 server-side fetch의 revalidation 시간을 구분했습니다.

| 데이터 | Revalidation |
| --- | ---: |
| 지역·분류 코드 | 24시간 |
| 목록·검색 결과 | 10분 |
| 상세정보 | 1시간 |

변경 빈도가 낮은 코드 데이터와 관광 콘텐츠를 동일한 주기로 요청하지 않도록 분리해 API 호출량과 데이터 최신성 사이의 균형을 맞췄습니다.

## Runtime Validation

외부 API뿐 아니라 localStorage도 신뢰할 수 없는 runtime input으로 취급합니다.

북마크 데이터는 JSON parsing 후 Zod schema를 통과한 경우에만 사용하며, 손상된 JSON이나 예상하지 않은 구조가 저장돼 있으면 빈 배열로 복구합니다. 저장 직전에도 동일한 schema로 검증해 잘못된 데이터가 persistent storage에 기록되지 않도록 했습니다.

## Test & Quality

### Unit / Component

Vitest와 React Testing Library로 다음 영역을 검증합니다.

- TourAPI schema와 normalizer
- 지역·관광 분류 응답 변환
- 목록·키워드 검색 wrapper의 query 전달
- 상세 common / intro / image 응답 처리
- Explore query parsing 및 orchestration
- 지역·3단계 카테고리 필터
- Pagination과 검색 UI
- Tour card/list
- Bookmark parsing, 저장, 삭제 및 UI 동기화

외부 API fixture 역시 각 endpoint의 Zod schema로 파싱해 fixture와 실제 runtime contract가 어긋나는 문제를 조기에 확인합니다.

### E2E / Accessibility

Playwright로 실제 TourAPI를 사용하는 로컬 핵심 사용자 여정을 검증했습니다.

- Home 검색 → Explore
- 지역 탐색 진입
- Detail 조회
- Bookmark 저장 → 목록 확인 → 삭제
- Home / Explore / Detail / Bookmarks 자동 접근성 검사

`@axe-core/playwright`를 사용해 serious/critical 접근성 위반을 자동 검사하며, 실제 검사에서 발견된 이미지 fallback 텍스트 명도 대비 문제를 수정했습니다.

실제 TourAPI E2E는 API key·일일 quota·외부 서비스 상태에 CI 결과가 종속되지 않도록 로컬 integration 검증으로 분리했습니다.

## CI

GitHub Actions의 deterministic quality gate는 `main` push와 pull request에서 다음 순서로 실행됩니다.

```text
npm ci
→ ESLint
→ TypeScript typecheck
→ Vitest
→ Next.js production build
```

CI에서는 실제 TourAPI를 호출하지 않으며 build에 필요한 placeholder 환경변수만 주입합니다.

## Performance & Accessibility

Vercel production 환경에서 Chrome Lighthouse Mobile을 측정했습니다.

| Page | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 99 | 100 | 100 | 100 | 2.0s | 80ms | 0 |
| Explore | 97 | 100 | 100 | 100 | 2.4s | 130ms | 0 |
| Detail | 92 | 100 | 100 | 100 | 2.1s | 320ms | 0 |

Explore에서 이미지 전송량 개선 가능성과 Detail의 TBT 증가 및 bfcache 제한을 확인했지만, LCP·CLS와 전체 측정 결과를 함께 검토해 Lighthouse 점수만을 위한 추가 복잡성은 도입하지 않았습니다.

## Project Structure

```text
src/
├── app/
│   ├── api/                 # Client Component용 서버 API 경계
│   ├── bookmarks/
│   ├── explore/
│   └── places/[contentId]/
├── components/
│   ├── bookmark/
│   ├── layout/
│   ├── search/
│   └── tour/
├── lib/
│   ├── bookmarks/           # localStorage schema / storage
│   ├── search/              # query parsing / explore orchestration
│   └── tour-api/
│       ├── __fixtures__/
│       ├── normalizers/
│       └── schemas/
├── test/
└── types/
e2e/
└── *.spec.ts
```

## Getting Started

### 1. 환경

- Node.js 22
- npm

### 2. 설치

```bash
npm install
```

### 3. 환경변수

프로젝트 루트에 `.env.local`을 만들고 data.go.kr에서 발급받은 TourAPI 서비스 키를 설정합니다.

```bash
TOUR_API_SERVICE_KEY=your_service_key
```

서비스 키는 인코딩 키/디코딩 키 형태를 모두 처리할 수 있도록 서버 경계에서 정규화합니다.

### 4. 개발 서버

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
npm run typecheck    # TypeScript
npm run test         # Vitest
npm run test:watch   # Vitest watch
npm run test:e2e     # Playwright
npm run test:e2e:ui  # Playwright UI
```

Playwright 최초 실행 전 브라우저가 설치되어 있지 않다면 다음 명령이 필요합니다.

```bash
npx playwright install chromium
```

## Data Source

TripFinder는 한국관광공사 **국문 관광정보 서비스(TourAPI)**를 사용합니다.

주요 사용 endpoint:

- `ldongCode2`: 지역·시군구 코드
- `lclsSystmCode2`: 관광 분류 체계
- `areaBasedList2`: 조건 기반 관광 콘텐츠 목록
- `searchKeyword2`: 키워드 검색
- `detailCommon2`: 상세 기본정보
- `detailIntro2`: 콘텐츠 유형별 이용정보
- `detailImage2`: 상세 이미지

상세 이용정보는 실제 응답 계약을 검증한 관광지(12), 문화시설(14), 음식점(39)에 대해 제공하며, 그 외 콘텐츠 유형은 공통정보와 이미지 중심으로 상세 페이지를 구성합니다.

## Verification

최종 검증 범위:

- TypeScript strict typecheck
- ESLint
- Vitest unit/component tests
- Playwright core E2E
- axe automated accessibility checks
- Next.js production build
- GitHub Actions CI
- Vercel production smoke test
- `npm audit`: 0 vulnerabilities
- Production Lighthouse Mobile 측정
