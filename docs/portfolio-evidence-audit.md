# TripFinder 포트폴리오 근거 감사

> 공개용 기본 포트폴리오를 위한 코드·테스트·성능 근거 정리. 확인하지 못한 효과는 성과로 표현하지 않는다.

## 감사 범위와 환경

- 저장소: minjuko/trip-finder
- 기준 commit: 72d666246f14e53daec6a6f7af0ec75a2e7ae311 (2026-10-28)
- 1차 감사: 2026-11-06, 후속 검증: 2026-11-07 (Asia/Seoul)
- 환경: Windows PowerShell, Next.js 16.4.2, React 19.2.8, Vitest 5.0.1, Playwright 1.63.0.
- 시작 시 작업 트리는 깨끗했다. .env.local은 production build에서 사용됐지만 값은 출력하거나 기록하지 않았다. E2E는 설정된 fixture 전용 환경변수로 실행했다.
- AGENTS.md에 따라 설치된 Next.js Server/Client Components, Fonts, Lazy Loading 가이드를 확인했다.

## 기능별 코드 및 테스트 근거

| 기능 | 설계 배경·한계 | 현재 구현과 핵심 경로 | 테스트 | 구현과 기록의 차이 |
| --- | --- | --- | --- | --- |
| TourAPI Zod 검증·정규화 | 외부 응답 누락·형식 오류와 빈 값이 UI 모델에 전파될 수 있고 유형별 상세 필드가 다르다. | src/lib/tour-api/schemas/common.ts의 createTourApiResponseSchema와 schemas/list.ts의 tourListItemSchema가 계약을 검사한다. area-based-list.ts는 parse 후 normalizers/tour-content.ts의 normalizeTourListResponse로 도메인 모델을 만든다. detailInfo2는 schemas/detail-info.ts에서 envelope와 record만 검사하고 normalizers/detail-info.ts가 의미 있는 문자열을 추린다. | schemas/list.test.ts, schemas/region.test.ts, schemas/classification.test.ts, normalizers/tour-content.test.ts, normalizers/detail-info.test.ts, 상세 schema/normalizer 테스트 | 코드와 fixture 단위 테스트로 확인. 실제 운영 API 전체 계약 테스트는 아니다. detailInfo2 개별 필드는 의도적으로 느슨하게 검증한다. |
| 상세 반복정보 ID·React key | 같은 관광 콘텐츠의 여러 행이 content ID를 공유하므로 ID만 key로 쓰면 React sibling key가 충돌할 수 있다. | normalizers/detail-info.ts의 normalizeTourDetailInfo가 content ID·제목·설명으로 합성 ID를 만들고 완전 중복을 제거한다. components/tour/TourDetailRepeatingInformation.tsx는 item.id를 key로 쓴다. | normalizers/detail-info.test.ts에서 같은 content ID의 서로 다른 행은 보존하고 exact duplicate는 제거함을 확인 | 반복 상세 행에 대해서는 구현과 설명이 일치한다. 모든 목록 콘텐츠의 중복 ID 제거는 확인되지 않았다. 합성 문자열 delimiter 충돌 및 중복 image serialnum은 미검증이다. |
| URL Search Params 상태 | 새로고침·링크 공유·뒤로 가기 후 검색 조건을 복원하고 잘못된 종속 필터를 정리할 필요가 있다. | app/explore/page.tsx의 비동기 searchParams를 lib/search/explore-query.ts의 parseExploreQuery가 정규화한다. 검색·필터·정렬·보기·페이지 컴포넌트가 URL을 갱신하고 초과 페이지는 redirect한다. | explore-query.test.ts, ExploreSearch/RegionFilter/ClassificationFilter/SortSelect/Pagination 테스트, E2E home-explore.spec.ts | 코드·단위·E2E에서 확인. Playwright는 Chromium 프로젝트 한 개다. |
| 북마크 localStorage·탭 동기화 | 브라우저 저장값이 손상될 수 있고 열린 탭의 변경을 서로 전달해야 한다. | lib/bookmarks/storage.ts의 parseBookmarks가 JSON 및 Zod 검증 실패를 빈 배열로 복구한다. BookmarkButton과 BookmarkList는 같은 탭의 bookmarkschange와 다른 탭의 storage 이벤트를 useSyncExternalStore로 구독한다. | storage.test.ts, BookmarkButton.test.tsx, BookmarkList.test.tsx, E2E bookmark.spec.ts | 저장·삭제·페이지 간 유지와 실제 두 탭의 저장/삭제 동기화 및 새로고침 상태를 Chromium E2E로 확인했다. |
| Server/Client Component 분리 | 브라우저 이벤트가 필요한 부분만 클라이언트로 두고 데이터 요청·서비스 키는 서버에 둔다. | app 페이지와 layout은 기본 Server Component. app/explore/page.tsx가 서버에서 데이터를 조회하고 상호작용 모듈만 use client를 선언한다. lib/env.ts는 server-only와 서버 전용 키를 사용한다. | TypeScript 검사, production build, 주요 Playwright 흐름 | 구조는 코드로 확인. 경계별 번들 및 비밀값 비노출 별도 분석은 수행하지 않았다. |
| 폰트·지도 지연 로딩 | 과거 Lighthouse 기록은 외부 Paperlogy 폰트와 기본 보기의 Leaflet 코드를 전송량 후보로 지목했다. | app/globals.css는 500을 400 폰트 파일, 600을 700 파일에 연결한다(9 weight 선언, 7 URL). ExploreMapLoader.tsx가 next/dynamic과 ssr:false로 지도를 나누고 app/explore/page.tsx의 map 분기에서만 렌더한다. | E2E의 보기 전환·지도 marker, production build. 후속 TF09 동일 fixture 비교는 아래에 별도 기록 | 초기 감사 당시에는 코드만 확인했다. 후속 반복 실험에서 카드 보기의 Leaflet 요청 0/5, 4초 JS 45,601 bytes 감소를 확인했다. CSS 선언 수만으로 폰트 요청 수를 단정하지 않는다. |

## 현재 검증 결과

| 명령 | 결과 |
| --- | --- |
| npm.cmd run format:check | 통과. 기존 코드에 포맷 불일치 없음. 쓰기 형식 명령은 실행하지 않음. |
| npm.cmd run lint | 후속 단독 실행 통과. 11,587ms, exit code 0, 60초 timeout 제한 |
| npm.cmd run typecheck | 통과, tsc --noEmit exit code 0 |
| npm.cmd test -- --reporter=dot | Vitest 32개 파일, 166개 테스트 모두 통과 |
| npm.cmd run test:e2e -- --workers=1 | Playwright 21개 테스트 모두 통과, Chromium, fixture 사용, 약 1.2분 |
| npm.cmd run build | Next.js 16.4.2 production build 통과. TypeScript와 정적 페이지 생성 완료. .env.local 사용, 값 미출력. |

과거 자료의 Vitest 154개/Playwright 12개는 이전 상태다. 후속 검증 기준 Vitest 166개와 Playwright 21개가 실행 통과했다. 4-worker Playwright 실행에서는 기존 home-explore 상호작용 assertion이 두 번 간헐적으로 실패했지만, CI 설정과 동일하게 worker를 1개로 제한한 전체 실행은 21개 모두 통과했다. 병렬 실패의 원인은 확정하지 않았고 앱 코드 변경으로 숨기지 않았다.

## 과거 성능 기록 신뢰도

기준 자료는 docs/explore-performance-audit-2026.md다. 2026-10-14 로컬 production server와 실제 TourAPI 데이터를 쓴 Lighthouse Mobile 실험으로 전후 각각 3회 중앙값을 기록했다. 당시 환경은 Node 22.20.0, npm 10.9.3, Next 16.3.5, Chrome 155.0.8059.39, Lighthouse 13.5.0, 화면 412×823 CSS px/DPR 1.75, 네트워크 simulated RTT 150ms·1,638.4Kbps, CPU 4×, 브라우저 cold cache라고 명시한다. 서버 데이터는 예열 및 Next 캐시를 썼으나 API 원본 본문은 고정하지 않았다.

| 지표 | 기준선 중앙값 | 수정 후 중앙값 | 해석 |
| --- | ---: | ---: | --- |
| Performance | 66 | 69 | +3점, 3회 표본 |
| LCP | 7,161ms | 5,318ms | -1,843ms, 약 -25.7% 기록 |
| 전송량 | 1,249,259 bytes | 880,359 bytes | -368,900 bytes, 약 -29.5% 기록 |
| TBT | 12ms | 248ms | +236ms 악화 |

신뢰도는 조건이 문서화된 제한적 과거 실험이다. Markdown에 방법·개별 지표·변경 파일은 있지만 Lighthouse JSON, HAR, trace, API snapshot은 저장소에서 확인하지 못해 독립 재산출할 수 없다. 현재 Next.js는 16.4.2로 과거의 16.3.5와 다르고, API 데이터 및 호스트 부하도 고정되지 않았다. 따라서 이번 감사에서는 신규 Lighthouse 값을 만들지 않았고 과거와 현재 수치를 혼합하지 않았다. 공개 포트폴리오에서 과거 수치를 쓴다면 과거 3회 실험임을 표시하고 TBT 악화도 함께 적는다.

## 대표 문제 해결 사례

### 1. TourAPI 응답을 검증 가능한 도메인 모델로 정규화

- 문제: 외부 응답의 형식 오류와 빈 필드가 목록·상세 UI에 전파될 수 있었다.
- 원인: 목록 응답은 빈 문자열을 사용하고 상세 반복 필드는 콘텐츠 유형에 따라 달랐다.
- 해결: Zod schema로 경계 응답을 검사하고 normalizer에서 빈 값·좌표·필드를 도메인 모델로 변환했다. 상세 선택 요청 실패 때는 Promise.allSettled로 공통 상세를 유지한다.
- 검증: schema/normalizer 테스트와 전체 Vitest 166개 통과.
- 결과: 필수 필드 오류 거부, 빈 목록 정규화, 선택 상세 실패 때 공통 상세 유지 사례가 테스트된다.
- 한계: 실 API 계약의 전수 검증은 아니며 detailInfo2 개별 필드 타입은 느슨하다.

### 2. URL에 검색 조건을 보존해 공유 및 복원

- 문제: 검색·필터·정렬·페이지가 주소와 분리되면 새로고침·뒤로 가기에서 조건을 잃는다.
- 원인: 지역·분류 단계는 종속되고 URL은 잘못된 값도 받을 수 있다.
- 해결: parseExploreQuery로 서버에서 URL을 정규화하고 검색 UI가 URL 상태를 갱신하도록 했다. 페이지 초과와 종속 필터도 정리한다.
- 검증: 관련 단위 테스트와 Playwright의 URL 복원·페이지 경계·뒤로 가기 시나리오. 전체 E2E 21개가 단일 worker 실행에서 통과.
- 결과: 탐색 조건을 URL에서 복원하고 정렬·페이지 이동 후에도 유지하는 E2E가 통과한다.
- 한계: Chromium 외 브라우저는 이번 실행 범위에 없다.

### 3. 기본 탐색에서 지도 전용 코드를 동적 로딩

- 문제: 지도 화면에서만 필요한 Leaflet이 일반 카드 보기의 전송 비용 후보였다.
- 원인: 지도 구현은 react-leaflet 및 브라우저 지도 기능을 사용한다.
- 해결: ExploreMapLoader에서 동적 import와 ssr:false를 사용하고 view=map 분기에서만 로드한다.
- 검증: 지도 marker/보기 전환 E2E 및 production build 통과. 과거 감사 문서는 기본 카드에서 약 48KB Leaflet 청크가 빠졌다고 기록한다.
- 결과: 과거 3회 측정 중앙값에서 Performance 66→69, LCP 7,161→5,318ms, 전송량 1,249,259→880,359 bytes를 기록했다.
- 한계: 이번 감사에서 waterfall은 재측정하지 않았다. 과거 TBT는 12→248ms로 악화했고 표본 및 API/호스트 조건이 제한적이므로 인과적 성과로 단정하지 않는다.

## 포트폴리오에 바로 쓸 문안

> TourAPI 응답을 Zod로 검증하고 화면 도메인 모델로 정규화했으며, 상세 반복정보는 실제 행 내용을 이용해 React key를 구성하고 완전 중복만 제거했습니다. 검색·지역·분류·정렬·보기·페이지 상태는 URL 파라미터로 관리해 링크 공유와 뒤로 가기 복원을 지원합니다. 지도 전용 Leaflet은 동적 import로 분리했습니다. Vitest 166개와 Chromium Playwright 21개, TypeScript 검사와 production build가 통과했습니다. 과거 로컬 Lighthouse 3회 실험은 LCP 7.161초에서 5.318초, 전송량 1.25MB에서 0.88MB를 기록했지만 TBT가 12ms에서 248ms로 악화해 참고값으로만 제시합니다.

성능 수치를 생략한 짧은 문안:

> 외부 관광 API 응답을 검증·정규화하고 검색 조건을 URL에 보존하는 여행지 탐색 서비스를 구현했습니다. 서버 데이터 조회와 브라우저 상호작용을 분리하고 지도 모듈을 필요할 때 불러오도록 구성했습니다. 데이터 경계·검색 상태·북마크 동작을 단위 테스트와 E2E로 검증했습니다.

## 추가 개선 과제

| 우선순위 | 과제 | 근거 |
| --- | --- | --- |
| P1 | ✅ 완료 (2026-11-09): 환경·반복별 JS 요청·LCP 후보를 JSON으로 저장하고 eager/lazy 각각 5회 측정 | [지도 지연 로딩 측정 기록](map-lazy-loading-validation.md). Lighthouse trace/TBT는 수집하지 않았으며 별도 한계로 유지 |
| P2 | 병렬 Playwright 간헐 실패 원인 재현 | 4-worker에서 기존 검색 assertion이 간헐 실패했고 단일 worker에서는 통과 |
| P2 | 상세 합성 ID delimiter edge case와 이미지 serialnum 중복 테스트 | 일반 중복 행은 검증했으나 경계 조건 미검증 |
| P3 | 폰트 네트워크 waterfall로 실제 요청 수 확인 | CSS 설정만으로 실제 전송량·캐시 효과 입증 불가 |

## 후속 검증 (2026-11-07)

### ESLint 미판정 원인 조사

- package.json의 lint 스크립트는 인자 없는 eslint 실행이다. 따라서 ESLint가 저장소 기본 대상 전체를 검색한다. eslint.config.mjs는 eslint-config-next/core-web-vitals와 eslint-config-next/typescript를 불러오고 .next, coverage, out, build, next-env.d.ts를 제외한다.
- 설정은 캐시를 사용하지 않고 검사 범위를 축소하지 않는다. 이번 실행 전후에 캐시 파일을 만들거나 ESLint 설정을 비활성화하지 않았다.
- 이전 실행 때 남아 있던 node 프로세스들을 조회한 결과 ESLint 프로세스는 없었다. 확인된 프로세스는 Codex 런타임/CLI 및 브라우저 세션이었다.
- ESLint debug 실행은 설정 로드 후 개별 파일을 탐색·파싱하는 단계까지 진행했다. 파서나 플러그인 초기화에서 멈춘 증거는 없었다. 당시 첫 실행은 여러 검사와 테스트 서버가 함께 실행 중이었고, 재현 가능한 특정 프로세스·파일·플러그인 hang은 발견하지 못했다. 따라서 이전 장시간 대기의 구체 원인을 확정할 자료는 부족하며, 동시 작업에 따른 시스템/파일 접근 지연 가능성은 추정으로만 남긴다.
- 후속 단독 실행은 60초 timeout을 적용한 PowerShell job 안에서 동일한 npm lint 스크립트와 전체 기본 범위로 11,587ms에 끝났고 exit code 0이었다. 설정 또는 검사 범위를 줄여 통과시킨 것이 아니다.

### 실제 두 탭 E2E

e2e/bookmark.spec.ts에 Chromium browser context 내 두 page를 여는 테스트를 추가했다. 두 탭은 같은 origin 및 localStorage를 공유한다. 기존 detail fixture의 content ID 127480(가거도)와 E2E route fixture를 재사용하고, 외부 요청은 기존 fixture 관례에 맞춰 차단했다.

1. 탭 A는 /places/127480, 탭 B는 /bookmarks를 연다.
2. 탭 A에서 저장한 뒤 탭 B의 관심 목록에 가거도가 나타나는지 assertion한다.
3. 탭 A를 새로고침하고 저장 버튼 aria-pressed=true를 확인한다.
4. 탭 B에서 저장을 취소하고, 빈 목록과 탭 A의 aria-pressed=false를 확인한다.
5. 탭 A를 다시 새로고침해 삭제 상태가 유지되는지 확인한다.

기존 beforeEach의 init script는 매 문서 로드마다 localStorage를 비우므로 새로고침 지속성을 검증할 수 없었다. 이를 테스트 context에서 최초 한 번만 지우도록 바꾸고, 두 탭이 이후 같은 저장소를 공유하도록 했다. 앱의 북마크 구현은 수정하지 않았다. 새 두 탭 시나리오를 포함한 bookmark.spec.ts 2개가 단독 실행에서 통과했으며 전체 Chromium E2E 21개도 단일 worker로 통과했다.

### 포트폴리오에서 새롭게 주장 가능한 사실

- Chromium의 실제 두 탭이 공유하는 localStorage를 대상으로 저장·반영·삭제·새로고침 후 상태 유지까지 E2E로 검증했다.
- 기준 감사 이후 Playwright E2E가 20개에서 21개로 늘었으며, fixture 기반 전체 21개가 단일 worker 환경에서 통과했다.
- ESLint 전체 기본 범위 검사도 60초 timeout 제한 아래 11.587초, exit code 0으로 통과했다.

바로 반영할 문장:

> 북마크는 Chromium E2E에서 두 브라우저 탭 사이 저장·삭제 동기화와 새로고침 후 상태 유지를 검증했습니다. 전체 Playwright 21개와 Vitest 166개가 fixture 환경에서 통과했습니다.

### 남은 검증 한계

- 기본 4-worker Playwright 실행 두 차례에서 기존 home-explore 테스트가 각각 지역 링크 전환 또는 이미지 필터 URL assertion에서 간헐적으로 실패했다. 단일 worker 전체 실행에서는 21개가 통과했다. 실패 원인은 확정하지 않았고 병렬 브라우저/개발 서버 실행 안정성은 추가 CI 반복으로 확인할 필요가 있다.
- 탭 동기화는 동일 Chromium browser context의 두 페이지에서 확인했다. 별도 브라우저 context/프로필, Firefox/WebKit은 검증하지 않았다.
- TourAPI는 E2E fixture를 사용했다. 실제 외부 API와 운영 배포 환경의 동기화 성능은 검증하지 않았다.
- ESLint 이전 대기의 구체 원인은 재현되지 않았다. 후속 통과는 동일 명령의 완료 사실이며 최초 대기의 확정 진단은 아니다.

## 후속 지도 성능 검증 (2026-11-09)

- 동일한 Next.js 16.4.2 production build와 fixture로 eager preload / lazy 조건을 비교했다. 각 조건에서 카드 보기와 지도 보기 각각 5회, Chromium 153.0.8010.12, 412×823 CSS px/DPR 1.75, 4× CPU slowdown, RTT 150ms 환경을 사용했다.
- 카드 보기의 4초 JS 전송 중앙값은 eager 233,465 bytes, lazy 187,864 bytes였다. Leaflet 45,535-byte 청크는 eager 5/5회, lazy 0/5회 요청됐다.
- 카드 보기 LCP 중앙값은 1,600ms→1,500ms였으나 LCP 시점 JS 전송은 184,726→184,660 bytes로 사실상 같았고 표본이 5회이므로 LCP 개선이라고 주장하지 않는다. LCP 요소는 첫 관광지 이미지였다.
- 지도 보기는 두 조건 모두 Leaflet 청크 요청, 마커 표시, 키보드 활성화 후 팝업 열기를 확인했다. 지도 보기는 타일 요청을 외부 네트워크 차단으로 제외했다.
- 재현 환경·실행별 원본·결과·한계 및 이력서/면접 문안: [지도 지연 로딩 성능 검증](map-lazy-loading-validation.md).
- 이 세션에서 Vitest 166개, Chromium E2E 21개, format, ESLint, TypeScript, production build가 통과했다. 상세 수치와 명령은 최종 작업 보고를 기준으로 한다.

바로 반영할 성능 문장:

> 지도 전용 Leaflet을 `next/dynamic`으로 분리했습니다. 동일 production fixture의 5회 반복에서 카드 보기의 4초 내 JS 전송 중앙값을 233,465 bytes에서 187,864 bytes로 줄였고, LCP 개선은 확인된 성과로 주장하지 않았습니다.

기존 포트폴리오 Notion에는 해당 문장을 추가하고 새 측정 기록 문서를 근거 링크로 연결하는 것을 제안한다. 이번 작업에서는 Notion 페이지를 수정하지 않았다.

## 변경 파일

- 추가: docs/portfolio-evidence-audit.md
- 수정: e2e/bookmark.spec.ts — 두 탭 동기화·새로고침 회귀를 추가하고 테스트 저장소 초기화를 context당 한 번으로 제한.
- 기존 감사 문서는 최초 작성 시점의 미추적 상태를 보존했다. 이번 작업에서 README, 측정 설명·코드·결과 JSON을 추가했으며 애플리케이션 기능 코드는 수정하지 않았다. Commit·push는 하지 않았다.
