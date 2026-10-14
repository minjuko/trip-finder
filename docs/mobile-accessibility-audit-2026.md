# 모바일 사용자 흐름·접근성·예외 상태 검증 (2026)

## 1. 검증 환경

- 검증일: 2026-10-14 (Asia/Seoul)
- 대상: Next.js 16.3.5 App Router, React 19.2.8, TypeScript 5
- 브라우저: Chromium(Playwright), 로컬 Chrome 실화면 확인
- 화면 크기: 모바일 390×844, 태블릿 768×1024, 데스크톱 1440×900
- 데이터: 기존 E2E는 `.env.local`의 실제 TourAPI 연동을 사용했다. Vitest의 API 계층 테스트는 fixture와 mock을 사용해 외부 네트워크와 분리했다.
- 변경 전 기준선: Git 작업 트리 clean, Vitest 29파일·153개 및 Playwright 8개 통과

## 2. 화면 크기별 검증 결과

| 화면 | 결과 | 확인 내용 |
| --- | --- | --- |
| 390×844 | 통과(수정 후) | 홈·검색·결과·상세에 가로 스크롤 없음, 검색/필터/결과/이미지/모달 가시성 정상 |
| 768×1024 | 통과 | 상세 갤러리와 필터 배치 정상, 가로 스크롤 및 깨진 이미지 없음 |
| 1440×900 | 통과 | 데스크톱 갤러리·사이드바 배치 정상, 가로 스크롤 및 깨진 이미지 없음 |

Playwright의 `e2e/mobile-flow.spec.ts`가 세 화면 크기의 `documentElement.scrollWidth <= innerWidth`를 회귀 검증한다.

## 3. 모바일 사용자 흐름

390px에서 홈 진입 → `해수욕장` 검색 → 결과 확인 → 상세 이동 → 상세 이미지 확인 → 관심 여행지 저장/해제 → 이미지 모달 열기/닫기 → 브라우저 뒤로 가기를 검증했다.

- 검색어는 `/explore?keyword=...`에 반영되고 상세에서 돌아온 뒤 입력값과 결과 조건이 유지됐다.
- 상세 카드, 대표·추가 이미지, 대체 이미지 상태는 모바일 폭을 넘지 않았다.
- 관심 여행지 버튼은 `aria-pressed`로 저장/해제 상태를 노출했다.
- 기존 36~39px였던 주요 모바일 터치 영역을 최소 44px로 조정했다.

## 4. 키보드 접근성

- 검색 입력에서 Enter로 검색 가능
- 링크와 버튼은 기본 Tab 순서와 접근 가능한 이름을 제공
- 이미지 모달을 Enter로 열면 닫기 버튼으로 포커스 이동
- 모달 안에서 Tab 포커스 유지
- Escape로 닫기 및 실행 버튼으로 포커스 복원
- `focus-visible` 스타일과 입력 label 확인
- axe의 홈·탐색·상세·관심 여행지 serious/critical 위반 0건

DOM 수동 검토에서 이미지 모달의 `role="dialog"`, `aria-modal`, 닫기 버튼 이름과 카드 이미지 대체 텍스트/장식 이미지 처리를 확인했다.

## 5. Loading·Empty·Error 상태

| 상태 | 검증 결과 |
| --- | --- |
| Loading | 탐색/상세 `loading.tsx`가 `aria-busy`와 상태 이름을 제공 |
| Success | 실제 TourAPI 검색·상세 E2E 통과 |
| Empty | 빈 TourAPI 목록은 normalizer에서 빈 배열로 처리되고 `TourList`, 관심 여행지 목록은 명시적 empty UI 제공 |
| Error | HTTP 오류·TourAPI resultCode 오류·필터 옵션 실패가 기존 mock 테스트에서 오류로 분리됨. App Router 오류 경계는 다시 시도 버튼 제공 |

- 상세 공통 데이터가 없으면 `notFound()`로 404 상태를 표시한다.
- 대표 이미지가 없으면 카드와 상세 갤러리에서 대체 UI를 표시한다.
- 잘못된 URL은 `not-found.tsx`에서 홈/탐색 복귀 링크를 제공한다.
- 관심 여행지 저장 데이터가 없거나 손상되면 오류가 아닌 empty 상태로 처리한다.
- API 지연은 10초 `AbortSignal.timeout` 이후 `TIMEOUT` 오류로 분류된다.
- 실제 네트워크에서 실패 후 정상 응답으로 전환하는 재시도는 외부 API 상태를 강제로 바꾸지 않았으며, 오류 경계의 reset 경로를 코드 검토했다.

## 6. 발견한 결함

1. 모바일 홈 빠른 이동, 탐색 보기 전환, 필터 select, 카드 저장 버튼, 모달 닫기 버튼 일부가 36~40px 높이여서 44px 터치 영역 기준에 미달했다.
2. 이미지 모달이 열린 동안 `body` 스크롤이 유지되어 배경 페이지를 움직일 수 있었다.

가로 스크롤, 텍스트 잘림, 이미지 레이아웃 파손, 포커스 미복원, 접근 가능한 이름 누락은 재현되지 않았다.

## 7. 수정 내용

- `Header.tsx`: 로고와 홈 빠른 이동 링크에 44px 최소 높이 적용
- `ExploreRegionFilter.tsx`, `ExploreClassificationFilter.tsx`: select 최소 높이 44px 적용
- `ExploreViewToggle.tsx`: 보기 전환 버튼을 44×44px로 확대
- `BookmarkButton.tsx`: 저장 버튼 최소 높이 44px 적용
- `TourDetailGallery.tsx`: 모달 닫기 버튼을 44×44px로 확대하고, 모달 생명주기 동안 배경 스크롤 잠금/복원

## 8. 추가한 테스트

- 기존: Vitest 29파일·153개, Playwright 8개
- 추가: Vitest 1파일·1개, Playwright 1파일·4개
- 최종: Vitest 30파일·154개, Playwright 12개

`TourDetailGallery.test.tsx`는 포커스 이동·Tab 유지·Escape 닫기·포커스 복원·배경 스크롤 잠금을 mock 이미지로 검증한다. `mobile-flow.spec.ts`는 세 화면 크기와 실제 TourAPI 기반 모바일 검색·상세·저장/해제·복귀 흐름을 검증한다.

## 9. 최종 검증 결과

| 명령 | 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm run test` | 30파일·154개 통과 |
| `npm run test:e2e` | 12개 통과 |
| `npm run build` | 통과, 정적·동적 라우트 생성 완료 |
| `git diff --check` | 통과 |

## 10. 미검증 사항

- TourAPI 장애 후 같은 요청이 정상화되는 실제 외부 서비스 복구 과정은 의도적으로 장애를 주입하지 않았다.
- iOS Safari 및 Android 실기기의 브라우저 UI·화면 회전·보조기기 조합은 검증 범위에 포함하지 않았다.
- `npm run format:check`는 이번 작업 전부터 `src/app/globals.css`, `src/app/layout.tsx` 두 파일의 포맷 차이로 실패한다. 기존 변경 보존 원칙에 따라 본 작업에서 일괄 포맷하지 않았다.
- 코드와 회귀 테스트: `36ad43e` (`fix: 모바일 탐색 흐름과 접근성 개선`)
