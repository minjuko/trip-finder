# TF-02 성능 측정 원본·조건 감사

## 목적과 범위

GitHub Issue [#7](https://github.com/minjuko/trip-finder/issues/7)의 범위에 따라 기존 TripFinder 성능 기록이 실제 원본에 연결되는지 확인하고, 기준 환경에서 재현한 로컬 수치를 별도로 남긴다. 감사 대상 기준 SHA는 `d22f4d17186f611fc89c1f99f3984c4d4ce1943d` (`main`, Next.js `16.4.5`)이다. 이번 작업은 문서와 측정 결과만 추가했으며 애플리케이션 코드나 기능은 수정하지 않았다.

이 문서는 로컬 production build를 fixture 데이터로 측정한 실험 기록이다. Vercel 운영 배포, 실제 사용자 Core Web Vitals, Google CrUX/Search Console 결과를 뜻하지 않는다.

## 기존 성능 자료와 신뢰도

| 자료 | 시점·대상 | 측정 및 원본 | 재현성·해석 |
| --- | --- | --- | --- |
| README의 홈페이지 메모 | SHA·생성일 확인 불가 | 홈페이지 FCP/LCP `628ms`, 탐색 FCP `640ms`/LCP `1,120ms`로 기재. 연결된 Lighthouse JSON/HTML, 측정 명령, 브라우저·환경 원본을 찾지 못함 | 기록된 주장으로 보존할 수 있으나 독립 재현 또는 현재와의 전후 비교 수치로 인정할 수 없음 |
| [`docs/explore-performance-audit-2026.md`](explore-performance-audit-2026.md) | 2026-10-14, 당시 Next.js `16.3.5`, Chrome `155.0.8059.39`, Lighthouse `13.5.0` | `/explore?keyword=해수욕장` 로컬 `next build`/`next start`, 실제 TourAPI 응답, Lighthouse mobile 412×823/DPR 1.75, simulated RTT 150ms·4× CPU, 3회 기록. FCP 중앙값 `4,100ms`→`3,286ms`, LCP `7,161ms`→`5,318ms`, TBT `12ms`→`248ms`, 전송량 `1,249,259`→`880,359 bytes`라고 기록 | 추적된 Lighthouse 원본 JSON/HTML 또는 trace가 없어 요약 문서만 남음. 폰트 요청 변경과 지도 지연 로딩이 함께 들어간 전후이며, TourAPI 데이터·서버 캐시·실행 시점 등이 고정되지 않음. 해당 수치만으로 인과나 개선을 재검증할 수 없음. 기록 자체도 TBT 악화를 명시함 |
| [`docs/map-lazy-loading-validation.md`](map-lazy-loading-validation.md), [`performance/results/map-lazy-loading-eager-preload.json`](../performance/results/map-lazy-loading-eager-preload.json), [`performance/results/map-lazy-loading-lazy.json`](../performance/results/map-lazy-loading-lazy.json) | 2026-11-09, 보고서에 기록된 대상 SHA `89d0eaf3f20580c1309df4307fc0d5a9e75cd6fe`, 당시 Next.js `16.4.2`, Playwright Chromium `153.0.8010.12` | production build, TourAPI·이미지 fixture, 412×823/DPR 1.75, 매 회 브라우저 cache 비활성화, RTT 150ms·1,638.4Kbps down/675Kbps up·4× CPU, 외부 요청 차단. 각 variant grid/map 5회, 두 JSON에 총 10회씩 원본 보존. 원본은 commit `b6164509908f139e316fe821ee0bf3ac2a5d23a1`에 기록됨 | 현재 구현에 가까운 추적 가능한 반복 자료. eager preload 코드와 lazy 코드의 지도 요청 여부를 비교한다. Lighthouse 점수·TBT 비교는 아니며, 소표본 lab 측정이다. 실제 지도 타일·외부 CDN 요청은 차단했다. |
| TF-02 재현 파일 | 2026-11-19, 기준 SHA `d22f4d17186f611fc89c1f99f3984c4d4ce1943d` | [`performance/results/tf-02-home-explore-baseline.json`](../performance/results/tf-02-home-explore-baseline.json), [`performance/results/tf-02-main-baseline.json`](../performance/results/tf-02-main-baseline.json) | 아래 절차와 환경으로 현재 기준 구현을 5회 반복 측정한 원본. 실행 환경 및 fixture가 과거 배포·Lighthouse 조건과 달라 과거 수치와 직접 전후 비교하지 않음. |

README의 지도 측정 요약(카드 화면 지도 chunk `5/5`→`0/5`)은 2026-11-09 원시 JSON과 재현 코드에 대응한다. JSON에서 eager grid는 각 실행에서 지도 chunk 1개를 요청했고 lazy grid는 0개, map view는 두 조건 모두 각 5회 요청했다. 여기서 세는 것은 Next.js의 지도 JavaScript chunk이며 지도 타일 또는 전체 외부 네트워크 요청 수가 아니다.

## 현재 구현 구조

- `src/app/layout.tsx`는 Next.js App Router의 root layout이자 Server Component다. metadata와 공통 Header를 제공한다. Next.js `16.4.5`, React/React DOM `19.2.8`, TypeScript `5` 계열, Tailwind CSS `4`를 사용한다. `package-lock.json`이 설치 버전을 고정한다.
- `src/app/page.tsx`의 홈은 Server Component이며 검색 진입, 지역·카테고리 링크를 렌더링한다. 홈 hero는 CSS 기반이고 이미지 요소가 없다.
- `src/app/explore/page.tsx`는 Server Component다. URL query를 파싱하고 TourAPI 결과 및 페이지를 렌더링한다. 목록의 `TourCard`는 Next.js `<Image>`를 사용하고, 상단 카드는 eager·나머지는 lazy loading한다.
- 탐색의 `view=map`일 때만 `src/components/search/ExploreMapLoader.tsx`를 거쳐 `next/dynamic`의 `{ ssr: false }` 설정으로 `ExploreMap.tsx` 및 Leaflet을 브라우저에서 불러온다. grid에서 Leaflet을 eager로 불러오는 경로는 없다.
- `src/app/places/[contentId]/page.tsx`는 상세를 Server Component에서 불러오고 `generateMetadata`로 상세 title, description, canonical, Open Graph URL 등을 생성한다. 이번 측정 E2E는 상세 URL을 포함하지 않는다.
- `src/lib/tour-api/cache.ts`는 코드 데이터 24시간, 목록 10분, 상세 1시간 `revalidate` 정책을 선언한다. `src/lib/tour-api/client.ts`가 endpoint 호출에 지정된 정책을 적용한다. 이번 측정은 `TOUR_API_E2E_FIXTURES=true`로 외부 TourAPI 요청을 fixture로 대체하므로 실제 API 지연·캐시 hit rate를 재지 않았다.
- `src/app/globals.css`는 Paperlogy 100~900의 9개 weight를 jsDelivr URL로 선언한다. 측정 config는 외부 origin을 차단하므로 이 폰트 요청은 실패/차단되며, 실제 운영 폰트 CDN 성능은 이번 로컬 수치에 포함되지 않는다.
- SEO metadata는 root layout과 각 route에 선언되어 있다. 이번 문서에서는 metadata 응답 성능을 따로 측정하거나 Search Console 색인 여부를 확인하지 않았다.

## 재현 환경과 명령

| 항목 | 값 |
| --- | --- |
| 기준 | `main`, `d22f4d17186f611fc89c1f99f3984c4d4ce1943d` |
| 실행 시각 | 2026-11-19 (Asia/Seoul), raw JSON의 UTC `generatedAt` 참조 |
| OS·CPU | Windows 10 Education, OS build `26200`, Intel Core i7-10510U @ 1.80GHz, x64 |
| Node.js / npm | `22.20.0` / `10.9.3` |
| Next.js / React | `16.4.5` / `19.2.8` |
| Playwright / Chromium | `1.63.0` / `153.0.8010.12` |
| 서버·브라우저 | `npm run build` 후 Playwright `webServer`가 `next start` 실행. `127.0.0.1:3000` |
| viewport | `412×823` CSS px, DPR `1.75` |
| 네트워크·CPU | CDP `150ms` RTT, down `1,638.4Kbps`, up `675Kbps`, CPU `4×` slowdown |
| 브라우저 cache | 각 run의 새 browser context, CDP cache disabled |
| 데이터·외부 요청 | `TOUR_API_E2E_FIXTURES=true`, 성능 이미지 fixture 사용. 외부 origin 요청 차단. 운영 TourAPI·운영 DB·결제 API를 사용하지 않음 |
| 반복 | TF08: `/`, `/explore` 이미지 enabled 각 5회. TF09: `/explore` grid/map 각 5회 |

실행한 명령:

```powershell
npm.cmd ci
$env:TOUR_API_E2E_FIXTURES='true'
$env:TOUR_API_PERF_FIXTURES='true'
$env:TOUR_API_SERVICE_KEY='fixture-only-not-a-real-key'
$env:NEXT_TELEMETRY_DISABLED='1'
npm.cmd run build
npm.cmd run test:e2e -- --config=playwright.tf08.config.ts
$env:TF09_OUTPUT='performance/results/tf-02-main-baseline.json'
$env:TF09_VARIANT='current-main'
npm.cmd run test:e2e -- --config=playwright.tf09.config.ts
```

`npm ci`, production build 및 두 성능 Playwright 테스트는 모두 종료 코드 0으로 완료했다. TF08 원본은 실행 후 `test-results/tf08-performance.json`에서 추적 파일로 복사했다. TF09는 출력 경로를 직접 `performance/results/tf-02-main-baseline.json`으로 지정했다. 측정 코드는 기존 `performance/tf08/image-baseline.spec.ts`, `playwright.tf08.config.ts`, `performance/tf09/map-lazy-loading.spec.ts`, `playwright.tf09.config.ts`를 수정 없이 재사용했다.

## 현재 로컬 production fixture 측정

모든 값은 각 그룹 5회 개별 결과의 중앙값이다. 원시 값은 두 JSON을 참조한다. 단위는 ms이며 JavaScript transfer size는 브라우저 Resource Timing의 bytes 합계다.

### TF08: 홈 및 탐색 이미지 fixture

| 경로·조건 | FCP | LCP | CLS | TTFB | 기타 |
| --- | ---: | ---: | ---: | ---: | --- |
| `/`, 홈 fixture | `1,384` | `1,384` | `0` | `7` | LCP 요소는 `H1`; 이미지 요청 0회 |
| `/explore`, 성능 이미지 활성 | `972` | `2,092` | `0` | `41.2` | LCP 요소는 `IMG`; `/_next/image` 성공 응답 5/5 |

홈 페이지는 이미지가 없어 1200×900 성능 fixture 이미지의 로딩을 평가하지 않는다. 탐색 페이지는 합성 이미지와 Next.js image optimizer를 사용한다. 실제 TourAPI 사진/원격 이미지 CDN의 크기·지연과 다르다. 두 경로 모두 외부 폰트 요청은 차단되었다.

### TF09: 현재 지도 지연 로딩

| 탐색 보기 | FCP | LCP | 4초 관찰창 JS 전송 | 지도 JS chunk 요청 | 추가 결과 |
| --- | ---: | ---: | ---: | ---: | --- |
| grid (`/explore`) | `992` | `1,940` | `187,734 bytes` | `0/5` | LCP는 fixture `IMG` |
| map (`/explore?view=map`) | `964` | `1,812` | `233,285 bytes` | `5/5` | 지도 표시 중앙값 `4,810ms`; 첫 마커 키보드 상호작용 후 팝업 표시 `5,078ms` |

TF09의 중앙값은 5개 개별 실행의 중앙값이다. grid와 map 사이의 FCP/LCP 차이는 다른 화면의 결과이며 지도 지연 로딩의 인과 효과로 해석하지 않는다. TF09는 CLS를 수집하지 않는다. Map-ready/interact 시간은 전체 사용자 상호작용 지연이나 INP가 아니라 Playwright 시나리오의 로컬 구간 시간이다.

## 신뢰 가능한 비교와 불가능한 비교

- 2026-11-09 eager/lazy 실험 안에서는 동일 production fixture·브라우저·throttling·viewport 및 반복 수가 사용되었고 결과 JSON이 보존돼 있다. 따라서 이 범위에서 **grid의 지도 chunk 요청 생략(5/5→0/5)**은 재현 가능한 동작 차이다. 지도 chunk `45,535 bytes` 절감 주장은 그 당시 빌드와 그 파일의 해당 chunk 기준이며 현재 빌드 bytes와 동일하다고 볼 수 없다.
- 당시 자료의 카드 grid 4초 내 JS 중앙값은 eager `233,465 bytes`, lazy `187,864 bytes`다. 현재 재현은 TF09 grid `187,734 bytes`지만 브라우저 버전, Next.js `16.4.2`→`16.4.5`, 기준 source SHA 및 실행 host/시점이 다르므로 이를 직접 patch 전후 개선치로 보고하지 않는다.
- README의 `628ms`, `640ms`, `1,120ms`는 대응하는 원본 자료와 실행 조건을 찾지 못했다. 이번 측정의 값과 비교하거나 과거 성과로 확정할 수 없다.
- 2026-10-14 Lighthouse 자료는 원본 JSON/HTML/trace가 없고, Lighthouse `13.5.0` 실험에 실제 TourAPI가 쓰였으며 폰트 변경과 map split이 동시 적용됐다. 이번 fixture Playwright 결과와 비교할 수 없다. 특히 기존 기록의 TBT `12ms`→`248ms` 악화 관측을 감춰서는 안 된다.
- 이번 TF08 홈·탐색 측정과 TF09 grid/map은 테스트 harness, 페이지 시나리오 및 이미지 조건이 다르다. 같은 `/explore`라도 서로의 FCP/LCP를 직접 비교하지 않았다.
- 상세 페이지 `/places/{id}`는 재현 측정하지 않았다. 현 문서에서 상세 페이지의 성능 수치·순위는 주장하지 않는다.

## 병목 및 최소 개선 후보

이번 감사로 실제 운영 병목을 확정할 수 없다. 확인 가능한 범위에서는 홈에서 이미지 요청이 없고 CLS는 관찰된 5회 모두 `0`이었다. 탐색 grid에서 지도 chunk가 요청되지 않고, 지도 보기에서 chunk 및 마커 팝업 기능이 정상 작동했다. TF08의 5회 로컬 탐색에서는 합성 image optimizer 응답이 모두 성공했다.

다음은 병목 확정이 아니라 측정 후보이다.

1. 과거 Lighthouse의 높은 LCP가 현재에도 재현되는지 판단하려면, 당시와 동일한 Lighthouse·Chrome·실제 TourAPI·네트워크 조건을 복원하고 JSON/trace 원본을 보존해야 한다. 이전 문서는 대상 배포 SHA가 충분히 추적되지 않는다.
2. Paperlogy 외부 폰트 요청은 이번 실험에서 차단되었다. 운영 환경에서 Network waterfall과 실제 전달 바이트를 확인한 뒤에만 폰트 요청 수나 필요한 weight 축소를 개선 후보로 평가한다.
3. 상세 페이지 성능은 운영 API를 호출하지 않는 유효 fixture 상세 route를 기존 성능 harness에 추가하거나 명확한 수동 측정 절차를 만든 뒤 독립적으로 측정한다.
4. 실제 사용자 INP·CrUX, 운영 TourAPI cache hit/miss, Vercel CDN/HTTP2·3, 지도 타일 로딩은 이 작업에서 확인되지 않았다. 현 단계에는 이를 해결한다는 코드 변경이 필요하다고 판단하지 않았다.

검색·필터·정렬, URL 복원, 북마크/localStorage, TourAPI 호출 정책, 지도 지연 로딩, SEO metadata 및 기존 테스트 코드는 변경하지 않았다. 별도 성능 최적화는 재현된 병목과 동작 회귀 증거를 확보한 후 새 Issue/PR로 분리한다.

## 측정 한계 및 미검증 사항

- 이 수치는 Windows 로컬 머신의 lab 결과다. CPU·백그라운드 프로세스 부하, fixture 및 Next.js image cache 상태가 실행마다 달라질 수 있다. 첫/초기 run의 TTFB 등 이상치가 있어 단일 수치의 운영 대표성을 주장하지 않는다.
- 브라우저 cache는 run마다 비활성화했지만 Next.js image optimizer/server cache는 process 재시작 없이 run 간 warm해질 수 있다. 완전 cold-cache 실험이 아니다.
- 외부 origin을 차단하여 Paperlogy, TourAPI, 지도 타일/외부 CDN 요청 성능은 실측하지 않았다. 화면과 지도 상호작용이 로컬 fixture에서 정상인지 확인하는 실험이다.
- CLS만 TF08에서 측정했다. INP, 공식 Lighthouse Performance 점수/TBT, CrUX, RUM은 측정하지 않았다. TF09의 map interaction 시간은 INP로 해석하지 않는다.
- 상세 route, production/Vercel Preview, SSO가 적용된 Preview, 운영 API, 실제 기기·네트워크는 검증하지 않았다.
- `npm ci`는 lockfile 설치를 완료했으며 npm audit summary에 `13 vulnerabilities (10 moderate, 3 high)`가 출력되었다. 이 감사의 성능 측정으로 취약점의 실제 영향이나 수정 필요성을 분석하지 않았다.

## 코드 변경·회귀 검증

추가 파일은 이 감사 문서와 두 raw JSON 결과뿐이다. 애플리케이션/테스트 소스는 변경되지 않았다. 따라서 기능 회귀 테스트를 별도로 변경·추가할 필요가 없어 기존 사용자 기능 테스트 전체를 재실행하지 않았다. 대신 기준 production build와 기존 성능 E2E 두 suite가 통과했다. GitHub Actions는 문서·측정 결과 전용 변경에 대한 CI 결과를 PR에서 확인 후 여기에 기록한다.

## 검증 기록

| 확인 | 결과 |
| --- | --- |
| 기준 작업 트리·SHA | 별도 worktree `D:\project\trip-finder-tf-02`, branch `audit/tf-02-performance`, 시작 HEAD `d22f4d17186f611fc89c1f99f3984c4d4ce1943d`; 기존 다른 worktree 보존 |
| 중복 문서 | 시작 시 `docs/tf-02-performance-audit.md` 없음. 기존 관련 문서와 JSON 확인 후 이 문서 하나를 추가 |
| `npm ci` | 성공, 468 packages installed; npm audit summary 13 vulnerabilities (10 moderate, 3 high) |
| `npm.cmd run build` | Next.js `16.4.5` production build 성공 |
| `npm.cmd run test:e2e -- --config=playwright.tf08.config.ts` | 1 test passed; 홈/탐색·blocked image 시나리오 15회 결과 기록 |
| `npm.cmd run test:e2e -- --config=playwright.tf09.config.ts` | 1 test passed; grid/map 총 10회, 지도 chunk·마커 상호작용 확인 |
| `git diff --check` | 커밋 전 스테이징된 변경에 실행 |
| GitHub PR / Actions | [PR #8](https://github.com/minjuko/trip-finder/pull/8), commit `5340c8e359d6c114f41540581c7ed2e4a5c5d33b`의 [CI run #83](https://github.com/minjuko/trip-finder/actions/runs/44507873592) 성공. `Quality Check` job의 format, lint, typecheck, unit/coverage, E2E, production build 모두 통과. Vercel status check도 success. Vercel 대상 링크는 확인했으나 Preview 페이지를 직접 열어 브라우저 검증하지는 않음. |
