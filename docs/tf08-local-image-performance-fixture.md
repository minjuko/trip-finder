# TF08 로컬 이미지 성능 fixture

## 목적과 격리

`TOUR_API_E2E_FIXTURES=true`는 기존처럼 TourAPI fixture를 사용합니다. 여기에 `TOUR_API_PERF_FIXTURES=true`를 추가한 경우에만, 이미지가 있는 fixture 관광지의 `firstimage`를 `/performance-fixtures/tour-card.jpg`로 바꿉니다. 이 환경 변수는 성능 전용 production Playwright 설정에만 선언되어 있습니다. 실제 TourAPI 응답, 정렬, 페이지네이션, 카드 컴포넌트는 수정하지 않습니다.

기능 E2E는 기존 `e2e/fixtures.ts`를 그대로 사용하여 외부 origin을 차단하고 `/_next/image`를 1×1 SVG로 대체합니다. 성능 측정은 전용 `playwright.tf08.config.ts`와 `performance/tf08/image-baseline.spec.ts`를 사용합니다. 이 측정은 `next start`를 실행하고, 같은 origin의 실제 `/_next/image` 요청을 통과시키며 외부 origin 요청은 차단합니다. 지도는 측정하지 않으며, 외부 지도 타일 요청도 외부 origin 차단 규칙에 의해 중단됩니다.

홈에는 관광지 카드 이미지가 없으므로 홈 결과는 이미지 미포함 대조군입니다. 탐색 결과는 첫 번째 카드 이미지를 포함합니다. 이미지 fixture는 실제 사진을 복제하지 않은 원본 기하 패턴입니다.

## 이미지 에셋 생성

고정 SVG 입력을 `scripts/generate-tf08-image.mjs`가 Sharp로 1200×900 JPEG로 변환합니다. 원본은 코드에 포함되고 외부 사진·폰트·네트워크 리소스를 사용하지 않습니다. 생성 에셋은 `public/performance-fixtures/tour-card.jpg`입니다. 저장소에 이미 있는 Sharp를 이용합니다. 패키지 설치는 필요하지 않습니다.

```powershell
node scripts/generate-tf08-image.mjs
```

JPEG 원본을 Next.js 기본 이미지 최적화 경로에 전달합니다. Playwright는 같은 origin의 `/_next/image` 응답 URL·상태·Content-Type·본문 바이트 수를 기록하고, 브라우저에서 선택한 `currentSrc` 및 자연 크기를 수집합니다. 브라우저 캐시는 실행별로 비활성화되지만, 첫 이미지 요청 뒤에는 Next 이미지 캐시가 측정 간 따뜻해질 수 있습니다.

## 실행 순서

```powershell
$env:TOUR_API_E2E_FIXTURES='true'
$env:TOUR_API_PERF_FIXTURES='true'
$env:TOUR_API_SERVICE_KEY='fixture-only-not-a-real-key'
npm.cmd run build
npm.cmd run test:e2e -- --config=playwright.tf08.config.ts
```

측정은 페이지별 5회이며 `test-results/tf08-performance.json`에 원본 결과를 기록합니다. Performance API로 FCP·LCP·CLS·TTFB·long task를 수집합니다. 이 값은 Lighthouse 점수나 공식 Lighthouse TBT가 아닙니다.

탐색 페이지는 이미지 활성 5회와 함께 `/_next/image` 요청을 브라우저에서 중단하는 5회 대조군도 측정합니다. 외부 origin은 모두 차단하므로 CDN의 Paperlogy 글꼴 요청도 차단되고, 이 측정에서 시스템 fallback 글꼴이 사용될 수 있습니다. 원본 측정 결과에는 차단된 URL 목록이 포함됩니다.
