# Trip Finder 작업 기록

## 프로젝트 목표

Next.js·TypeScript·공공 API·접근성·검색 노출·테스트 역량을 보여주는 국내 여행지 탐색 서비스.

## 현재까지 완료

### 기능/API

- Tour API 연동 및 응답 스키마 검증·정규화
- 지역·시군구·분류 1~3단계·키워드 검색
- URL 기반 필터/검색 상태 유지 및 페이지 범위 보정
- 카드/목록/지도 보기 전환 및 지도 마커 자동 범위 조정
- 가나다순 결과 표시, 빈 결과 안내, 필터 초기화
- 상세 공통·소개·반복정보·이미지 API 연동
- 상세 이미지 갤러리/확대, 주소 복사, 공유, 지도·홈페이지 연결
- 로컬 저장 기반 북마크와 토스트 피드백

### UI/UX

- Paperlogy 웹폰트 9개 웨이트 전역 적용
- 홈 히어로·상단 빠른 이동 메뉴·전체 17개 지역·카테고리 진입점
- 계절 추천 영역에 속초·경주·정읍·순천의 구체 여행지 연결
- 반응형 필터 패널과 필터 변경 시 스크롤 위치 유지
- 이미지 없는 카드용 시각적 플레이스홀더
- Lucide 스타일 선형 SVG 아이콘 시스템 통일(Compass 로고 포함)
- 상세 페이지 장식성 영문 라벨 제거 및 정보 계층 단순화
- 밝은 하늘색/청록 계열과 슬레이트 텍스트 중심의 대비 개선
- 현재 17개 시·도 코드 기준 지역 라벨 매핑 정리

### 품질/운영

- 메타데이터, Open Graph, robots, 동적 sitemap 구성
- 이미지 모달 키보드 포커스·Escape·복원 처리
- Vitest·Playwright·접근성 검사·의존성 점검 구성

## 검증 결과

- ESLint 경고 없이 통과
- TypeScript 타입 검사 통과
- Vitest 29개 파일, 153개 테스트 통과
- Next.js 프로덕션 빌드 통과
- GitHub Actions 통합 CI 통과(format · lint · typecheck · Vitest coverage · Playwright E2E · build)
- Vitest 29개 파일, 153개 테스트 통과
- Playwright E2E 8개 시나리오 3회 연속 통과 · retry 없음
- Production Lighthouse Mobile 최종 측정
  - Home: Performance 99 / Accessibility 100 / Best Practices 100 / SEO 100 / LCP 1.7s
  - Explore: Performance 68 / Accessibility 100 / Best Practices 100 / SEO 100 / LCP 6.2s / CLS 0
  - Detail: Performance 85 / Accessibility 100 / Best Practices 100 / SEO 92 / LCP 3.6s / CLS 0
- Vercel Production 최종 배포 완료

## 마감 상태

핵심 기능, UI/UX, 테스트, 접근성, CI, Production 배포와 Lighthouse 측정까지 완료했다. Explore와 Detail의 Performance는 외부 TourAPI·이미지·네트워크 상태에 따라 변동할 수 있으며, LCP 이미지 discovery와 우선순위 적용은 최종 측정에서 확인했다.

반복 상세정보의 duplicate key는 normalizer에서 안정적인 domain ID를 생성하도록 수정했고, Explore E2E의 API 응답 대기 구간은 TourAPI client의 시간 계약에 맞춰 동기화했다. 수정 후 E2E 8개 시나리오를 3회 연속 retry 없이 통과했으며 duplicate key·console error가 재발하지 않아 프로젝트 코드 작업을 마감한다.
