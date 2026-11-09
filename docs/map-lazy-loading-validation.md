# 지도 지연 로딩 성능 검증

> 2026-11-09 로컬 production build 비교. 고정 fixture와 Chromium 반복 측정이며, 운영 환경의 Core Web Vitals를 뜻하지 않는다.

## 질문과 구현

카드·목록 탐색에서는 지도 기능을 쓰지 않는다. 현재 `src/app/explore/page.tsx`는 Server Component로 검색 데이터와 URL 상태를 처리하고 `view=map`일 때만 `ExploreMapLoader`를 출력한다. `src/components/search/ExploreMapLoader.tsx`는 Client Component 경계에서 `next/dynamic`과 `ssr: false`를 사용해 `ExploreMap.tsx` 및 Leaflet을 로드한다. 서버 전용 데이터 조회와 브라우저 지도 코드를 분리하면서 지도 화면의 기존 동작은 유지하는 선택이다.

이전 코드의 직접 `ExploreMap` import를 그대로 재현한 기준선은 Next.js 16.4.2 프로덕션 서버에서 `window is not defined` 오류를 내어 유효한 페이지 비교가 불가능했다. 대신 현재 소스의 격리 빌드에만 `useEffect` 기반 eager preload를 추가했다. 이 비교 조건은 Explore 페이지 hydration 후 보기 상태와 무관하게 같은 지도 모듈을 요청한다. 현재 구현과 실험 조건의 차이는 이 preload 한 가지이며, 앱 소스는 측정 후 원래 상태로 복원했다.

## 재현 환경

| 항목          | 설정                                                               |
| ------------- | ------------------------------------------------------------------ |
| 저장소 기준   | `main`, HEAD `89d0eaf3f20580c1309df4307fc0d5a9e75cd6fe`            |
| 실행일        | 2026-11-09 (Asia/Seoul)                                            |
| OS·런타임     | Windows, Node 22.20.0, npm 10.9.3                                  |
| 앱            | Next.js 16.4.2, React 19.2.8, production build / `next start`      |
| 브라우저      | Playwright Chromium, 153.0.8010.12                                 |
| 화면          | 412 × 823 CSS px, DPR 1.75                                         |
| 네트워크      | CDP throttling, RTT 150ms, 다운로드 1,638.4Kbps, 업로드 675Kbps    |
| CPU           | CDP 4× slowdown                                                    |
| 브라우저 캐시 | 각 실행마다 새 context, CDP cache disabled                         |
| 데이터        | TourAPI E2E fixture, 이미지가 필요한 경우 로컬 합성 이미지 fixture |
| 외부 요청     | 차단. 지도 타일과 외부 폰트는 결과에 포함하지 않음                 |
| 반복          | eager preload / lazy 각각 카드 보기 5회, 지도 보기 5회             |

측정은 직접 URL 진입으로 시작한다. 페이지 `load` 뒤 같은 4초 자원 수집 창을 적용한다. LCP/FCP는 브라우저 Performance API에서 읽고, JS 바이트는 `PerformanceResourceTiming.transferSize` 합계다. 이 값에는 브라우저가 보고한 전송 헤더 바이트가 포함된다. 지도 청크는 production loadable manifest의 파일 경로로 식별한다. 지도 표시 시점은 지도 region과 첫 마커가 나타난 때, 상호작용 시점은 첫 마커에 키보드 Enter를 보내 팝업의 상세 링크가 표시된 때다. JSON에는 각 반복의 Navigation Timing, LCP 후보, JS 요청 경로·시작·완료·바이트 및 지도 상호작용 시간을 보존했다.

## 결과

수치는 각 조건 5회 표본의 중앙값이다. 카드 보기의 비교 표에서 `eager preload`는 초기 hydration 후 지도 모듈을 요청하는 기준 조건이고, `lazy`는 현재 구현이다.

| 카드 보기 지표                |       Eager preload |          Lazy | 해석                                               |
| ----------------------------- | ------------------: | ------------: | -------------------------------------------------- |
| FCP                           |               816ms |         816ms | 중앙값 동일                                        |
| LCP                           |             1,600ms |       1,500ms | 100ms 차이. 이 표본만으로 개선이라고 단정하지 않음 |
| LCP까지 JS 전송               |       184,726 bytes | 184,660 bytes | 66 bytes 차이로 사실상 동일                        |
| 페이지 load 후 4초 내 JS 전송 |       233,465 bytes | 187,864 bytes | 45,601 bytes 감소, 약 19.5%                        |
| 지도 JS 청크 요청             | 5/5회, 45,535 bytes |         0/5회 | 카드 보기에서는 요청을 생략                        |

Eager preload 조건의 카드 보기에서는 Leaflet 청크 요청이 매번 발생했고 요청 시작 중앙값은 2,690ms였다. 카드 보기 LCP 중앙값 1,600ms 뒤에 요청되어 LCP 시점의 JS 양과 FCP 중앙값에는 차이가 거의 없었다. 따라서 이 실험의 확인 가능한 효과는 LCP 개선이 아니라 지도 화면을 사용하지 않을 때 약 45.5KB의 JS 요청을 피한 것이다.

지도 보기에서는 두 조건 모두 지도 청크를 5/5회 요청했다. 지도가 나타난 시점 중앙값은 eager preload 3,673ms, lazy 3,318ms였고, 키보드 마커 조작 후 팝업이 열린 시점은 각각 3,946ms와 3,577ms였다. 관측값은 lazy가 각각 355ms, 369ms 빨랐지만 표본이 작고 실행 편차가 있어 속도 향상으로 주장하지 않는다. 확인 가능한 기능 효과는 지도 표시와 마커 팝업 상호작용이 유지됐다는 점이다.

| 지도 보기 지표           | Eager preload |          Lazy | 해석                                     |
| ------------------------ | ------------: | ------------: | ---------------------------------------- |
| 지도 JS 요청 시작 중앙값 |       2,491ms |       2,104ms | 탐색 URL 진입 후 시점                    |
| 지도 JS 전송             |  45,535 bytes |  45,551 bytes | 양쪽 모두 청크 요청                      |
| 전체 JS, load 후 4초     | 233,914 bytes | 233,415 bytes | 빌드별 공통 청크 차이를 포함해 거의 같음 |
| 첫 마커 표시             |       3,673ms |       3,318ms | 지도 컨테이너와 마커 기준                |
| 마커 팝업 상호작용       |       3,946ms |       3,577ms | 키보드 Enter 뒤 팝업 상세 링크 표시      |

탐색 페이지의 LCP 후보는 카드 보기에서 첫 관광지 이미지(`<img>`), 지도 보기에서는 탐색 설명 문단(`<p>`)으로 관측됐다. 지도 자체가 LCP 요소가 아니므로 LCP를 지도 지연 로딩의 직접 성과로 표현하지 않는다. 지도 보기의 LCP 중앙값은 eager preload 1,380ms, lazy 1,324ms였고 FCP 중앙값은 두 조건 모두 788ms였다.

## 원본 결과와 재현

- [Eager preload 10회 결과 JSON](../performance/results/map-lazy-loading-eager-preload.json)
- [Lazy 10회 결과 JSON](../performance/results/map-lazy-loading-lazy.json)
- [Playwright 측정 코드](../performance/tf09/map-lazy-loading.spec.ts) · [설정](../playwright.tf09.config.ts)

두 production build는 `TOUR_API_E2E_FIXTURES=true`, `TOUR_API_PERF_FIXTURES=true` 및 fixture 전용 서비스 키로 수행한다. 비교를 재실행하려면 현재 구현으로 build한 다음 측정 config를 실행한다. eager 조건을 만들 때는 문서의 격리 절차에 따라 임시 preload를 추가해 같은 코드를 비교하고, 각 측정 뒤 현재 소스와 `.next`를 lazy 조건으로 재빌드한다. 실제 서비스 키는 사용하거나 결과에 기록하지 않는다.

결과 파일은 반복별 요청 원본을 보존한다. LCP까지 JS 전송 합계는 각 `javaScriptResourcesWithinCollectionWindow` 항목 중 `responseEnd <= lcpMs`인 전송 크기를 더했다. 결과 JSON의 파생 합계도 이 항목에서 재계산했다. 중앙값은 해당 조건 5개 값을 정렬해 세 번째 값으로 산출했다.

## 한계와 해석

- 로컬 production build 및 합성 TourAPI fixture이므로 실제 API 응답, CDN, 운영 캐시, 실제 기기 성능을 대표하지 않는다. 서버 프로세스의 fixture·이미지 변환 캐시는 반복 중 따뜻해질 수 있다.
- 외부 요청을 차단해 OpenStreetMap 타일 전송과 화면 완성 시간은 측정하지 않았다. 지도 준비 지표는 Leaflet 코드, 지도 컨테이너, 마커 및 로컬 앱 동작을 대상으로 한다.
- 각 조건 5회 표본은 작은 실험이다. FCP/LCP 차이는 안정적인 개선 근거로 보지 않는다. Lighthouse 점수나 공식 TBT도 수집하지 않았다.
- 과거 [`explore-performance-audit-2026.md`](explore-performance-audit-2026.md)의 Lighthouse 실험은 지도 분할과 폰트 요청 축소가 함께 적용된 전후 각 3회 측정이다. 당시 LCP와 전체 전송량 감소를 지도 지연 로딩 단독 효과로 귀속할 수 없고, TBT 악화도 별도로 기록돼 있다.

## 포트폴리오에 쓸 근거

**이력서용:** Explore 페이지에서 지도 전용 Leaflet 코드를 `next/dynamic`으로 분리했습니다. 동일 production fixture의 5회 반복에서 카드 보기의 4초 내 JS 전송 중앙값을 233,465 bytes에서 187,864 bytes로 줄였고, LCP 개선은 확인된 성과로 주장하지 않았습니다.

**면접용:** “검색 결과에서 사용자가 기본으로 보는 것은 카드 목록이라 Leaflet 지도가 초기 탐색에 필요하지 않았습니다. 서버에서 URL과 데이터를 처리하고 지도만 Client Component로 나눈 뒤 동적 import와 SSR 비활성화를 적용했습니다. production fixture에서 eager preload와 5회씩 비교했을 때 카드 화면은 45.6KB의 지도 청크 요청을 모두 생략했지만 LCP 시점의 JS 양과 LCP 중앙값은 사실상 달라지지 않았습니다. 지도 화면에서는 청크가 정상 로드되고 마커 팝업 키보드 조작도 확인했습니다. 그래서 성과는 LCP 개선이 아니라 기본 탐색에서 불필요한 지도 JS 요청을 줄인 것으로 설명합니다.”
