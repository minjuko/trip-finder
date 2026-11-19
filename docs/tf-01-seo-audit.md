# TF-01 TripFinder SEO 배포 감사

## 1. 목적 및 기준

- 작업 ID: `TF-01`
- GitHub Issue: [#1 — 배포 SEO 상태 감사 및 sitemap·robots·canonical 검증](https://github.com/minjuko/trip-finder/issues/1)
- 감사 기준 브랜치: `audit/tf-01-seo`
- 대상 소스 SHA: `fd5e5bf9b076370a3389b3660729f67c17f43137` (`origin/main`의 fast-forward 이후)
- 운영 주소: <https://trip-finder-mauve.vercel.app/>
- 운영 응답 관측 시각: 2026-11-19 12:06–12:09 KST (03:06–03:09 UTC)
- 범위: 소스의 metadata/robots/sitemap 생성 관계와 운영 HTTP 응답을 대조했다. 코드는 변경하지 않았다.

## 2. 현재 SEO 구현 구조 — 소스 코드 감사

| 파일 | 현재 구현 |
|---|---|
| `src/app/layout.tsx` | `metadataBase`는 `NEXT_PUBLIC_SITE_URL` 또는 운영 주소를 사용한다. 기본 title template, description, Open Graph/Twitter 값과 root canonical `/`를 설정한다. |
| `src/app/page.tsx` | 홈 title/description을 설정하고 root metadata의 canonical 및 Open Graph URL을 상속한다. |
| `src/app/explore/page.tsx` | `/explore`의 title/description, canonical, Open Graph URL을 명시한다. `searchParams`는 `parseExploreQuery`와 `getExploreData`로 결과에 사용하지만 canonical 생성에는 포함하지 않는다. |
| `src/app/places/[contentId]/page.tsx` | `generateMetadata`가 `getTourDetail(contentId)`에서 가져온 제목·개요·주소·이미지로 동적 metadata를 만든다. canonical과 Open Graph URL은 실제 `detail.id`를 사용한다. 페이지는 같은 상세 조회 결과가 없으면 `notFound()`를 호출한다. `TouristAttraction` JSON-LD도 생성한다. |
| `src/app/bookmarks/page.tsx` | title/description만 선언한다. route 전용 canonical 및 robots 설정이 없어 root layout의 canonical `/`을 상속한다. |
| `src/app/robots.ts` | 모든 user-agent에 `Allow: /`, `Disallow: /api/`를 적용한다. sitemap URL은 `https://trip-finder-mauve.vercel.app/sitemap.xml`로 고정돼 있다. |
| `src/app/sitemap.ts` | `NEXT_PUBLIC_SITE_URL` 또는 운영 주소를 URL base로 사용한다. `revalidate = 3600`; TourAPI `getAreaBasedList({ page: 1, pageSize: 100 })`의 결과만 장소 URL로 추가한다. 조회 예외는 catch하고 홈·탐색 URL만 반환한다. |
| `src/app/api/**/route.ts` | `src/app/api/classifications/route.ts`, `src/app/api/regions/[regionCode]/districts/route.ts`가 공개 GET endpoint다. robots 규칙의 `/api/`에 포함된다. |

`NEXT_PUBLIC_SITE_URL` 사용 위치는 `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/places/[contentId]/page.tsx`, `.env.example`이다. 현재 운영 응답에서 이 값 자체는 볼 수 없지만, 생성된 canonical, Open Graph URL, sitemap URL의 host는 모두 운영 host와 일치했다.

`src/app` 및 `src` 검색에서 SEO metadata 전용 테스트는 찾지 못했다. 기존 Vitest 및 Playwright 테스트는 존재하지만 이번 감사에서는 실행하지 않았다.

## 3. 실제 운영 HTTP 검증

아래 URL은 운영 서버에 직접 GET 요청했다. HTML metadata는 원문 응답에서 확인했다. `X-Robots-Tag`는 아래 모든 응답에서 없었고, HTML 페이지에도 별도 `meta name="robots"`가 없었다. 그러므로 공개 HTML 페이지는 관측상 robots meta/header에 의한 noindex가 없고 `robots.txt`의 기본 allow를 받는다.

| URL | HTTP / Content-Type | 관측된 title 및 canonical / robots |
|---|---|---|
| `/` | `200` / `text/html; charset=utf-8` | `국내 여행지 탐색`; canonical과 `og:url`은 `https://trip-finder-mauve.vercel.app`; robots meta/header 없음 |
| `/explore` | `200` / `text/html; charset=utf-8` | `여행지 탐색 \| TripFinder`; canonical과 `og:url`은 `/explore`; robots meta/header 없음 |
| `/explore?region=11&sort=created` | `200` / `text/html; charset=utf-8` | canonical은 query 없는 `/explore` |
| `/explore?keyword=seoul&sort=modified` | `200` / `text/html; charset=utf-8` | canonical은 query 없는 `/explore` |
| `/places/2750144` | `200` / `text/html; charset=utf-8` | sitemap에 있는 유효 상세 ID. 동적 title `가가상점 \| TripFinder`; canonical과 `og:url`은 `/places/2750144`; 상세 description 생성 확인 |
| `/bookmarks` | `200` / `text/html; charset=utf-8` | `관심 여행지 \| TripFinder`; canonical과 `og:url`이 잘못 상속된 root URL; robots meta/header 없음 |
| `/robots.txt` | `200` / `text/plain; charset=utf-8` | `Allow: /`, `Disallow: /api/`, sitemap URL은 운영 host의 `/sitemap.xml` |
| `/sitemap.xml` | `200` / `application/xml` | 102 URL: 홈 1, `/explore` 1, 장소 상세 100. 모든 `<loc>`의 host가 운영 host이며 `/places/2750144` 포함 |
| `/api/classifications?depth2=NA02` | `400` / `application/json` | `depth2 requires depth1`; route가 요구하는 상위 분류 없이 요청한 경우의 검증 응답. `robots.txt`의 `/api/` disallow 대상 |

탐색 변형 두 건 외에 `/explore?region=11`, `/explore?keyword=seoul&sort=latest`도 `200`을 반환했고 canonical은 `/explore`였다. `sort=latest`는 코드상 허용되지 않는 값이라 `title`로 정규화되지만 HTTP 응답 자체는 정상이다.

주요 응답 헤더 관측:

- 공통 응답 `Date`: `Thu, 19 Nov 2026 03:06–03:09 GMT`; 서버 `Vercel`.
- `/explore` 및 상세 페이지는 `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`로 응답했다. query 변형도 동일했다.
- `/sitemap.xml` 관측 시 `X-Vercel-Cache: HIT`, `Age: 169`, `Cache-Control: public, max-age=0, must-revalidate`였다. 소스의 `revalidate = 3600`과 1시간 이후 실제 재생성 여부는 기다려 검증하지 않았다.
- `/`는 `X-Vercel-Cache: HIT`, `Age: 738987`; 홈은 현재 정적 응답으로 보이나 이 값만으로 stale 여부를 단정하지 않았다.
- 이번 운영 응답에서 robots의 고정 sitemap URL과 sitemap의 환경변수 기반 URL은 실제로 불일치하지 않았다. 두 경로 모두 `https://trip-finder-mauve.vercel.app` host를 사용했다.

## 4. 확인된 문제와 위험

| 항목 | 상태 / 영향도 | 소스 및 운영 근거 | 영향 및 최소 조치 |
|---|---|---|---|
| 북마크 canonical 상속 | **개선 필요 / 중간** | `src/app/bookmarks/page.tsx`는 route metadata에 `alternates`와 `robots`를 지정하지 않는다. 운영 `/bookmarks` 응답의 canonical 및 `og:url`은 홈 URL이다. | localStorage 기반 개인 관심 목록 페이지가 홈의 대표 URL로 표시된다. `/bookmarks`에 전용 canonical과 `noindex`를 지정하는 metadata-only 변경을 제안한다. 색인 결과를 확인한 것은 아니며 검색 노출 여부를 주장하지 않는다. |
| API 크롤링 차단 | **현재 정책 정상 / 제한 있음** | `robots.ts`는 `/api/`를 disallow한다. 운영 robots 응답도 동일하다. API 응답에는 관측상 `X-Robots-Tag`가 없다. | 크롤러 접근을 제한하는 정책이며 인증이나 접근 통제가 아니다. robots disallow만으로 검색 결과에서 URL 노출이 반드시 제거되는 것은 아니다. API가 검색 결과에 절대 노출되면 안 된다는 요구가 있으면 `noindex` 응답 정책을 별도 검토해야 한다. [Google robots.txt 안내](https://developers.google.com/search/docs/crawling-indexing/robots/intro) |
| robots/sitemap host 분리 | **현재 정상 / 설정 drift 위험** | robots는 URL을 고정하고 sitemap은 `NEXT_PUBLIC_SITE_URL`을 사용한다. 운영 robots, canonical, Open Graph, sitemap `<loc>`는 이번 관측에서 모두 같은 host다. | 현재 배포 결함 증거는 없다. 향후 환경변수 변경 시 sitemap URL과 robots가 가리키는 sitemap host가 달라질 수 있다. 변경 시 배포 응답에서 두 URL을 함께 검수하면 된다. |
| sitemap 상세 URL 범위 | **요건 확인 필요 / 범위 제한** | `src/app/sitemap.ts`가 `page: 1`, `pageSize: 100`만 조회한다. 운영 XML도 장소 100건으로 전체 102건이다. | 모든 TourAPI 장소가 아니라 첫 페이지 100건만 사이트맵에 실린다. 전체 장소 URL이 목표인지 코드나 Issue에는 명시돼 있지 않다. 페이지를 무제한으로 순회하는 변경은 제안하지 않는다. 전체 범위가 필요하다고 결정되면 호출 상한·요청 예산·갱신 빈도를 정한 후 제한된 pagination을 별도 설계해야 한다. |
| TourAPI 실패 fallback | **정상적인 복구 경로 존재 / 장애 시 범위 축소 위험** | `sitemap.ts`는 목록 조회 예외를 catch하고 홈·탐색 두 URL을 계속 반환한다. | sitemap endpoint 전체 실패는 피하지만, 재생성 시 TourAPI가 실패하면 상세 URL이 일시적으로 빠질 수 있다. 이번 실측에서 장애 상황은 재현하지 않았고, 캐시된 sitemap이 실패 시에도 유지되는지는 검증하지 않았다. |

## 5. 정상적으로 동작한 부분

- metadataBase와 홈 canonical이 운영 주소를 가리킨다.
- 탐색 기본 경로와 필터/query 변형의 canonical이 `/explore`로 일관된다.
- 실제 sitemap에 수록된 상세 페이지 하나를 열어 200 응답, 동적 title/description, 자기 자신 canonical을 확인했다.
- `robots.txt`와 sitemap이 200이고, 두 sitemap host가 운영 host와 일치한다.
- `/api/`는 robots 정책으로 크롤링 차단을 요청한다.
- sitemap 목록 조회 예외를 처리하고 홈·탐색 항목을 남기는 코드 fallback이 있다.

## 6. 추가 검증이 필요한 사항

- Vercel의 실제 `NEXT_PUBLIC_SITE_URL` 설정값은 확인하지 않았다. 배포 응답으로 생성 결과만 확인했다.
- TourAPI 오류를 유도하지 않았으므로 fallback 결과는 코드로만 확인했다.
- `revalidate = 3600` 경과 후 실제 sitemap 재생성, TourAPI의 목록 변경 반영 시간은 검증하지 않았다.
- sitemap 100건이 전체 콘텐츠 중 어느 정도인지, 첫 페이지 순서가 사이트맵 우선순위에 적합한지 확인할 제품 기준이 없다.
- Search Console 접근 및 URL 검사 자료가 없어 색인 상태·검색 순위·검색 노출 결과는 확인하지 않았다.
- `/api/classifications?depth2=NA02`는 상위 분류가 누락된 400 응답으로 확인했다. 유효한 분류 요청은 TourAPI downstream 호출을 포함하므로 이번 SEO 감사에서 수행하지 않았다.

## 7. 수정 제안과 예상 영향

이번 브랜치에서는 읽기 전용 감사를 유지하고 코드를 고치지 않는다.

1. 후속 `TF-01` 구현 작업에서 `src/app/bookmarks/page.tsx` metadata에 전용 canonical과 `robots: { index: false, follow: false }`를 설정한다. 변경 영향은 북마크 URL의 색인·canonical metadata로 제한된다. localStorage, 북마크 UI/저장 동작은 건드리지 않는다.
2. sitemap 100건은 bounded 정책으로 기록하되, 전체 콘텐츠를 목표로 할지는 제품 기준을 먼저 확정한다. 승인 전에는 전체 pagination, 외부 API 호출량 증가, 재시도 로직을 추가하지 않는다.
3. robots/sitemap URL 생성이 향후 변경되면 배포 환경에서 `/robots.txt`의 sitemap 값과 `/sitemap.xml`의 `<loc>` host를 함께 비교한다. 현재는 불일치 결함이 재현되지 않았다.

## 8. 기존 테스트 및 기능 보호 계획

- 이 감사에서는 소스 코드, 검색·정렬, URL 복원, 북마크/localStorage, 지도, TourAPI 호출 정책을 변경하지 않았다.
- metadata 전용 기존 테스트는 발견하지 못했다. 기존 Vitest 및 Playwright suite는 소스 감사 단계에서 실행하지 않았다.
- 문서 전용 PR에서는 코드 회귀를 유발하는 변경이 없다. PR CI가 실행되면 그 결과를 별도로 기록한다.
- 후속 metadata 구현 시 `src/components/bookmark/BookmarkList.test.tsx` 및 `e2e/bookmark.spec.ts`를 보호하고 `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` 및 PR CI를 실행한다. 사용자 기능 E2E는 해당 metadata 변경과 별개이며, 임의의 broad skip을 적용하지 않는다.

## 9. 검증 명령과 결과

| 명령/검사 | 결과 |
|---|---|
| `git status --short`, `git branch --show-current`, `git rev-parse HEAD` | 시작 시 clean `main`, HEAD `b6164509908f139e316fe821ee0bf3ac2a5d23a1` 확인 |
| `git fetch origin`; `git rev-parse origin/main` | 성공. `origin/main`은 `fd5e5bf9b076370a3389b3660729f67c17f43137`; 로컬 main과 fast-forward 관계. 변경은 내부 감사 문서 삭제 1건이어서 fast-forward 후 감사 branch를 만들었다. |
| `git merge --ff-only origin/main`; `git switch -c audit/tf-01-seo` | 충돌 없이 fast-forward 및 권장 작업 branch 생성 |
| `curl.exe -sS -I https://trip-finder-mauve.vercel.app/` | `200 OK`, Vercel 응답 헤더 확인 |
| `curl.exe -sS -L -i <검증 URL>` | 11개 요청 대상에서 실제 GET 상태·Content-Type·HTML metadata·canonical·robots 응답 확인. 탐색 query 변형 4개는 모두 `200`, canonical `/explore`. |
| sitemap XML `<loc>` 집계 | 총 102개, 그중 `/places/{id}` 100개. 모든 host가 운영 주소와 일치. |
| `rg -n "metadata|generateMetadata|NEXT_PUBLIC_SITE_URL|robots|canonical|sitemap" src` | metadata 생성·호출 위치 및 env 사용처 확인 |
| `rg --files src \| rg '(seo|robots|sitemap|metadata).*(test|spec)\.'` | SEO metadata 전용 테스트 파일 없음 |

HTTP 요청은 운영 공개 주소에 대한 읽기 요청이었다. API 확인은 외부 TourAPI 호출 없이 400을 반환하는 잘못된 query 조합만 요청했다. 소스 테스트 명령은 읽기 전용 감사 범위라 실행하지 않았다.

## 10. 미검증 및 판정

- 이 보고서는 코드 감사와 HTTP 응답 실측이며, Search Console의 실제 색인/순위 증거가 아니다.
- bookmarks canonical은 실제 응답에서 오류가 확인되어 metadata-only 후속 수정이 필요하다.
- robots와 sitemap host 불일치는 이번 배포에서 재현되지 않았다.
- sitemap의 첫 페이지 100건 제한은 구현상 사실이다. 전체 장소 목록이 제품 의도인지 별도 결정해야 하며, 무제한 수집으로 바꾸지 않는다.
- 작업 판정: **감사 완료, 구현은 미수행**. TF-01 감사 이슈에는 결과를 연결하고, 북마크 canonical/noindex 보완은 별도 구현 범위로 제안한다.
