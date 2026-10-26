# Explore 모바일 성능 측정 및 최적화 (2026)

> **과거 실험 기록 (2026-10-14)**: 아래 Lighthouse 13.5 결과는 당시 로컬 환경과 실제 TourAPI 응답을 사용한 별도 실험입니다. 결과는 현재 CI 상태나 운영 성능을 나타내지 않습니다. 특히 변경 후 TBT 중앙값은 12ms에서 248ms로 악화됐으며, 이 사실을 성능 판단에서 제외하지 않습니다. 표본이 각 3회이고 API 응답과 캐시 조건이 완전히 고정되지 않았으므로 원인과 인과관계를 단정할 수 없습니다.
>
> 아래에 기록된 Vitest 30개 파일/154개 테스트, Playwright 12개 통과는 당시 상태입니다. 현재 저장소 기준 CI #65는 [GitHub Actions 실행 기록](https://github.com/minjuko/trip-finder/actions/runs/40282569373)에서 확인할 수 있습니다. TF07 Performance API fixture 및 TF08 합성 이미지 결과와는 측정 도구·데이터·환경이 달라 직접 비교하지 않습니다.

## 1. 측정 목적

과거 README의 Lighthouse Mobile 68점을 기준선으로 재사용하지 않고, 동일한 로컬 production 환경에서 Explore 검색 결과 페이지를 전후 각 3회 측정해 가장 큰 병목만 최소 범위로 개선했다.

## 2. 측정 환경

- 측정일: 2026-10-14 (Asia/Seoul)
- Node.js: 22.20.0
- npm: 10.9.3
- Next.js: 16.3.5
- Chrome: 155.0.8059.39
- Lighthouse: 13.5.0
- URL: `http://127.0.0.1:3000/explore?keyword=해수욕장`
- 실행 모드: `next build` 후 `next start` production server
- 장치: Lighthouse mobile, 412×823 CSS px, DPR 1.75
- 네트워크: simulated, RTT 150ms, throughput 1,638.4Kbps, download 1,474.56Kbps, upload 675Kbps
- CPU: 4× slowdown
- 브라우저 캐시: Lighthouse 기본 storage reset을 매 실행 적용한 cold browser cache
- 서버 데이터 캐시: 각 측정군 시작 전 URL을 1회 요청해 TourAPI 결과를 예열하고, 이후 동일 URL과 Next.js 10분 목록 재검증 캐시를 사용

Lighthouse 측정은 실제 TourAPI 결과를 사용했다. Vitest의 API 계약 검증은 fixture/mock이며 성능 수치와 분리했다. 측정 시간 동안 동일 검색어와 페이지를 사용했지만 외부 API 원본 데이터 자체를 고정한 mock 성능 서버는 사용하지 않았다.

## 3. 기준선 3회 결과

| 실행 | Performance |     FCP |     LCP | Speed Index |  TBT |     CLS | TTFB |
| ---- | ----------: | ------: | ------: | ----------: | ---: | ------: | ---: |
| 1    |          67 | 4,100ms | 6,598ms |     4,100ms |  0ms |       0 | 33ms |
| 2    |          66 | 4,086ms | 7,161ms |     4,086ms | 27ms |       0 | 28ms |
| 3    |          64 | 4,850ms | 7,267ms |     4,850ms | 12ms | 0.00007 | 23ms |

## 4. 기준선 중앙값

- Performance: 66
- FCP: 4,100ms
- LCP: 7,161ms
- Speed Index: 4,100ms
- TBT: 12ms
- CLS: 0
- TTFB: 28ms
- 총 전송량: 1,249,259 bytes

## 5. 병목 분석

LCP 요소는 첫 번째 관광지 카드의 대표 이미지였다. `next/image`가 `fetchpriority="high"`, eager loading과 반응형 `srcset`을 제공하고 있어 이미지 자체의 추가 절감 진단은 약 5KiB에 그쳤다.

서버 TTFB 중앙값은 28ms였고 TourAPI 목록·지역·분류 요청은 서버에서 병렬 처리된다. 목록 10분, 지역/분류 24시간 재검증 정책도 적용돼 서버/API는 이번 측정의 주 병목이 아니었다.

가장 큰 네트워크 비용은 Paperlogy 400·500·600·700 네 개 외부 폰트로 약 646KB였다. 기본 카드 보기에서도 지도 전용 Leaflet 청크 약 48KB가 전송됐고 그중 약 45KB가 미사용 JavaScript로 진단됐다. 전체 전송량은 약 1.25MB였다.

로컬 CSS 두 파일 약 13KB가 렌더링 차단 리소스로 분류됐지만 크기가 작고 Tailwind 전역 스타일 분리는 변경 위험 대비 근거가 약했다. CLS는 사실상 0이었고 초기 TBT도 낮았다. 중복 JavaScript 진단은 없었다.

## 6. 개선 대상 선정 이유

1. 폰트 요청 축소
   - 근거: 상위 네트워크 리소스 네 개가 각각 약 161KB
   - 영향: LCP 이미지와 경쟁하는 약 322KB 및 두 요청 제거
   - 범위: CSS의 500·600 굵기가 기존 400·700 파일을 재사용하도록 URL만 변경
   - 기능 영향: 폰트 패밀리와 CSS font-weight 값은 유지되며 중간 굵기만 인접 파일로 표현

2. 지도 모듈 지연 로딩
   - 근거: 카드 보기에서 Leaflet 청크 약 48KB, 약 45KB 미사용
   - 영향: 기본 카드/목록 화면에서 지도 JavaScript와 Leaflet CSS 다운로드 제거
   - 범위: 작은 Client loader 한 파일과 Explore의 컴포넌트 참조만 변경
   - 기능 영향: `view=map`일 때 기존 `ExploreMap`을 그대로 로드하며 URL 상태와 지도 동작 유지

## 7. 실제 수정 내용

- `src/app/globals.css`: 500 굵기는 400 파일, 600 굵기는 700 파일 URL을 공유해 실제 폰트 요청을 4개에서 2개로 축소
- `src/components/search/ExploreMapLoader.tsx`: `next/dynamic`과 `ssr: false`로 Leaflet 지도 구현을 선택 시점까지 지연
- `src/app/explore/page.tsx`: 지도 분기에서 loader를 사용

서버 TourAPI 호출, 검색·필터·페이지네이션, URL 상태, 캐시 주기는 변경하지 않았다.

## 8. 수정 후 3회 결과

| 실행 | Performance |     FCP |     LCP | Speed Index |   TBT |     CLS | TTFB |
| ---- | ----------: | ------: | ------: | ----------: | ----: | ------: | ---: |
| 1    |          69 | 3,286ms | 5,318ms |     3,286ms | 251ms |       0 | 40ms |
| 2    |          69 | 3,262ms | 5,354ms |     3,262ms | 248ms |       0 | 24ms |
| 3    |          73 | 3,366ms | 5,110ms |     3,366ms | 129ms | 0.00006 | 24ms |

수정 후 총 전송량은 878,710~881,571 bytes였다. 기본 카드 보기의 Leaflet 청크는 네트워크 및 미사용 JavaScript 목록에서 제거됐고 폰트 요청은 두 개로 줄었다.

## 9. 전후 중앙값 비교

| 지표        |          기준선 |       수정 후 |                    변화 |
| ----------- | --------------: | ------------: | ----------------------: |
| Performance |              66 |            69 |                    +3점 |
| FCP         |         4,100ms |       3,286ms |         -814ms (-19.9%) |
| LCP         |         7,161ms |       5,318ms |       -1,843ms (-25.7%) |
| Speed Index |         4,100ms |       3,286ms |         -814ms (-19.9%) |
| TBT         |            12ms |         248ms |           +236ms (악화) |
| CLS         |               0 |             0 |               변화 없음 |
| TTFB        |            28ms |          24ms |                    -4ms |
| 총 전송량   | 1,249,259 bytes | 880,359 bytes | -368,900 bytes (-29.5%) |

FCP·LCP·Speed Index와 전송량은 세 번 모두 기준선보다 낮아졌다. 반면 TBT는 명확히 악화됐다. 변경이 JavaScript 실행량을 추가하지 않고 Leaflet 전송을 제거했음에도 발생했으므로 로컬 호스트 CPU 부하 변동 가능성이 있지만, 이번 측정만으로 원인을 단정하거나 TBT가 개선됐다고 주장하지 않는다. 이 변동 때문에 전체 점수 개선 폭은 +3점에 머물렀다.

## 10. 기능 회귀 검증

- `npm run test`: 30파일·154개 통과
- `npm run test:e2e`: 12개 통과
- 검색, 지역 필터, URL 기반 정렬·보기 방식, 지도 표시, 상세 이동, 저장/해제, 뒤로 가기 상태 유지 검증
- 모바일 390×844, 태블릿 768×1024, 데스크톱 1440×900 가로 overflow 검증
- axe 홈·탐색·상세·관심 목록 검증 및 이미지 모달 키보드 흐름 통과
- 빈 목록·API 오류·필터 옵션 실패는 기존 Vitest mock 시나리오 통과

## 11. 측정의 한계

- 로컬 Windows 호스트의 CPU 부하가 완전히 격리되지 않아 TBT 변동이 컸다.
- TourAPI 데이터는 Next.js 캐시로 예열했지만 별도 mock 성능 서버로 응답 본문을 고정하지 않았다.
- 로컬 HTTP/1.1과 실제 Vercel CDN·HTTP/2/3 환경은 다르다.
- LCP는 여전히 5초 이상이며 첫 카드 이미지와 렌더링 차단 CSS가 후속 후보로 남는다.
- 세 번의 lab 측정은 실제 사용자 Core Web Vitals를 대신하지 않는다.

## 12. 재현 방법

```powershell
npm.cmd run build
npm.cmd run start
npx.cmd --yes lighthouse "http://127.0.0.1:3000/explore?keyword=%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5" `
  --only-categories=performance `
  --output=json `
  --chrome-path="C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --chrome-flags="--headless --no-sandbox" `
  --throttling-method=simulate
```

서버를 재시작하거나 build를 바꾼 뒤에는 측정 URL을 한 번 요청해 TourAPI 캐시를 예열한다. 전후 각각 같은 명령으로 세 번 실행하고 단일 최고점이 아닌 중앙값을 비교한다.

## 13. 관련 파일 및 커밋

- `src/app/globals.css`
- `src/app/explore/page.tsx`
- `src/components/search/ExploreMapLoader.tsx`
- `3a8c7ca` — `perf: 관광지 탐색 페이지 렌더링 성능 개선`
