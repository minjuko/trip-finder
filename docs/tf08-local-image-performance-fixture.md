# TF08 로컬 이미지 성능 fixture

## 목적과 범위

외부 관광 이미지 서버에 요청하지 않고 production 빌드에서 Next.js `/_next/image` 변환 경로를 확인하기 위한 성능 전용 fixture입니다. 이 문서는 측정 절차와 범위를 기록하며, 측정 원본 JSON은 저장소에 포함하지 않습니다.

`TOUR_API_E2E_FIXTURES=true`는 기존 기능 E2E fixture를 사용합니다. `TOUR_API_PERF_FIXTURES=true`를 추가한 경우에만 이미지가 있는 fixture 관광지의 `firstimage`를 `/performance-fixtures/tour-card.jpg`로 바꿉니다. 기능 E2E의 `/_next/image` 1×1 SVG 응답은 그대로 유지됩니다.

성능 검증은 `playwright.tf08.config.ts`와 `performance/tf08/image-baseline.spec.ts`를 사용합니다. production build 후 `next start`로 서버를 실행하고, 브라우저에서 외부 origin 요청은 차단합니다. 로컬 `/_next/image` 요청만 허용해 이미지 최적화 응답을 검사하며, 지도 타일과 외부 폰트 요청도 측정에서 제외합니다.

## 합성 이미지 생성

`scripts/generate-tf08-image.mjs`는 프로젝트에 이미 설치된 Sharp를 사용해 결정적인 기하 패턴의 1200×900 JPEG를 생성합니다. 외부 사진이나 서비스가 필요하지 않습니다.

```powershell
node scripts/generate-tf08-image.mjs
```

생성 파일은 `public/performance-fixtures/tour-card.jpg`입니다. 이 합성 이미지는 실제 관광 사진의 디테일·압축률·사용자 체감을 대표하지 않습니다.

## 재현 절차

```powershell
$env:TOUR_API_E2E_FIXTURES='true'
$env:TOUR_API_PERF_FIXTURES='true'
$env:TOUR_API_SERVICE_KEY='fixture-only-not-a-real-key'
npm.cmd run build
npm.cmd run test:e2e -- --config=playwright.tf08.config.ts
```

테스트는 홈(이미지 비활성), 탐색(이미지 허용), 탐색(`/_next/image` 차단) 조건을 각 5회 측정하도록 구성되어 있습니다. 412×823 CSS px, DPR 1.75, 네트워크 지연·처리량 및 CPU slowdown을 고정하고 브라우저 캐시는 측정마다 비활성화합니다. Next.js 서버의 변환 캐시는 실행 중 따뜻해질 수 있으므로 완전한 cold-cache 실험은 아닙니다.

Performance API로 FCP, LCP, CLS, TTFB, long task를 기록합니다. 실제 LCP 요소, 이미지 요청의 URL·상태·Content-Type·전송 바이트, 브라우저의 `currentSrc`와 자연 크기도 수집합니다. 이는 Lighthouse 점수나 공식 TBT가 아닙니다. 실행 결과는 `test-results/tf08-performance.json`에 기록되며 Git 추적 결과 파일은 현재 없습니다. 따라서 이 저장소 문서만으로 특정 수치를 재현 결과로 주장하지 않습니다.

이 방법은 로컬 합성 이미지를 대상으로 Next.js 이미지 선택·변환·다운로드·디코딩 경로가 수행되는지 확인합니다. 실제 TourAPI 사진, 원격 이미지 CDN, 지도 타일, 운영 서버·캐시, 실제 네트워크 환경은 검증하지 않습니다.
