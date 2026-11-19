# TF-03a PostgreSQL 여행 목록 기능 설계

> 상태: 설계 제안. DB, ORM, 인증, API 및 UI는 구현되지 않았다. 사용자 승인이 필요한 정책은 이 문서에서 결정된 사실처럼 취급하지 않는다.

## 1. 목적과 기준

GitHub Issue [#9](https://github.com/minjuko/trip-finder/issues/9)의 사전 설계 문서다. 기준 `main` SHA는 `0e4e20a9d46c5b8348b04331da5587f4c9a57b5f`다. 이 SHA의 실제 코드 관찰과 새 여행 목록 설계를 별도 절로 구분한다.

이번 단계에서는 PostgreSQL 연결/DB 생성, 패키지 설치, 환경변수·Secret 등록, 코드 수정, 배포를 하지 않는다. DDL은 검토용 초안이며 실행하지 않았다.

## 2. 기존 코드 감사

### 관심 장소

- `src/lib/bookmarks/storage.ts`는 `trip-finder:bookmarks`에 `Bookmark[]` JSON을 저장한다. `src/lib/bookmarks/schema.ts`가 Zod로 `contentId`, `contentTypeId`, `title`, `address`, `thumbnailUrl`, `savedAt`을 검증한다.
- `addBookmark`는 `contentId`로 중복을 막고 새 항목을 배열 앞에 넣는다. 삭제도 `contentId`를 기준으로 한다.
- `BookmarkButton`과 `BookmarkList`는 `storage` 및 `bookmarkschange` 이벤트를 구독해 두 탭 간 변경을 반영한다. `e2e/bookmark.spec.ts`에는 저장·삭제·새로고침·두 탭 동기화가 검증되어 있다.
- `src/app/bookmarks/page.tsx`는 현재 `/bookmarks`를 표시한다. canonical은 `/bookmarks`, robots는 `index: false`, Open Graph URL은 `/bookmarks`다.
- 따라서 기존 관심 장소는 이 브라우저의 로컬 저장 기능으로 유지한다. 새 여행 목록은 별도의 서버 저장 데이터이며 자동 이전·공유·대체 동작을 하지 않는다. 한 장소를 북마크와 한 개 이상의 목록에 각각 추가할 수 있다.

### 인증, API, TourAPI 식별자

- 기준 SHA의 `package.json`에는 인증 라이브러리와 PostgreSQL 드라이버/ORM이 없다. `src`에서 auth/session/cookie 기반 로그인과 사용자 ID 흐름도 확인되지 않았다. `.env.example`에는 `TOUR_API_SERVICE_KEY`, `NEXT_PUBLIC_SITE_URL`만 있다.
- 기존 `src/app/api/classifications/route.ts`와 `src/app/api/regions/[regionCode]/districts/route.ts`는 Next.js App Router Route Handler다. 공개 GET 요청을 처리하고 Zod 응답 스키마를 사용한다. 이 공개 API만으로는 사용자의 사적 데이터를 인증하거나 소유권을 보호하지 않는다.
- `src/types/tour.ts`의 `TourContent`는 `id`, `contentTypeId`, `title`, `address`, `thumbnail`, 지역·분류·좌표를 정의한다. `src/lib/tour-api/normalizers/tour-content.ts`는 TourAPI의 `contentid`, `contenttypeid`를 문자열 `id`, `contentTypeId`로 정규화한다. 실제 상세 URL은 `/places/{contentId}`다.
- TourAPI 콘텐츠는 외부 원본이며 이 프로젝트 DB의 `places` 행이 아니다. 목록 항목은 외부 콘텐츠 ID를 문자열로 저장하고 콘텐츠 자체에 FK를 만들지 않는다. 표시용 제목·주소·thumbnail을 저장할지, TourAPI 재조회만 할지는 별도 결정이 필요하다.
- 기존 README의 Next.js `16.4.2` 표기는 오래된 설명이다. 실제 `package.json`/lockfile은 Next.js `16.4.5`다. README 정리는 이 설계 범위 밖이다.

## 3. 필요성과 제안 MVP

| 기능 | 제안 분류 | 설계 이유·결정 상태 |
| --- | --- | --- |
| 여행 목록 생성 | MVP 필수 | 관심 장소 전체와 목적별 그룹을 구분하는 기본 단위. 목록 개수 제한은 필요하나 상한은 운영·제품 결정 필요 |
| 이름 변경·삭제 | MVP 필수 | 목록을 계속 관리하기 위한 기본 CRUD. 삭제 시 목록 항목은 cascade 삭제 제안 |
| 여러 목록 관리 | MVP 필수 | 한 명이 여행 목적별 목록을 독립 생성. 같은 여행지를 서로 다른 목록에 각각 둘 수 있음 |
| 목록에 여행지 추가·제거 | MVP 필수 | 여행 계획 목록의 기본 편집 기능 |
| 같은 목록에 같은 여행지 중복 추가 | 중복 금지 | 목록별 `(travel_list_id, content_id)` UNIQUE. 재시도된 동일 추가는 기존 항목을 반환하는 멱등 PUT 제안 |
| 목록 내 순서 변경 | MVP 필수 제안 | 여행지 방문 순서를 사용자가 관리하게 해 북마크와 차별화. 순서 변경과 동시 편집은 버전으로 충돌 검출 |
| 여행지별 메모 | 선택 | 유용하지만 개인 작성 데이터의 XSS, 길이 제한, 입력 UX를 추가 검증해야 함. MVP 후속 후보 |
| 공개·공유 기능 | 후순위·이번 단계 제외 | 공개 URL 권한, 비공개 전환, 링크 폐기, 검색 엔진 정책을 별도 설계. 기본은 private |
| 브라우저·기기 간 동기화 | 계정 선택 시 MVP 필수 제안 | server-side owner identity가 있어야 가능. 익명 토큰이면 같은 브라우저 프로필에 한정. 인증 결정 전 확정 불가 |

목록 이름 중복 허용, 목록/항목 개수 상한, 소유자가 계정을 삭제할 때 데이터 즉시 삭제 여부는 정책 미결정이다. DDL 초안은 이름 중복을 허용한다. 별도 동의 전에는 북마크를 새 목록으로 복사하거나 서버에 업로드하지 않는다.

### 기존 북마크와 분리된 사용자 경험

- 새 탐색 항목은 “여행 목록”, `/bookmarks`와 기존 메뉴·문구는 “관심 여행지”로 구별한다.
- 목록 추가는 상세(`/places/{contentId}`)의 별도 “여행 목록에 추가” 동작으로 진입한다. 기존 저장/해제 버튼과 상태를 합치지 않는다.
- 새 기능은 북마크 저장소, 키, 데이터 타입, 두 탭 이벤트를 읽거나 수정하지 않는다. 향후 사용자가 직접 선택하는 “북마크에서 복사”가 필요해도 명시적인 사용자 액션과 중복 검사를 별도 설계한다.

## 4. 사용자 식별 및 보안 결정

모든 사적 CRUD는 서버가 검증한 principal을 필요로 한다. 요청 JSON의 `ownerId`를 받지 않는다. 서버가 세션의 안정적인 외부 `issuer + subject`를 검증한 뒤 내부 `app_users.id`로 매핑하고, DB 쿼리마다 해당 내부 ID를 조건으로 포함한다.

| 방안 | 난이도 | 보안·배포 적합성 | 포트폴리오 가치·한계 |
| --- | --- | --- | --- |
| 비로그인 단일 사용자 | 가장 낮음 | 방문자가 모두 같은 사용자인 서버 데이터는 공개 Vercel 앱에 부적합. 배포 전체를 단일 사용자로 막는 별도 보호가 있어야 하며 사용자별 접근·기기 복구를 제공하지 못함 | 빠른 demo지만 소유권 모델을 보여주지 못함 |
| 서버 세션 기반 회원 | 중간~높음 | HttpOnly 세션 쿠키를 서버에서 검증하고 매 요청 principal을 구성. 계정 회수·만료·CSRF·세션 저장 정책 필요 | 권한, 계정, DB 관계를 end-to-end로 설명하기 좋음 |
| 외부 인증 서비스(OIDC/OAuth) | 중간 | 로그인 UI·자격증명·MFA를 직접 관리하지 않고 공급자의 서명된 ID token/session을 서버에서 검증. 공급자 장애·계약·비용·claim mapping 고려 | Next.js와 외부 identity의 경계, 내부 권한 분리를 보여줄 수 있음. Auth.js 또는 관리형 Auth SDK 등은 선택 전 조사 필요 |
| 익명 사용자 토큰 | 중간 | 서버가 추측 불가능한 random token을 발급해 `HttpOnly; Secure; SameSite=Lax` cookie에 저장하고, DB에는 token hash만 기록. token 재발급·폐기·CSRF·쿠키 도메인을 설계해야 함 | 계정 없이 서버 저장 실험은 가능하지만 token 분실 시 복구 불가, 기기 간 동기화 없음. 익명 소유권은 계정으로 안전하게 이전하기 어려움 |

**추천은 조건부다.** 서버 DB 목록과 여러 기기 동기화를 제품 목표로 승인하면 외부 인증을 이용한 서버 검증 세션을 우선 평가한다. 인증 공급자와 로그인 방식은 결정하지 않는다. 계정 없이 단일 브라우저에서만 시험하려면 익명 token을 대안으로 비교하되, 소유권 복구/계정 이전을 먼저 정한다. 이 결정 전에는 TF-03b의 user-owned table/API를 구현하지 않는다.

### 위협과 필수 완화

| 위협 | 최소 방어선 |
| --- | --- |
| client가 다른 `ownerId`를 보내거나 바꿈 | owner 식별자를 API input에 넣지 않음. 검증된 server session에서 얻은 내부 `app_users.id`만 사용 |
| 목록 ID를 추측·복사하는 IDOR | 모든 조회·수정·삭제가 `id AND owner_id`를 함께 조건으로 삼는다. 타인 목록은 존재를 감추도록 `404 NOT_FOUND` 반환 |
| cookie 기반 write 요청의 CSRF | `SameSite=Lax`, `Secure`, `HttpOnly`, same-origin 정책, `Origin` 검증과 CSRF 보호. GET은 상태 변경 금지 |
| 공개 GET API/robots 정책을 접근 제어로 오인 | `/api/` robots disallow는 검색 크롤러 힌트일 뿐 인증이 아니다. private API는 매 요청 권한 검사 |
| 민감 데이터 cache/로그 노출 | 사용자 API와 페이지 응답에 `Cache-Control: private, no-store`; CDN/shared cache 제외. bearer/cookie, 메모·목록 내용은 로그에 기록하지 않음 |
| SQL injection, mass assignment, XSS | Zod strict input schema와 parameterized query/ORM binding; allow-listed fields만 수정. 메모는 plain text 렌더링하고 HTML 실행 금지 |
| 폭주·저장 자원 고갈 | per-user list/item 수 제한, 요청 크기 제한, 필요 시 rate limit. 배포 후 실제 사용량 관측 전 가격/상한 확정 금지 |
| 계정 삭제 후 잔존 데이터 | 사용자·목록 FK cascade 제안. 실제 deletion/export/retention 정책과 백업 보존 기간은 별도 승인 |

## 5. PostgreSQL ERD와 DDL 초안

### 개념 관계

```mermaid
erDiagram
  APP_USERS ||--o{ TRAVEL_LISTS : owns
  TRAVEL_LISTS ||--o{ TRAVEL_LIST_ITEMS : contains
  APP_USERS ||--o{ API_IDEMPOTENCY_KEYS : retries
  APP_USERS {
    uuid id PK
    text identity_provider
    text provider_subject
    timestamptz created_at
  }
  TRAVEL_LISTS {
    uuid id PK
    uuid owner_id FK
    varchar name
    bigint version
    timestamptz created_at
    timestamptz updated_at
  }
  TRAVEL_LIST_ITEMS {
    uuid id PK
    uuid travel_list_id FK
    varchar content_id
    varchar content_type_id
    integer position
    text note
    timestamptz created_at
    timestamptz updated_at
  }
```

### 논리 테이블

| 테이블 | 역할·주요 제약 |
| --- | --- |
| `app_users` | 검증된 identity `(identity_provider, provider_subject)`를 내부 UUID로 매핑. email을 외부 subject 대신 소유권 key로 사용하지 않음 |
| `travel_lists` | owner FK, 이름 1–80자 제안, description 선택(최대 500자 제안), `version` optimistic concurrency, `created_at`/`updated_at` |
| `travel_list_items` | 목록 FK, TourAPI `content_id` 및 `content_type_id` 문자열, `position`, optional `note`, 화면용 선택 snapshot. 같은 목록 content ID 중복 방지 |
| `api_idempotency_keys` (선택) | 목록 생성 `POST` retry 방지가 필요할 때 owner-scoped idempotency key와 request hash/resource ID 보관. 보존 기간·재생 응답 정의가 승인되기 전에는 필수 도입하지 않음 |

아래는 회원 principal 기반의 PostgreSQL 15+ 초안이다. `app_users`는 실제 인증 라이브러리의 필수 schema가 아니라 해당 공급자 identity와 내부 owner를 분리하기 위한 projection table 예시다.

```sql
CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_provider text NOT NULL,
  provider_subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_users_identity_unique
    UNIQUE (identity_provider, provider_subject)
);

CREATE TABLE travel_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  description varchar(500),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT travel_lists_name_nonempty
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 80)
);

CREATE INDEX travel_lists_owner_updated_idx
  ON travel_lists (owner_id, updated_at DESC, id DESC);

CREATE TABLE travel_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_list_id uuid NOT NULL
    REFERENCES travel_lists(id) ON DELETE CASCADE,
  content_id varchar(64) NOT NULL,
  content_type_id varchar(8) NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  note varchar(500),
  snapshot_title varchar(200) NOT NULL,
  snapshot_address text,
  snapshot_thumbnail_url text,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT travel_list_items_content_unique
    UNIQUE (travel_list_id, content_id),
  CONSTRAINT travel_list_items_position_unique
    UNIQUE (travel_list_id, position)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT travel_list_items_content_nonempty
    CHECK (char_length(btrim(content_id)) BETWEEN 1 AND 64),
  CONSTRAINT travel_list_items_type_digits
    CHECK (content_type_id ~ '^[0-9]{1,8}$')
);

CREATE INDEX travel_list_items_page_idx
  ON travel_list_items (travel_list_id, position, id);
```

**초안 해석:** 목록 삭제 또는 owner 삭제 시 목록 항목이 cascade 삭제된다. 외부 TourAPI 콘텐츠는 FK로 묶지 않는다. 이름 중복은 우선 허용한다. `updated_at`은 각 변경 쿼리에서 명시적으로 갱신한다(트리거는 초안에 없음). 표시 snapshot을 저장하면 TourAPI 장애 때 목록 카드를 유지할 수 있지만 원본 변경 후 stale할 수 있다. 서버가 `getTourDetail(contentId)`로 검증한 데이터만 snapshot에 사용하고, 클라이언트가 보낸 제목·이미지 URL은 신뢰하지 않는다. snapshot 저장 여부/refresh 정책은 미결정이다.

### 인덱스·비용·동시성

- owner 목록 페이지는 `(owner_id, updated_at DESC, id DESC)`를 사용해 owner 필터와 안정된 pagination을 지원한다.
- 항목 query는 `travel_list_id`와 정렬 key를 사용하고, `(travel_list_id, content_id)` UNIQUE가 중복 확인과 DB race 방어를 겸한다. 별도 content 전역 index는 필요할 때만 추가한다.
- page/limit의 최대치와 owner별 목록 수/목록별 항목 수를 정한다. 저용량 MVP에서 사용하지 않는 검색·부분 문자열 index는 추가하지 않는다.
- 위치 변경은 목록 행을 `SELECT ... FOR UPDATE`로 잠그고 현재 `version`을 검사한다. `travel_list_items_position_unique`를 지연 검사해 한 transaction 안에서 position swap을 허용한다. item 추가/삭제/메모 변경/순서 변경은 같은 transaction에서 parent `version`과 `updated_at`을 갱신한다.
- reorder 요청은 중복 없는 모든 item ID를 보내고, 서버가 현재 목록의 전체 ID 집합과 정확히 일치하는지 검사한다. stale `version`이면 변경하지 않고 `409 VERSION_CONFLICT`를 반환한다. 필요하면 최신 상태를 다시 GET한다.
- 동일 목록의 동시 같은 콘텐츠 추가는 unique constraint가 승자를 하나로 정한다. `PUT` 재시도는 existing item을 그대로 반환한다. list create `POST`는 inherently non-idempotent이므로 버튼 중복 제출 방지에만 기대지 않는다. 안정적인 retry가 MVP 요구이면 owner별 `Idempotency-Key` 저장/TTL을 별도 승인 후 설계한다.

### 마이그레이션·데이터 운영

- 초기 migration은 위 schema 및 인덱스를 만들고, down/rollback은 파괴적 데이터 삭제가 없는지 검토한다. 버전 관리 SQL migration 한 가지를 schema source of truth로 선택한다.
- 개발/CI에서는 disposable DB에 migration을 처음부터 실행한다. 운영은 backup·검증된 migration artifact·명시적 승인 후 배포 절차에서 한 번 실행하며 request cold start에서 DDL을 실행하지 않는다.
- 이후 schema 변경은 expand → 코드 호환 배포 → data backfill 검증 → contract 단계로 쪼갠다. 직접 운영 DB 콘솔 수정은 migration으로 복귀시킨다.
- API write transaction은 DB에서만 짧게 수행한다. TourAPI 네트워크 호출 중 row lock을 잡지 않는다. 콘텐츠 조회/검증을 먼저 수행하고 그 다음 짧은 트랜잭션으로 owner·목록 version·unique 제약을 적용한다.

## 6. API 계약 제안

### 프레임워크 선택

같은 Next.js 프로젝트의 **Route Handler**를 우선 제안한다. 현재 앱은 App Router, TypeScript, Zod, `NextResponse.json`의 공개 server route 패턴을 이미 사용한다. 동일 origin UI에서 session cookie를 이용하고 서버에서 DB secret을 보호할 수 있다. 별도 서버는 background job, 독립 배포·autoscaling, 장시간 작업, 다른 client/API consumer가 실제 요구될 때 추가할 근거가 생긴다. 초기 private CRUD를 위해 두 번째 서비스·CORS·별도 auth forwarding을 먼저 도입할 필요는 없다.

DB client가 필요한 Route Handler는 `runtime = "nodejs"`의 Node runtime으로 운용한다(Edge runtime 연결은 provider/driver가 명시 지원될 때만 검토). Server Component는 같은 앱의 Route Handler를 자기 자신에게 HTTP 호출하기보다 auth 검증 후 application service를 직접 호출하고, Client Component의 mutation은 Route Handler를 사용한다. 모든 개인 응답은 `Cache-Control: private, no-store`로 제안한다.

### 공통 계약

- Base path: `/api/travel-lists`
- 인증: 회원/외부 인증 방식이 승인·구현된 경우 모든 endpoint에 server-verified session 필요. 미인증 `401`; owner 불일치/존재 숨김은 `404`. `ownerId` 필드는 request에 허용하지 않는다.
- 입력: Zod `.strict()` schema로 unknown field 거부. 이름은 trim 후 1–80자, description 0–500자, memo 0–500자, `contentId` 1–64자, `contentTypeId` 숫자 1–8자리 제안. UUID/path/query도 검증한다.
- 콘텐츠 추가 시 client는 ID만 보낸다. 서버가 기존 TourAPI detail service로 ID·type과 canonical title/address/thumbnail을 확인한다. 찾을 수 없음 `404 CONTENT_NOT_FOUND`, 외부 source unavailable은 `503 CONTENT_SOURCE_UNAVAILABLE`; untrusted snapshot 저장 금지.
- 공통 오류 JSON: `{"error":{"code":"VERSION_CONFLICT","message":"목록이 다른 요청에서 변경되었습니다.","requestId":"..."}}`. stack, SQL, token 및 provider 응답은 노출하지 않는다.
- `400` 입력/JSON 오류, `401` 미인증, `403` CSRF/origin 거부, `404` 없음 또는 타 owner 객체, `409` version/unique/idempotency 충돌, `412` If-Match 사용 시 stale ETag, `422` 존재하지 않거나 허용되지 않은 콘텐츠 형식, `429` rate limit, `503` DB/TourAPI 의존 서비스 불가.
- 목록 조회는 `page=1&pageSize=20`, `pageSize` 최대 100. item 조회는 `limit=20&cursor=...`; cursor는 `(position,id,listVersion)` 기반 opaque 값. 순서/version이 바뀐 cursor는 `409 CURSOR_STALE`, 새로 목록을 조회하도록 한다.

### endpoint 계약

| Method / Path | 인증 | Request JSON / 검증 | Response JSON / 성공 | 실패·중복·소유권·pagination·동시성 |
| --- | --- | --- | --- | --- |
| `GET /api/travel-lists?page=1&pageSize=20` | 필수 | body 없음. query Zod: page ≥1, pageSize 1–100 | `200` `{"items":[{"id":"uuid","name":"부산 여행","description":null,"itemCount":3,"version":4,"createdAt":"...","updatedAt":"..."}],"page":1,"pageSize":20,"totalCount":1}` | 미인증 401. 타인 목록은 owner query에서 제외. order `updated_at DESC,id DESC`; stable page. 응답은 private no-store |
| `POST /api/travel-lists` | 필수 | `{"name":"부산 여행","description":null}`. strict Zod, trim, 길이 상한. owner 금지 | `201` `{"id":"uuid","name":"부산 여행","description":null,"version":1,"createdAt":"...","updatedAt":"..."}` | 비인증 401. list name 중복은 현재 DDL에서 허용. 일반 POST retry는 중복 목록을 만들 수 있음; idempotency key 테이블 승인 전에는 non-idempotent라 자동 재전송 금지. owner 상한 도달은 `409 LIST_LIMIT_REACHED` 제안 |
| `GET /api/travel-lists/{listId}` | 필수 | body 없음. UUID path 검증 | `200` list metadata + `version` | 다른 owner/없음 모두 404. pagination은 별도 items endpoint |
| `PATCH /api/travel-lists/{listId}` | 필수 | `{"name":"제주 일정","description":"...","expectedVersion":4}`. 수정 필드 1개 이상, unknown field 거부 | `200` 최신 list JSON 및 증가된 version | owner 조건부 UPDATE. stale version은 `409 VERSION_CONFLICT`. 같은 최종 값 재요청은 현재값을 반환할 수 있게 구현해 상태 기준 retry를 멱등 처리 |
| `DELETE /api/travel-lists/{listId}` | 필수 | body 없음. `If-Match` 또는 query concurrency 미사용; 소유자 확인 | `204` no content | owner 일치 row만 삭제, DB `ON DELETE CASCADE`가 items 삭제. 이미 사라진 객체/타 owner는 404(효과는 idempotent). DB transaction |
| `GET /api/travel-lists/{listId}/items?limit=20&cursor=...` | 필수 | body 없음. query Zod limit 1–100, opaque cursor | `200` `{"items":[{"id":"uuid","contentId":"127480","contentTypeId":"12","title":"가거도","address":"...","thumbnailUrl":"...","note":null,"position":0,"createdAt":"...","updatedAt":"..."}],"nextCursor":null,"listVersion":4}` | owner 검사 후 position order. 타 owner 404. cursor version이 current list version과 다르면 `409 CURSOR_STALE`; 같은 version에서 keyset pagination |
| `PUT /api/travel-lists/{listId}/items/{contentId}` | 필수 | `{"contentTypeId":"12"}`. ID path 및 strict body 검증. 서버는 TourAPI에서 표시 snapshot을 확인 | 신규 `201`, 이미 동일 콘텐츠면 바꾸지 않고 기존 representation `200` | unique `(travel_list_id,content_id)`로 동시 추가 하나만 저장. 같은 목록의 재시도는 기존 값 반환해 효과가 idempotent. 다른 목록에서 같은 콘텐츠는 허용. type 불일치 `409 CONTENT_ID_CONFLICT`; owner/목록 불일치 404 |
| `PATCH /api/travel-lists/{listId}/items/{contentId}` | 필수 | `{"note":"오전 방문","expectedVersion":4}` 또는 note null. 메모 500자 제한 | `200` item + 갱신된 `listVersion` | owner+list+content 조건부 update. stale list version은 409. 메모는 plain text. version increment와 updated_at 같은 transaction |
| `DELETE /api/travel-lists/{listId}/items/{contentId}` | 필수 | body 없음 | 삭제 시 `204` | owner 범위 내 삭제. 이미 없는 item은 204 제안(동일 효과 retry). 성공 삭제와 parent version increment를 같은 transaction에 수행 |
| `PUT /api/travel-lists/{listId}/items/order` | 필수 | `{"itemIds":["uuid-1","uuid-2"],"expectedVersion":4}`. array unique, 최대 항목 수, 모든 id가 해당 목록 소속인지 검증 | `200` `{"listId":"uuid","version":5,"items":[...]}` | owner 검사 후 parent `FOR UPDATE`; expectedVersion 불일치 409. ID 집합이 현재 목록과 다르면 `422 ITEM_SET_MISMATCH`. 지연 UNIQUE constraint로 transaction atomic reorder. 동일 순서 반복 시 무변경·현재 버전 반환 |

`POST` 예시 request 외에는 owner identity를 어떤 요청에도 넣지 않는다. status와 공통 오류 응답은 구현 시 Zod/API contract test로 고정한다. `GET /api/travel-lists/{id}`가 items를 함께 포함할지 여부는 UI 데이터량 결정을 반영해 구현 전에 하나로 확정한다. 위 초안은 목록 metadata와 cursor 기반 item 조회를 분리한다.

## 7. 화면·접근성 흐름

### 라우팅·구조

- 새 route 후보: `/travel-lists` 목록, `/travel-lists/{listId}` 상세. UUID는 예측 방어용이 아니라 identifier이며 authorization은 매번 서버에서 한다.
- `/travel-lists/**`는 private 및 `noindex`로 제안하고 sitemap에 넣지 않는다. 로그인 전에는 내용을 SSR로 내보내지 않고 로그인 안내/진입만 렌더링한다. 공개 목록이 승인되면 별도 공개 route, URL, canonical·robots를 설계한다.
- 기존 `/bookmarks` canonical `/bookmarks`, noindex와 localStorage 동작을 유지한다. 새 페이지 metadata가 root policy를 상속할 때 private noindex가 유지되는지 별도 metadata test를 둔다.

| 화면/흐름 | 책임 제안 |
| --- | --- |
| `/travel-lists` 목록 | Server Component가 auth 확인 후 사용자 목록/page 결과를 로드. `TravelListOverview`는 목록 카드와 empty state. 생성 폼은 별도 Client Component |
| 목록 생성·이름 변경 | `TravelListForm`은 name/description Zod 제한과 field error를 표시하고 pending 상태에서 중복 submit 방지. 서버는 다시 검증 |
| 목록 삭제 | 확인 dialog에 목록 이름과 “항목도 함께 제거”를 알리고 완료 후 목록 목록 갱신. cancel이 keyboard로 가능 |
| `/travel-lists/{id}` 상세 | server owner-checked load. `TravelListHeader`, `TravelListItems`, `TravelListItemActions`가 metadata/정렬/메모/제거를 분리 |
| 상세에서 목록 추가 | 상세 route의 기존 북마크 버튼과 나란히 별도 “여행 목록에 추가” 버튼. `AddToTravelListDialog`는 목록을 선택하고 add를 요청. 목록 없음이면 create flow 링크 |
| 비로그인 | 로그인 방식 승인 후 sign-in action, session 없음 메시지. 사용자 목록의 제목/개수/content는 응답·HTML에 포함하지 않음 |
| loading/empty/error | `loading.tsx` 또는 section skeleton, 목록 없음과 항목 없음의 분리된 CTA, retry 가능한 오류/로그인 만료 표시. TourAPI unavailable은 DB 저장 오류와 구별 |

모바일 우선 단일 컬럼, 충분한 터치 target, overflow 없는 긴 여행지/목록 이름, reorder는 keyboard 대안(위/아래 버튼 또는 메뉴)을 제공한다. Dialog는 accessible name, focus 이동·복귀, Escape, 명시적 cancel을 지원한다. reorder 변경은 `aria-live` status로 알리고, 색상만으로 저장/권한 상태를 표현하지 않는다. React component에는 server data/service와 client interaction 경계를 명확히 둔다.

## 8. 개발·배포·테스트 전략

### PostgreSQL 호스팅 비교 (2026-11-19 검토)

| 후보 | Vercel/서버리스 적합성 | 무료·비용/운영 참고 | 이 프로젝트 적합도 |
| --- | --- | --- | --- |
| Neon + Vercel Marketplace | Vercel에서 integration으로 연결 가능. Vercel deploy preview별 branch integration 선택지가 있고 pooled/serverless 연결 제품 제공 | 2026-10 Neon 안내는 Free project에 최대 1 GB storage를 공지했다. compute, branch, egress 등 quota 이후는 사용량에 좌우되며 유료 가격은 고정 월액이 아닐 수 있음 | **조건부 1순위 후보**: 현재 Vercel 배포와 Preview DB 분기 연결이 잘 맞고 PostgreSQL 자체를 직접 다루는 portfolio 가치가 있음. Auth는 별도 선택해야 함 |
| Supabase Postgres | Vercel serverless는 shared transaction pooler 사용을 안내. transaction mode에서는 prepared statement를 끄고 client pool을 작게 설정하는 등 driver 조정 필요 | 공식 pricing 기준 Free는 DB 500 MB, 비활성 1주 후 pause, active free projects 2개 제한. Pro는 현재 $25/month 시작. 포함량·추가 과금 재확인 필요 | **통합 대안**: Auth와 DB를 함께 제공해 identity 선택/운영 단순화가 가능. Data API/RLS를 쓸지 Next Route Handler 소유권 검사를 유지할지 선택 필요 |
| Render Postgres | Vercel에서 외부 DB로 연결 가능하지만 네트워크·region·pooling 구성은 별도 점검. 내장 PgBouncer pooling은 paid DB에서 제공 | Free Postgres는 1 GB이고 생성 30일 후 만료; 무료 pooler도 없음. 가격표에는 유료 compute tier가 별도 표시됨 | 테스트/demo 한시 DB에는 쓸 수 있지만 지속 저장의 무료 기본값으로 추천하지 않음. Vercel 외부 운영 플랫폼 하나를 추가함 |

**잠정 선택 제안:** Vercel과 deploy preview DB branch 연계를 중시한다면 Neon을 먼저 검증하고, 로그인과 DB를 한 공급자에서 단순히 운영하는 게 우선이면 Supabase와 Supabase Auth 조합을 검토한다. 비용은 사용량/region/backup 설정에 따라 바뀌므로 실제 계정 생성이나 과금 결정을 하지 않았다. 이 추천과 hosting provider는 사용자 승인이 필요한 미결정 사항이다.

공식 자료:

- [Vercel Marketplace storage integrations](https://vercel.com/docs/marketplace-storage)
- [Neon on Vercel Marketplace](https://vercel.com/marketplace/neon)
- [Neon Free plan의 1 GB 안내 (2026-10)](https://neon.com/blog/neon-free-plan-1-gb-per-project)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase Postgres connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase serverless driver/pool guidance](https://supabase.com/docs/guides/database/connecting-to-postgres/serverless-drivers)
- [Render free Postgres limitations](https://render.com/docs/free)
- [Render Postgres connection pooling](https://render.com/docs/postgresql-connection-pooling)

### Environment 및 연결

- server-only `DATABASE_URL`은 `NEXT_PUBLIC_` prefix를 붙이지 않는다. `.env.local`은 ignored local-only, `.env.example`에는 변수명만 빈 값으로 둔다. Vercel의 Development/Preview/Production 변수와 DB role/database를 분리한다. 실제 secret을 문서, GitHub issue, client bundle, CI log에 쓰지 않는다.
- `DATABASE_URL`은 serverless pooled URL을 사용하고 application DB client는 module scope에서 생성하며 function instance당 connection 수를 낮춘다. 요청마다 pool을 만들지 않는다. 사용 driver가 transaction pooler에서 prepared statement, session state, advisory lock을 요구하지 않는지 확인한다.
- migration용 직접 연결이 필요하면 운영 API runtime과 별도 `DATABASE_MIGRATION_URL`을 migration-only job에 주입하고 runtime에는 권한이 제한된 role을 쓴다. provider가 허용하지 않으면 pooler를 지원하는 migration 경로를 검증한다.
- `AUTH_SECRET`/provider credentials는 서버 전용 Vercel/GitHub Secret으로 관리하며 서로 다른 environment 값 사용. 실제 secret 값은 이번 TF-03a에서 만들거나 조회하지 않는다.
- Next.js Route Handler에서 pooler는 request concurrency를 돕지만 무제한 연결을 의미하지 않는다. Vercel function 수 × instance pool이 DB connection limit에 닿지 않는지 observability와 provider limit으로 조정한다. Edge runtime은 첫 구현에서 피한다.

### DB 분리·테스트 데이터 안전

| 환경 | DB 정책 |
| --- | --- |
| 개발자 로컬 | local PostgreSQL container 또는 개인 dev DB. production URL 복사 금지. seed는 deterministic fake owner/TourAPI fixture |
| GitHub Actions | job마다 disposable PostgreSQL service/database, production secret 없이 migration 후 test. job 종료 시 폐기 |
| Vercel Preview | 별도 preview database 또는 provider branch. production data/schema를 복제할 경우 개인정보 제거와 비용·수명 제한을 먼저 정함 |
| Vercel Production | 승인된 운영 DB만 runtime에 연결. fixture flag/test clear/TRUNCATE 경로 금지 |

통합 test는 DB 이름/host가 허용된 test target인지 실행 전 검사하고, 테스트 시작 시 migration history를 검증한다. 생성 데이터는 test transaction 또는 test-only random namespace로 정리한다. `TRUNCATE ... CASCADE` 정리는 disposable CI DB에서만 허용하며 production URL에서 실행을 fail-fast 차단한다. 실 TourAPI 대신 `TOUR_API_E2E_FIXTURES=true` 또는 repository mock으로 외부 호출을 막는다.

### 검증 매트릭스

| 범주 | 필수 시나리오 |
| --- | --- |
| schema/migration | 빈 DB에 up migration, schema/unique/FK/index 검증, 실패 migration rollback, 이전 version에서 expand migration |
| Zod/API | 잘못된 UUID, 빈/초과 이름·note·description, unknown field/ownerId 차단, 페이지/limit/cursor 잘못된 값, 공통 error shape |
| 권한 | 미인증 401, owner A/B 생성. B가 A의 list/item read/update/delete/reorder를 요청해 404이며 A data는 그대로. client ownerId 바꿔도 영향 없음 |
| duplicate | 같은 목록 동시 동일 콘텐츠 추가 결과 row 1개, 두 목록에 같은 content ID 허용, 재시도한 PUT의 응답과 상태 안정성, content type mismatch |
| transaction/race | reorder와 add/delete 동시 요청, 동일한 expectedVersion에서 하나만 변경되고 stale 요청 409, reorder 일부 실패 시 전체 rollback, 연속 position 유지 |
| delete/restore | list delete cascade, user delete 정책, item remove 후 같은 content 재추가 및 새로운 position/snapshot |
| paging | 안정된 sort, next cursor, reorder로 오래된 cursor invalidation, owner별 count와 total 일치 |
| CSRF/cache/log | wrong Origin/csrf 거부, private no-store header, credential/notes 미로그, SQL binding 및 plain-text 메모 렌더링 |
| 기존 기능 회귀 | 기존 `e2e/bookmark.spec.ts` 저장·삭제·두 탭 동기화·새로고침, `/bookmarks` noindex/canonical, TourAPI fixture 상세/탐색, 검색 URL 상태, 지도 지연 로딩 유지 |
| 접근성 | keyboard-only create/edit/delete/add/reorder, focus trap/restore, screen reader label/live feedback, 320px mobile layout |

각 API PR은 route unit/service integration test 및 실제 PostgreSQL CI service 테스트를 포함한다. Vitest mock만으로 transaction/unique/concurrent race를 완료로 보지 않는다. browser E2E는 독립 DB fixture와 기존 북마크 E2E를 같은 workflow에서 실행하되 기존 localStorage key를 변경하지 않는다.

## 9. 승인 필요한 정책 및 남은 질문

| 미결정 | 선택지 | 추천/다음 확인 |
| --- | --- | --- |
| 소유자 식별 | 외부 OIDC/Auth.js session, Supabase Auth, 익명 cookie token | 기기 간 동기화를 원하면 로그인 기반. 사용자 승인 전 선택하지 않음 |
| 인증이 준비될 때까지 MVP 보류 여부 | 인증을 선행 구현 / 같은 work item에서 auth 구축 / 임시 anonymous owner | 독립 인증 선행 작업을 추천. token migration/recovery 요구 확인 |
| DB host/region | Neon, Supabase, Render 등 | Preview branch 필요와 Auth 통합 중 어느 것을 우선할지, 예산/region 승인 필요 |
| 목록 이름 | 동일 owner 안 이름 중복 허용/금지 | UUID로 구분 가능해 초안은 허용. UX 선호 확인 |
| 한도 | 계정당 목록 수, 목록당 여행지 수, 메모 길이 | 이름/메모 길이는 초안 80/500. 실제 수 상한은 abuse/cost와 UX를 정해 확정 |
| snapshot | ID만 저장해 TourAPI 재조회 / title·address·thumbnail snapshot 저장·갱신 | API 장애/쿼리 수/데이터 freshness 비교 후 결정 |
| 중복 add UX | 이미 있는 항목을 유지하고 안내 / 조용히 기존 항목으로 이동 | API는 멱등 `PUT`을 제안. UX 동작은 결정 필요 |
| 목록 create retry | 일반 POST / `Idempotency-Key` 및 저장·TTL | 네트워크 재시도가 중요하면 전용 table과 보존 기간 승인 |
| 공개 공유·삭제 data retention | 완전 비공개 / 링크 공유 / 계정 삭제 즉시 cascade·백업 만료 | MVP는 비공개, 링크 공유 제외. retention은 privacy 요구 확인 |

## 10. 작은 구현 단위 제안

아래 이름과 파일 경로는 예상치이며 새 Issue를 생성한 것이 아니다. 모든 단계는 승인 후 시작한다.

| 제안 작업 | 선행 의존성 | 예상 변경 파일 | 수용 기준·필요 테스트 | 위험·PR 경계 |
| --- | --- | --- | --- | --- |
| TF-03b Auth/owner principal | 인증 방식·provider 승인 | `src/lib/auth/**`, `src/app/api/auth/**` 또는 provider route, auth config, `.env.example`, auth tests, docs | session server verification, opaque internal owner, no client owner input, secure cookie/CSRF, 2-user isolation tests | 계정 recovery/secret handling. Auth와 list CRUD를 한 PR에 넣지 않음 |
| TF-03c PostgreSQL foundation/schema | DB host와 owner model 승인, 03b principal contract | `src/lib/db/**`, `drizzle.config.ts` 등 선택 도구 설정, `drizzle/**` migrations, DB tests, `.env.example`, CI workflow | test DB migration from empty, limited DB role/pooled runtime config, migrations are repeatable and production is not touched by CI | provider/driver/ORM lock-in. API endpoint는 이 PR에서 구현하지 않음 |
| TF-03d List metadata CRUD | 03b, 03c | `src/app/api/travel-lists/route.ts`, `src/app/api/travel-lists/[listId]/route.ts`, validation/service/repository tests | owner scoped create/list/get/rename/delete, pagination, 404 IDOR, optimistic version, FK cascade test | list name/limit/idempotency decisions. item mutation은 분리 |
| TF-03e List item API | 03d + TourAPI snapshot decision | `src/app/api/travel-lists/[listId]/items/**`, item service/repository, SQL concurrency tests | validated content ID, unique duplicate race, add/remove/note/order atomicity, cursor invalidation, concurrency matrix green | TourAPI outage, snapshot stale, reorder conflict. UI는 아직 변경하지 않음 |
| TF-03f Travel list UI | API contracts stable, auth flow stable | `src/app/travel-lists/**`, focused components `src/components/travel-list/**`, detail page add action, UI/E2E tests | list CRUD and add/remove/order UX, unauth state, loading/error/empty, keyboard/mobile, SEO noindex; existing bookmark E2E unchanged | 북마크 UX 혼동/기존 route metadata 회귀. auth/DB 변경 금지 |
| TF-03g hardening/launch gate (필요 시) | 기능 E2E·preview 완료 | test/security docs, CI only if gaps proven | 2-user IDOR, CSRF, rate caps, production no-store, alert/backup/restore rehearsal, rollback confirmed | 운영 개인정보·비용. 별도 승인 없이 production DB/secret 생성 금지 |

각 PR은 자기 영역의 unit/integration/contract 검증과 필요한 dependency CI만 포함한다. 03d와 03e의 database code를 한꺼번에 추가하거나 03b 인증·03c migration·03d/e CRUD·03f 화면을 큰 단일 PR에 합치지 않는다. 병합은 각 PR의 reviewer 승인 및 CI 통과 후 별도로 한다.

## 11. 테스트/미실시 사항과 판정

- 실제 감사 기준: branch `design/tf-03a-travel-lists`의 base는 `0e4e20a9d46c5b8348b04331da5587f4c9a57b5f`. 기존 root worktree `fix/tf-01b-bookmarks-seo`와 `trip-finder-tf-02`, 보안 worktree들은 보존했다.
- 문서 중복 검색에서 `docs/tf-03a-postgresql-design.md`와 기존 travel list/PostgreSQL 상세 설계는 발견되지 않았다.
- 변경 범위는 이 설계 문서 하나다. 앱 코드, 테스트, package manifest/lockfile, runtime configuration은 건드리지 않았다.
- DB, npm dependency 설치, unit/E2E/build, 배포, secret 설정은 범위에서 명시적으로 제외했다. 문서 전용 PR의 GitHub Actions 결과는 PR 생성 뒤 확인한다.
- 남은 결정은 인증·owner identity, DB host/region 및 비용, cross-device synchronization, snapshot freshness, 제한값, list name 정책, public sharing, idempotency, account deletion/retention이다.

**최종 설계 판정:** Route Handler + server-verified principal + owner-scoped PostgreSQL query + disposable Postgres CI를 우선안으로 제안한다. 인증 공급자와 DB host가 승인되기 전에는 TF-03b 이후 구현을 시작하지 않는다. 기존 `trip-finder:bookmarks`, 두 탭 동기화, `/bookmarks` metadata와 UI 동작은 별개로 보존한다.
