# 탐색 E2E 및 모바일 이미지 기준선

측정일: 2026-11-25 KST
기준 커밋: `origin/main` `ab4f6f5bffc5db2fe22ae5cad9ce76e5eab1e585`
기준 `package.json`: Next.js `16.4.5`

이 문서는 위 커밋의 코드 리딩과 로컬 실험 결과를 기록한다. 로컬 이미지 수치는 코드 변경 전 기준선이며, 공개 배포 수치는 별도 관측이다. 어느 결과도 실제 사용자 현장 지표(CrUX/RUM)가 아니다.

## 탐색 E2E

`e2e/home-explore.spec.ts`와 `e2e/fixtures.ts`를 사용했다. Playwright 설정은 `fullyParallel: true`, 고정 TourAPI fixture 사용이다. `retry=0`, `repeat-each=5`를 명시해 네 테스트를 각 조건에서 5번, 총 20번 실행했다. Next dev의 비대화형 보안 업그레이드 안내가 서버를 종료하지 않도록 두 dev 실행에서 `CI=true`와 `__NEXT_AGENT_UPGRADE=security`를 설정했다.

| 서버 | Workers | 실행 | 통과 | 실패 | 건너뜀 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Next dev | 1 | 20 | 20 | 0 | 0 |
| Next dev | 4 | 20 | 17 | 3 | 0 |
| Next production | 4 | 20 | 20 | 0 | 0 |

dev 명령:

```powershell
$env:CI='true'; $env:__NEXT_AGENT_UPGRADE='security'
npm.cmd run test:e2e -- e2e/home-explore.spec.ts --workers=1 --retries=0 --repeat-each=5 --trace=retain-on-failure --reporter=line
npm.cmd run test:e2e -- e2e/home-explore.spec.ts --workers=4 --retries=0 --repeat-each=5 --trace=retain-on-failure --reporter=line
```

production build는 `TOUR_API_E2E_FIXTURES=true`, `TOUR_API_PERF_FIXTURES=true`, fixture 전용 키로 `npm.cmd run build`를 실행했다. 이후 임시 Playwright 설정에서 `npm run start -- --hostname 127.0.0.1 --port 3000`을 띄우고 아래 조건으로 같은 E2E 파일을 실행했다. 임시 설정 파일은 실행 뒤 제거했다.

```powershell
npm.cmd run test:e2e -- --config=playwright.production-audit.config.ts --workers=4 --retries=0 --repeat-each=5 --trace=retain-on-failure --reporter=line
```

처음 production 비교를 포트 `3100`에서 시도했으나, `e2e/fixtures.ts`가 로컬 origin `http://127.0.0.1:3000`만 허용해 브라우저 요청 20건 모두 차단됐다. 이 실행은 앱 검증으로 세지 않았다. fixture origin과 서버 포트를 `3000`으로 맞춘 재실행 결과가 위 production 행이다.

4-worker dev의 실패는 다음 URL assertion에서 발생했다.

- 키워드 검색: `e2e/home-explore.spec.ts:27`
- 지도 보기 전환: `e2e/home-explore.spec.ts:88`
- 정렬 변경: `e2e/home-explore.spec.ts:105`

trace 기준으로 정렬 선택은 13,585ms, URL assertion은 14,900ms에 시작했다. 같은 trace에서 분류 API 응답은 약 6,651ms와 6,705ms가 걸렸고 정렬 RSC 요청은 완료 상태를 남기지 않았다. 지도 전환은 클릭이 14,035ms, URL assertion이 15,615ms에 시작했으며 `view=map` RSC 요청도 완료 상태가 기록되지 않았다. assertion 종료 시 URL은 이전 `view=list`였다. 키워드 검색도 URL assertion까지 도달했지만 대응 RSC 요청의 완료 상태가 없었다. 테스트의 URL assertion 제한은 기본 5초다.

Playwright가 수집한 앱 서버 출력에는 관련 예외 stack trace가 없었다. production의 20/20 통과는 dev 환경 특유의 지연 또는 요청 중단 가능성을 뒷받침하지만, 정확한 중단 주체와 근본 원인은 확정하지 못했다. 따라서 코드 수정이나 timeout 증가는 하지 않았다.

## 모바일 탐색 이미지 기준선과 공개 배포 관측

### 로컬 production fixture

`npm.cmd run test:e2e -- --config=playwright.tf08.config.ts` 실행. 테스트는 홈·탐색 이미지 허용·탐색 이미지 차단 대조군을 각 5회 측정하며, 아래 표는 `/explore` 이미지 허용 5회다. 매 실행 새 브라우저 컨텍스트와 CDP 세션을 만들고 브라우저 캐시를 끈다. 네트워크 조건은 RTT 150ms, 다운로드 1638.4Kbps, 업로드 675Kbps, CPU slowdown 4배다. Viewport는 412×823 CSS px, DPR은 1.75다. Next.js 이미지 변환 캐시는 실행 중 따뜻해질 수 있어 완전한 cold-cache 측정은 아니다.

TourAPI fixture는 25개의 고정 카드 데이터에서 생성된다. 이미지 허용 카드의 `firstimage`는 성능 전용 합성 이미지 `/performance-fixtures/tour-card.jpg`로 바뀐다. 파일은 1200×900 JPEG, 61,941 bytes다. 실제 관광 사진의 세부 묘사·압축률·전송량을 대표하지 않으며, TourAPI나 원격 CDN은 이 로컬 이미지 측정에 참여하지 않는다.

| 실행 | LCP(ms) | LCP 요소 | 이미지 요청 수 | 전송량(bytes) | 응답 본문(bytes) | 선택 후보 |
| ---: | ---: | --- | ---: | ---: | ---: | --- |
| 1 | 1516 | IMG | 1 | 10,476 | 10,176 | `w=750&q=75` |
| 2 | 1468 | IMG | 1 | 10,476 | 10,176 | `w=750&q=75` |
| 3 | 1512 | IMG | 1 | 10,476 | 10,176 | `w=750&q=75` |
| 4 | 1632 | IMG | 1 | 10,476 | 10,176 | `w=750&q=75` |
| 5 | 1532 | IMG | 1 | 10,476 | 10,176 | `w=750&q=75` |
| **중앙값** | **1516** | IMG | **1** | **10,476** | **10,176** | `w=750&q=75` |

LCP 범위는 1468–1632ms다. 다섯 응답은 모두 HTTP 200 `image/webp`였고 응답 본문 바이트를 읽었다. 전송량은 Resource Timing의 `transferSize`로, 본문 바이트는 응답 body 길이로 기록했다. CSS상 메인 콘텐츠 폭은 372px이고 카드 테두리 안 이미지 영역은 370px다. `TourCard`의 모바일 `sizes`는 `calc(100vw - 40px)`(372px)을 선언한다. DPR 1.75에서 이미지 영역 기준 필요 폭은 약 648px이며 Next.js가 고른 후보는 750px이다. 후보 폭 반올림에 따른 여유가 보이지만, 이 합성 fixture 결과만으로 실제 TourAPI 사진의 절감량을 단정할 수 없다. 이번에는 이미지 코드를 변경하지 않았으므로 전후 비교가 아닌 기준선이다.

### 공개 배포 현재 관측값

읽기 전용 URL은 `https://trip-finder-mauve.vercel.app/explore`다. 측정 시각은 2026-11-25 02:26:40–02:27:03 KST다. 로컬과 같은 viewport·DPR·RTT·처리량·CPU slowdown을 적용했고, 각 실행에서 새 브라우저 컨텍스트와 브라우저 캐시 비활성화를 사용했다. HTML 응답은 매번 HTTP 200, `x-vercel-cache: MISS`, `Age: 0`이었다. 이미지 응답도 브라우저 disk cache/service worker에서 제공되지 않았다. Vercel 이미지 처리·원본 CDN 캐시는 이 실험에서 강제로 비우지 않았다.

앞서 한 탐색 실행은 원시 JSON을 파일로 보존하지 못했고 콘솔 출력도 잘려 5회 전체를 복원할 수 없어 분석에서 제외했다. 아래는 원시 JSON을 별도 파일에 저장해 완전한 실행별 결과를 확인한 반복 측정이다.

카드에 `Tour Fixture`가 아닌 `가가상점` 등의 제목과 `tong.visitkorea.or.kr` 원본 이미지 URL이 나타났다. 실제 서비스 데이터로 보이는 응답을 관측했지만, 공개 서버의 TourAPI 호출 자체를 계측하지는 않았다.

| 실행 | LCP(ms) | LCP 요소 | 이미지 요청 수 | 완료 응답 전송량 합계(bytes) | 대표 후보 |
| ---: | ---: | --- | ---: | ---: | --- |
| 1 | 2404 | IMG | 3 | 143,658 | `w=750&q=75` |
| 2 | 2392 | IMG | 3 | 143,660 | `w=750&q=75` |
| 3 | 2276 | IMG | 3 | 143,659 | `w=750&q=75` |
| 4 | 2396 | IMG | 3 | 143,659 | `w=750&q=75` |
| 5 | 2276 | IMG | 3 | 143,696 | `w=750&q=75` |
| **중앙값** | **2392** | IMG | **3** | **143,659** | `w=750&q=75` |

LCP 범위는 2276–2404ms, 완료 이미지 응답 바이트 합계 범위는 143,658–143,696 bytes다. 각 실행에서 세 이미지 응답 모두 완료됐으며 `Network.loadingFinished.encodedDataLength`를 합산했다. 로컬은 합성 fixture 한 장을 재사용하고 공개 배포는 서로 다른 관광 사진 세 장을 받으므로 두 전송량 차이를 코드 변경 효과로 비교하지 않는다.

### 다른 실험과의 구분

- `docs/explore-performance-audit-2026.md`: 2026-10-14 Lighthouse 및 실제 TourAPI 응답을 사용한 과거 로컬 전후 실험. 당시 Next.js 버전과 측정 조건은 당시 기록대로 유지한다.
- `docs/map-lazy-loading-validation.md`: 별도의 지도 eager/preload 대 지연 로딩 실험. 이 문서의 이미지 기준선이나 공개 배포 관측으로 대체하지 않는다.
- 이 문서의 LCP는 제한된 Chromium 실험 환경의 Performance API 관측이며 Lighthouse 점수나 실제 사용자 지표가 아니다.
