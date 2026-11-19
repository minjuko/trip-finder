# TF-03 기술 선택 ADR: 인증·PostgreSQL·ORM·트랜잭션 드라이버

> 상태: **조건부 권장 / 사용자 최종 승인 전 / 구현 전**
> 작업: TF-03-ADR, GitHub Issue [#11](https://github.com/minjuko/trip-finder/issues/11)
> 기준 코드: `main` SHA `5e6ec0095168dd85b265e207d9feceef7cc4a7bc`
> 조사 시점: 2026-11-19
> 범위: 공식 문서와 npm registry metadata를 조사한 문서 결정안. OAuth 설정, 계정·DB 생성, 패키지 설치, 코드 구현, 배포는 하지 않았다.

## 1. 결정 요약

다음 조합을 구현 전 승인 후보로 제안한다.

| 영역 | 조건부 권장안 | 상태 및 전제 |
| --- | --- | --- |
| 인증 | Better Auth + Google OAuth 한 종류 | Better Auth `1.7.26`의 npm peer range가 Next.js 16 및 React 19를 포함한다. 실제 앱 통합, OAuth callback, 세션·CSRF 검증은 아직 실행하지 않았다. |
| API 경계 | Next.js App Router Route Handler, Node.js runtime | 현재 프로젝트의 App Router API 패턴을 재사용한다. private 요청마다 서버에서 세션을 검증한다. |
| DB | PostgreSQL | FK, UNIQUE, 트랜잭션과 parent row 잠금이 여행 목록의 소유권·중복·순서 무결성 요구에 맞는다. |
| ORM / migration | Drizzle ORM + `drizzle-kit` | SQL 및 제약을 직접 검토하기 쉽고 Better Auth Drizzle adapter 경로가 있다. 생성 SQL은 리뷰 후 migration으로 적용한다. |
| DB 연결 | `pg` + `Pool`, Vercel Node.js runtime | Vercel의 공식 connection-pooling 안내와 맞는다. Neon pooled connection string을 후보로 두되 provider/리전/가격 승인 및 실제 Postgres 통합 테스트 전에는 확정하지 않는다. |
| 호스팅 | Neon 조건부 후보 | Vercel 연동·Preview 격리·리전·비용을 실제 계정 설정에서 확인해야 한다. Supabase Postgres도 대안으로 남긴다. |

이 ADR은 **동시성 구현 또는 성능 검증 결과가 아니다**. 실제 PostgreSQL 테스트에서 `SELECT FOR UPDATE`, 단일 connection transaction, rollback 및 race 조건을 검증하기 전까지 보장 완료라고 표현하지 않는다. `neon-http`는 기본안이 아니다.

## 2. 기준 구현과 보존 경계

기준 `package.json`은 Next.js `16.4.5`, React `19.2.8`, TypeScript, Zod `4.6.5`와 Vitest `5.0.1`을 사용한다. 인증 라이브러리, PostgreSQL 드라이버, ORM은 아직 없다. 프로젝트는 Next.js App Router이며 공개 GET Route Handler가 `src/app/api/classifications/route.ts`, `src/app/api/regions/[regionCode]/districts/route.ts`에 있다.

기존 `trip-finder:bookmarks` localStorage와 두 탭 동기화는 별도 기능으로 계속 유지한다. 새 여행 목록은 서버 사용자 계정 데이터이며 북마크 자동 이관·대체를 하지 않는다. 기준 MVP는 여행 목록 생성·조회·이름 변경·삭제, 목록별 여행지 조회·추가·제거다. 이메일/비밀번호, 다중 OAuth, 공유, reorder, 메모는 MVP에서 제외한다.

## 3. 인증 선택

### 비교

| 선택지 | Next.js 16 / 현재 앱 적합성 | 세션·DB 통합 | 운영·테스트 부담 | 판단 |
| --- | --- | --- | --- | --- |
| **Better Auth + Google OAuth** | Better Auth 공식 Next.js 문서는 Next.js 16 호환성을 명시한다. npm registry에서 조사한 `better-auth@1.7.26`은 Next `^14 \|\| ^15 \|\| ^16`, React 18/19, Drizzle `^0.45.2` 또는 1.0 RC, `drizzle-kit >=0.31.4`를 peer range에 포함했다. | 자체 DB 기반 세션과 Drizzle adapter. `auth.api.getSession` 같은 서버 검증 경로가 있고 Google redirect URI를 앱 callback으로 설정한다. | OAuth 비밀값·cookie·callback·계정 연결·복구 정책을 직접 운영해야 하나, 현재 Route Handler와 하나의 PostgreSQL 소유권 모델에 맞춘 설명이 가능하다. | **조건부 1순위.** 채택 전 실제 버전 설치·빌드·OAuth sandbox 검증, Google 계정 정책 승인이 필요하다. |
| Auth.js + Google OAuth | 현 공식 설치 문서는 `next-auth@beta` 설치를 안내하며 문서 기준은 v5 beta다. npm registry 관측값은 stable tag `4.24.15`, beta `5.0.0-beta.32`; beta peer range는 Next 16과 React 19를 포함한다. | Drizzle adapter가 있지만 adapter schema와 session 전략을 직접 구성해야 한다. | 성숙한 선택지이나 v5 beta를 쓰는 경우 버전 변화·마이그레이션 위험을 감수한다. v4 안정판과 Next 16 App Router 경로의 적합성도 별도 검증해야 한다. | Better Auth가 맞지 않거나 조직 표준이 Auth.js일 때 재평가한다. |
| Supabase Auth | 공식 SSR 가이드는 Next.js에서 cookie 기반 client와 Proxy 사용을 설명한다. `@supabase/ssr` 관측 최신 버전은 `0.12.7`; 패키지 상태·호환성은 도입 시 다시 확인한다. Next.js 16은 `middleware` 대신 `proxy` 명칭을 쓴다. | 관리형 Auth와 Postgres가 통합되고 RLS 선택지도 있다. 인증 claim 검증(`getClaims`) 및 cookie 갱신 흐름을 지켜야 한다. | Auth와 DB를 한 공급자에 모아 운영을 단순화할 수 있으나, direct Drizzle + 관리형 Auth를 혼합하면 JWT 검증·RLS·서버 DB 권한 경계를 명확히 해야 한다. | 현재 Route Handler의 자체 소유자 조건과 독립적인 ORM migration 경계를 선호하므로 1순위로 두지 않는다. Supabase 전체 플랫폼/RLS를 선택하면 다시 평가한다. |

패키지 버전은 **2026-11-19 npm registry 조회값**이지 프로젝트 lockfile에 고정된 버전이나 설치 검증 결과가 아니다. Better Auth의 adapter 패키지/스키마 CLI는 선택한 릴리스와 함께 다시 잠금·검증해야 한다. 조사 당시 `drizzle-orm` 최신 `0.45.4`, `drizzle-kit` `0.31.11`, `@better-auth/drizzle-adapter` `1.7.26`, `next-auth` stable `4.24.15` / beta `5.0.0-beta.32`, `@supabase/ssr` `0.12.7`이었다. 공식 안정성·지원 범위는 구현 시작일에 다시 확인한다.

### 권장 인증 경계

Google OAuth는 로그인 수단 한 종류로 한정한다. API는 client가 보낸 `ownerId`를 받거나 신뢰하지 않는다. 각 private Route Handler에서 Better Auth 서버 API로 요청 cookie의 세션을 검증하고, 검증된 `session.user.id`만 소유자 principal로 사용한다. Proxy의 cookie 존재 여부 검사만으로 데이터 접근을 허가하지 않는다. Better Auth 문서도 cookie 존재 확인은 안전한 session 검증이 아니라고 경고한다.

OAuth issuer/provider 설정, client ID/secret, base URL, callback 경로는 환경별로 관리한다. Google redirect URI는 개발·Preview·운영 도메인별 allow-list로 설정하고 `state`/`nonce` 검증 및 계정 연결 정책을 시험한다. 상태 변경 요청은 `HttpOnly; Secure; SameSite=Lax` cookie 정책, same-origin `Origin` 검증 또는 명시적인 CSRF 방어로 보호한다. private 응답은 `Cache-Control: private, no-store`로 설정한다. `DATABASE_URL`, auth secret, Google client secret은 server-only 환경 변수에 두며 `NEXT_PUBLIC_`, 코드, 로그, 브라우저 bundle에 넣지 않는다.

## 4. PostgreSQL과 저장소 선택

여행 목록은 계정 소유자 → 여러 목록 → 목록 항목이라는 관계형 구조다. `travel_lists.owner_id` FK, `(travel_list_id, content_id)` UNIQUE, parent version, 항목 변경 원자성 및 parent row 잠금이 요구된다. PostgreSQL은 이 제약과 명시적인 트랜잭션을 한 저장소에서 표현한다.

| 대안 | 이 요구에 대한 장점 | 단점 / 제외 이유 |
| --- | --- | --- |
| PostgreSQL | FK/UNIQUE, row lock, transaction rollback, 명시적 migration을 직접 검증 가능 | 연결 수, pooling, migration, 백업 및 계정 비용을 설계해야 함 |
| localStorage | 기존 북마크 기능에 이미 적합, 서버 비용 없음 | 계정 간 동기화·서버 소유권·다중 기기·중앙 무결성 제약을 제공하지 않음. 새 기능에만 별도 사용 |
| SQLite | 단일 파일 기반 개발·간단한 단일 인스턴스에 쉬움 | Vercel의 다중 인스턴스/서버리스 환경에서 공용 파일 저장소로 적합하지 않고, 동시 접근 운영/공유 DB 요구와 맞지 않음 |
| 문서형/Key-value 저장소 | 단순 조회 또는 관리형 HTTP API에 편리할 수 있음 | 다중 관계 FK와 parent-row 직렬화 규칙을 별도 구현해야 해 현재 무결성 학습 목표에 덜 직접적 |

따라서 PostgreSQL은 조건부 권장이다. 실제 hosting, 리전, 비용, backup 정책 승인 전에는 DB 프로젝트를 만들지 않는다.

## 5. ORM 및 migration 책임

| ORM | 장점 | 부담·주의점 | 판단 |
| --- | --- | --- | --- |
| **Drizzle** | TypeScript schema와 SQL 사이가 가깝고 FK/UNIQUE/index/transaction을 읽기 쉬운 SQL로 다룬다. Better Auth 공식 Drizzle adapter 문서가 존재한다. `pg`와 Neon serverless driver를 모두 지원한다. | schema/migration 명시성이 높아지는 만큼 SQL 설계·migration 검토를 개발자가 맡는다. Auth schema와 앱 schema가 중복 정의되지 않도록 조정해야 한다. | 현재 프로젝트의 TS/Zod/API 학습 목표에 적합. 조건부 권장. |
| Prisma | 생성 client, 관계 API, migration 도구와 문서가 풍부하다. 공식 문서에서 interactive `$transaction(async tx => ...)` 및 오류 시 rollback을 지원한다고 설명한다. | 생성형 모델과 추가 client lifecycle/adapter 설정을 학습해야 하고, 필요한 잠금 SQL과 실제 driver transaction 동작을 별도로 확인해야 한다. 일반 CRUD 편의성만으로 row-lock 요구를 해결했다고 간주할 수 없다. | 안정적인 대안. 팀 Prisma 숙련도 또는 운영 표준이 우선이면 재검토한다. |

조사 당시 npm registry의 `drizzle-orm` 최신은 `0.45.4`, `drizzle-kit`은 `0.31.11`; Prisma registry 조회는 `prisma@8.0.0-rc.34`, `@prisma/client@7.10.1`이었다. Prisma 결과는 RC와 client major가 달라 보여 stable 호환성 근거로 채택하지 않는다. 구현 시점 stable tag, peer range, Node/Vercel 지원을 공식문서와 lockfile로 다시 확정한다. 이 ADR은 의존성을 설치하지 않았다.

**schema 책임:** Better Auth 공식 CLI 또는 문서가 제공하는 schema 출력은 버전별로 생성·검토하되, 저장소 내 Drizzle schema에서 Auth 테이블과 여행 목록 테이블을 한 migration 그래프로 관리한다. Auth schema를 CLI migration과 Drizzle migration 두 곳에서 동시에 생성하지 않는다. 생성된 이름·자료형·FK를 확인한 뒤 하나의 reviewed SQL migration으로 반영한다.

`drizzle-kit generate`로 migration SQL을 만들고 사람이 diff를 검토한 다음 `drizzle-kit migrate`로 개발/CI DB에 적용한다. `drizzle-kit push`는 개발 환경 외에 사용하지 않는다. Production migration은 별도 승인된 배포 단계에서 backup/rollback 계획과 함께 실행한다. Next.js runtime 시작 시 자동 migration하지 않고, CI는 production secret에 접근하지 않는다.

## 6. Better Auth 스키마와 TF-03a `app_users` 정합성

TF-03a는 일반적인 OIDC 설계에서 `app_users`와 `(issuer, subject)` mapping을 제안했으나, Better Auth를 선택하면 Better Auth의 사용자 모델이 인증 principal의 정식 원천이 된다. Better Auth의 Drizzle adapter는 schema table mapping을 명시할 수 있다. 기본 schema에는 `user`, `session`, `account`, `verification` 계열 테이블이 필요하다(선택 plugin에 따라 추가될 수 있음).

중복 사용자 원장을 만들지 않는 제안은 다음과 같다.

1. Better Auth `user.id`를 서버에서 검증한 principal의 canonical ID로 사용한다.
2. `travel_lists.owner_id`는 이 ID를 FK로 참조한다. `user.id` 문자열 타입에 맞춰 TF-03a의 UUID `app_users.id` 초안을 재검토하고, 임의로 별도 UUID mapping 테이블을 중복 생성하지 않는다.
3. Better Auth가 관리하는 사용자 필드, provider 계정, 세션을 앱 테이블에 복제하지 않는다. 앱 프로필이 추가로 필요할 때만 별도 1:1 extension table을 승인한다.
4. Google provider의 외부 subject는 Better Auth `account` 관계가 관리한다. client가 전송한 provider subject/email로 소유권을 결정하지 않는다.
5. 만약 Better Auth의 사용자 ID 커스텀 타입/생성 전략을 바꾸려면 adapter schema, migration, FK 타입과 기존 TF-03a DDL을 함께 검토한다.

최종 테이블명·컬럼 타입·삭제 정책은 실제 선택 버전의 Better Auth schema 출력과 계정 삭제/보존 정책 승인 전 미확정이다. 사용자 삭제 시 `ON DELETE CASCADE`를 기본으로 확정하지 않는다.

## 7. 트랜잭션 드라이버 비교 및 조건부 선택

### 요구사항

TF-03a의 항목 add/delete는 반드시 동일한 DB transaction에서 다음을 처리한다.

1. 요청 세션과 소유자 권한을 검증하고 owner-scoped 목록을 조회한다. TourAPI 검증이나 다른 네트워크 호출은 lock 취득 전에 끝낸다.
2. mutation transaction에서 `travel_lists` parent 행을 owner 조건과 함께 `SELECT ... FOR UPDATE` 한다.
3. 현재 `version`과 요청의 `expectedVersion`/`If-Match`를 비교한다. stale 실제 mutation은 일관된 conflict 응답(설계안 `409`)으로 거부한다.
4. 동일 transaction에서 duplicate 검사 또는 항목 insert/delete를 수행하고, 실제 데이터 변경이 있을 때만 parent `version = version + 1`, `updated_at` 갱신을 한 번 수행한다. duplicate add 및 이미 없는 항목의 no-op 규칙은 TF-03a API 계약에 따라 응답하되 version을 증가시키지 않는다.
5. 모두 commit하거나 예외 시 항목 변경과 parent version/timestamp를 함께 rollback한다. `(travel_list_id, content_id)` UNIQUE는 동시 중복 insert의 최종 DB 방어선이다.

모든 SQL은 하나의 checked-out connection에 묶여야 한다. 요청마다 `pool.query`를 따로 호출하면 transaction statement가 다른 connection을 사용할 수 있으므로 금지한다. Lock 보유 중 외부 API 호출이나 사용자 대기 작업을 하지 않는다. 잠금 순서를 일관되게 유지해 deadlock 가능성을 줄이고, timeout/deadlock은 무조건 성공으로 삼키지 않는다.

### 드라이버 비교

| 경로 | 대화형 transaction / row-lock 적합성 | Vercel Node.js 적합성 | 복잡도와 판정 |
| --- | --- | --- | --- |
| **node-postgres `pg` + `Pool`** | `pool.connect()`로 얻은 단일 client에서 `BEGIN`, `SELECT FOR UPDATE`, DML, `COMMIT`/`ROLLBACK`을 수행할 수 있다. `client.release()`가 필요하다. Drizzle node-postgres adapter도 사용 가능하다. | Vercel 공식 가이드는 Node.js Function의 global-scope `pg` Pool, `attachDatabasePool` 및 client 재사용 예제를 제공한다. | 일반적인 PostgreSQL protocol과 로컬/CI/배포 간 동일 드라이버 경로가 장점. Function별 pool 크기·idle timeout·DB connection limit을 조율해야 한다. **기본 조건부 추천.** |
| Neon WebSocket (`@neondatabase/serverless` / Drizzle `neon-serverless`) | Drizzle은 session 또는 interactive transaction이 필요할 때 WebSocket 기반 `neon-serverless`를 사용하라고 안내한다. | Vercel Node.js에서 사용 가능성은 있지만 Node global `WebSocket` 부재 환경에는 `ws`, `bufferutil`, WebSocket constructor 설정이 필요할 수 있다. 배포 bundle/connection lifecycle 검증이 추가된다. | Neon 전용 driver와 추가 설정에 결합된다. 실제 lock/rollback 테스트와 Vercel Preview smoke 통과 시 `pg` 대안으로 선택할 수 있다. |
| Neon HTTP (`neon-http`) | Drizzle 문서에 따르면 HTTP는 단일 비대화형 transaction에서 빠른 경로이며 session/interactive transaction 지원이 필요한 경우 WebSocket driver를 사용해야 한다. 이 ADR의 parent lock + 여러 쿼리 transaction 경로에 기본값으로 맞지 않는다. | HTTP 환경과 편리성이 장점이어도 해당 transaction 제약을 상쇄하지 않는다. | **MVP mutation driver로 선택하지 않는다.** 별도 독립 read-only/simple query에 쓸지 여부도 이번 결정 범위 밖이다. |

**조건부 권장 연결 구성:** Vercel Node.js Route Handler에서 module-scope `pg.Pool`을 만들고 Neon을 선택하는 경우 Neon의 pooled connection string을 `DATABASE_URL` 후보로 사용한다. `@vercel/functions`의 `attachDatabasePool(pool)` 적용 여부와 `max`, idle timeout, connection lifetime은 Vercel runtime 및 선택 플랜에서 검증 후 설정한다. 실제 transaction은 `pool.connect()`로 확보한 한 client에 바인딩하고 finally에서 반환한다. Drizzle transaction API를 쓸 경우 adapter가 같은 checked-out connection을 보장하는지 테스트로 확인한다. migration용 direct URL이 필요한지는 Neon/ORM 문서를 확인해 `DATABASE_URL`과 별도 `DATABASE_MIGRATION_URL`을 분리할지 결정한다.

Vercel Node.js runtime 자체는 적합하지만, Vercel의 pooling 권고는 특정 Neon plan/region의 connection 수용량 보증이 아니다. TCP 연결·pooler 동작, pool size, acquire timeout, suspend/reuse, transaction 중 연결 유지가 실제 선택한 Preview 환경에서 확인되어야 한다. `pg`와 WebSocket 중 최종 선택은 아래 integration test 통과 전까지 **조건부**다. 둘 중 어느 것도 구현 전에 concurrency guarantee를 확정하지 않는다.

### 필수 PostgreSQL 통합 테스트 gate

- CI용 disposable PostgreSQL에서 빈 DB migration부터 실행한다. Vitest mock만으로 SQL row-lock 경합을 검증했다고 하지 않는다.
- transaction 중 의도적으로 실패시켜 item row와 parent version/`updated_at`이 모두 rollback되는지 확인한다.
- 같은 list에 동일 content를 동시에 add, add/delete, delete/delete 및 같은 `expectedVersion`의 서로 다른 mutation을 barrier로 동시 실행한다.
- 최종 row 수, UNIQUE 위반 처리, 성공/`409` 결과, parent version 증가량, 연속 position 불변식을 DB에서 직접 확인한다.
- 2명의 사용자 A/B로 list/item read/update/delete IDOR를 검증하고 B의 요청이 A 데이터에 영향을 주지 않는지 확인한다.
- 실제 선택 driver/ORM 조합 및 Vercel Preview Node runtime에서 transaction이 한 connection을 유지하는지 확인한다.

이 gate를 통과하기 전 설계 문서·PR·면접에서 “동시성 보장 구현/검증 완료”라고 주장하지 않는다.

## 8. DB 호스팅 및 환경 분리

### 기술 선택과 무료 운영 원칙은 별도 판단이다

앞 절의 Better Auth, PostgreSQL, Drizzle, `pg + Pool`, Neon 후보는 기술 아키텍처 비교다. 그것만으로 유료 자원이나 외부 계정을 사용할 권한이 생기지 않는다. 현재 프로젝트의 예산 제약은 학습 단계에서 **실제 청구 금액 0원**이며, 불확실할 때는 원격 서비스를 만들지 않는 fail-closed 원칙을 적용한다.

| 단계 | 사용 환경 | 허용 범위와 중단 조건 |
| --- | --- | --- |
| 1차 개발 | 로컬 Docker PostgreSQL | 로컬에서 schema, migration, FK/UNIQUE, transaction, row lock 코드를 개발한다. Docker 자체 설치/실행에 별도 유료 기능이 필요해지면 진행하지 않는다. 로컬 PostgreSQL 테스트는 클라우드 DB 검증으로 표현하지 않는다. |
| CI | GitHub Actions disposable PostgreSQL | job 전용 임시 PostgreSQL service를 사용하고 job 종료 시 폐기한다. 운영 데이터·Production credential을 연결하지 않는다. 여기서 통과한 통합 테스트는 CI의 해당 PostgreSQL 이미지/드라이버 환경에 대한 증거이며 Neon/Vercel 동작 증거가 아니다. |
| 후속 선택 단계 | 실제 Google OAuth 또는 Neon 등 Cloud 연동 | 원격 계정과 OAuth client/DB 리소스 생성은 별도 단계다. 사용자가 승인하고 공식 가격·무료 한도·리전·결제 설정을 확인하기 전에는 생성·연결하지 않는다. 로컬/CI 테스트로 대체 가능한 동안은 원격 연동을 미룬다. |

**비용 0원 운영 규칙:**

- 유료 요금제, 유료 add-on, 유료 support, 유료 크레딧/무료 체험 종료 후 자동 청구가 발생할 수 있는 설정을 사용하지 않는다.
- 서비스가 카드 또는 다른 결제 수단 연결을 요구하면 해당 단계에서 중단한다. 무료 사용을 위해 결제수단 등록이 필요하다는 이유로 우회하거나 대신 등록하지 않는다.
- 무료 사용량 한도 도달, 한도/초과 청구 동작 불명, 자동 업그레이드 위험이 있으면 작업과 원격 요청을 중단한다. 유료 전환·용량 확장 대신 local Docker 및 CI disposable PostgreSQL로 돌아간다.
- Preview 자동 DB branch 생성은 필수 기능이 아니다. Preview 앱은 DB 없이 빌드하거나, 필요성이 승인된 뒤 제한된 단일 비운영 DB로 검증한다. Preview마다 무제한 branch/project를 생성하지 않는다.
- 기존 운영 DB 및 Vercel Production 설정, Production 환경 변수·secrets·도메인·Function region은 변경하지 않는다.
- Neon/Supabase 등 공급자에 가입하거나 프로젝트를 만들기 직전에 해당 날짜의 **공식 가격·무료 한도·branch 정책·자동 과금·결제수단 요구사항**을 재검증한다. 가격 페이지 확인만으로 계정별 billing 상태를 보증할 수 없으면 원격 단계는 보류한다.

단계별 비용 확인 checklist:

1. 실행 대상이 local Docker 또는 CI disposable DB인지 확인한다. 그렇다면 cloud secret/URL 없이 진행한다.
2. Cloud가 꼭 필요한 별도 승인 작업인지 확인하고, 아니라면 여기서 중단한다.
3. 공급자의 공식 pricing/limits 문서와 실제 계정의 plan, billing, auto-upgrade, spend cap, card 요구를 확인한다. 무료 조건이 명확하지 않으면 진행하지 않는다.
4. Preview branch, DB compute, storage, egress, backup, OAuth 관련 유료 add-on이 기본 활성화되지 않는지 확인한다.
5. 승인된 무료 범위와 hard limit/usage 알림으로 실제 청구 0원을 보장할 수 없으면 클라우드 작업을 취소하고 로컬/CI 범위만 수행한다.

무료 tier의 조건은 가입/사용 시점과 계정 설정에 따라 달라질 수 있다. 따라서 이 ADR의 가격 기록은 비용 보장이나 현재 가입 승인이 아니다.

| 후보 | Vercel 적합성·기능 | 비용/Preview 위험 | 조건부 판단 |
| --- | --- | --- | --- |
| Neon | Vercel marketplace 연동과 Postgres pooling/branch 모델을 제공한다. 가까운 Function/DB region을 맞추고 `pg` 또는 WebSocket 연결을 검증한다. | 프로젝트·compute·storage·branch 사용 한도와 Preview 자동 branch의 수명/정리/과금은 계정·현재 상품 정책에 좌우된다. Free를 영구 무료나 자동 격리로 약속하지 않는다. | 실제 가입/연동은 후속 옵션이며 승인 전 생성하지 않는다. 무료 조건이 불명확하거나 결제 수단이 요구되면 중단한다. |
| Supabase Postgres | 관리형 Postgres와 Auth·RLS를 묶을 수 있고 Vercel에서 환경변수로 연결할 수 있다. | Free plan 표시는 조사 당시 500 MB/project, 1주 비활성 pause, 2 active projects 및 branching 미포함으로 확인됐다. 공식 가격 페이지에서 Pro 시작가는 월 `$25`로 표시됐으나 지역·초과 사용·시점에 따라 달라질 수 있다. Auth까지 사용하면 데이터 접근 경로를 RLS와 Route Handler 사이에서 명확히 해야 한다. | 제품에서 관리형 Auth/RLS까지 채택할 경우에만 재평가. 유료 전환 금지, 무료 조건 불명확/결제 수단 요구 시 중단. 가격은 가입 직전 재검증. |

Neon 공식 게시 문서는 2026-11 기준 Free allowance를 project별 1 GB storage, 월 100 CU-hours 등으로 안내한다. 이는 공개 가격표의 스냅샷일 뿐, 본 프로젝트 예상 요금·Preview branch 자동화의 확정 근거가 아니다. 기존 검수 댓글의 공식 자료([Neon free plan](https://neon.com/blog/neon-free-plan-1-gb-per-project), [Vercel integration FAQ](https://github.com/neondatabase/website/blob/main/content/faqs/postgres-nextjs-vercel-integration.md))처럼 Preview branch가 free tier에서 항상 유료 또는 불가능하다고 단정하지 않는다. 다만 Preview 자동 DB branch는 필수에서 제외하며, 실제 필요 시 무료 한도·branch 수명·정리와 계정별 billing을 확인한다.

환경 분리 정책 초안:

- **Local:** 로컬 Docker PostgreSQL과 개인 `.env.local`, 비운영 데이터만 사용. Production credential 금지.
- **CI:** 테스트마다 disposable PostgreSQL 서비스/DB, 제한 권한·테스트 값. Production secret/DB 접근 금지.
- **Preview:** 자동 DB branch는 필수 아님. 이 단계에서 OAuth/DB secret이나 실제 DB 연결을 요구하지 않는다. 원격 Preview DB가 승인된 후에만 비용 없는 격리 방법을 선택한다.
- **Production:** 현재 설정을 변경하지 않는다. 향후 별도 승인 후 Production DB, 제한된 runtime role, 별도 migration role/절차, 백업·복구 및 secrets scope를 결정한다. 앱 runtime이 DDL 권한을 갖지 않도록 한다.

Vercel Function region과 DB region은 왕복 지연을 줄이도록 같은/가까운 provider region으로 배치하는 안을 우선 검토한다. 구체 리전은 사용자 위치, Vercel plan, provider region 목록/가격과 latency 측정 전에는 지정하지 않는다. 이는 후속 Cloud 검토 사항이며 지금 Vercel Preview/Production 설정을 바꾸지 않는다.

## 9. 프론트엔드 실무 기준 및 MVP 비목표

인증 후 서버 상태는 Route Handler 응답을 기준으로 유지한다. UI는 loading/empty/error/conflict 상태, 재시도 가능성, 서버가 반환한 최신 `version`을 명확히 다룬다. optimistic update가 필요하면 rollback 및 stale conflict 회복 UX를 구현한다. client-side `ownerId` 또는 저장된 권한을 신뢰하지 않는다. 로그인 폼·목록·여행지 추가/제거는 키보드 조작, focus 복귀, 의미 있는 label, live status, 모바일 너비를 포함해 E2E/accessibility 검증한다.

MVP에 포함하지 않을 항목:

- 이메일/비밀번호와 여러 OAuth provider
- 공개/공유 URL, collaborator, role model
- item reorder, note/description, rich text
- 기존 localStorage bookmark 자동 이관·동기화
- 실제 TourAPI 데이터를 DB에 복제하는 전체 catalogue

기존 북마크 저장/삭제 및 탭 동기화 E2E, `/bookmarks`의 `noindex`/canonical, 홈·탐색·상세 SEO 테스트는 여행 목록 변경과 분리하여 회귀 검증한다.

## 10. 작은 구현 순서와 완료 기준

Issue #9의 TF-03a가 제안한 TF-03b Auth와 TF-03c DB foundation의 의존성을 실제로 정리한다. Auth의 세션 저장소가 Postgres를 사용하므로 **DB foundation 및 schema/migration 기반이 먼저** 필요하다. Issue 이름을 바꾸지 않고 순서는 `TF-03c foundation → TF-03b Google Auth`로 권한다.

| 순서 / 작업 | 선행 승인·예상 범위 | 수용 기준 및 테스트 |
| --- | --- | --- |
| 0. ADR 승인 / 구현 결정 | Better Auth/Drizzle/driver의 조건부 기술 제안 검토. 로컬/CI 0원 범위를 우선 승인 | 기술 선택 승인은 계정 생성/Cloud 연결 승인과 별개. 실제 비용 0원이 확인되지 않으면 local/CI 범위만 수행. |
| 1. TF-03c PostgreSQL foundation | 우선 로컬 Docker PostgreSQL. 변경 예상 `src/lib/db/**`, Drizzle config/schema, `drizzle/**`, env example, CI workflow | 로컬 Docker 및 disposable CI PostgreSQL에서 빈 DB migration, FK/UNIQUE 및 rollback 시험. CI에는 production secret이 없음. 로컬/CI 성공만으로 Cloud 동작을 주장하지 않음. |
| 2. TF-03b Google Auth/principal | TF-03c DB/schema 기반 | 먼저 OAuth 처리 코드·mock/fixture 테스트를 분리해 개발. 실제 Google OAuth client/callback은 사용자가 허용하고 무료·결제 정책 확인을 통과한 후 별도 수행. Better Auth schema 중복 없음, 서버 session 검증, cookie/CSRF, 2-user IDOR, unauth 401. |
| 3. TF-03d 목록 metadata API | Auth + DB | owner-scoped create/list/get/rename/delete, Zod, no-op PATCH/version 계약, pagination 및 404 non-disclosure. PostgreSQL contract tests. |
| 4. TF-03e item CRUD transaction | TF-03d, TourAPI snapshot 정책 | add/delete/list/read, parent `SELECT FOR UPDATE`, duplicate/no-op, version/stale conflict, rollback/race 테스트 gate. DB 통합 결과를 근거로만 transaction 보장을 보고. |
| 5. TF-03f Travel list UI | API/auth 계약 안정화 | loading/empty/error/conflict, 키보드·모바일 접근성, bookmark E2E 유지. Preview에서는 현재 운영 설정을 변경하지 않고 정적/fixture 기반 확인을 우선한다. |

로컬 Docker PostgreSQL 및 CI PostgreSQL에서 통합 테스트를 통과해도 실제 Cloud provider, Vercel Node runtime, pooled endpoint, OAuth callback/계정 연동을 검증한 것은 아니다. 이 단계의 보고는 사용한 로컬/CI 엔진 버전과 테스트 결과만 기술하고 Cloud transaction 검증으로 일반화하지 않는다.

각 단계는 별도 Issue/PR로 구현 범위를 좁힌다. Phase 2 reorder/note는 별도 제품 승인 후 DB race/accessibility 테스트와 함께 독립 작업으로 연다.

## 11. 비용·보안 및 정책 미결정

- DB host와 구체 region, 월 예산 및 Free plan 초과 알림
- Preview별 database branch를 만들지, branch/database cleanup 책임
- Vercel plan, Function region/runtime, Neon pooling mode 및 허용 connection 수
- Google OAuth 앱의 authorized domains, 테스트 사용자, consent screen 및 redirect URI 운영
- 계정 연결(account linking), provider account 분리, 복구·탈퇴 및 data retention
- Better Auth `user.id`의 실제 Drizzle SQL type과 TF-03a UUID `app_users.id` 제안의 최종 정합
- DB runtime role과 migration role 분리, backup/restore 주기 및 복구 책임
- OAuth rate limit/abuse 방어, 로그 보존 및 개인정보 삭제 요구

서비스가 결제 수단 연결을 요구하거나 무료 한도 초과/유료 전환 위험을 명확히 차단할 수 없으면 Cloud 작업을 중단한다. 유료 요금제/add-on으로 이어서 진행하지 않는다. 가격 및 무료 한도는 가입 또는 자원 생성 직전에 공식 문서에서 재검증하고, 불확실성은 사용자 승인을 통해 해소하지 말고 우선 로컬/CI 작업으로 제한한다.

이 결정들이 승인되기 전 실제 인증·DB 생성·의존성 설치를 시작하지 않는다. 운영 DB 및 Vercel Production 설정은 변경하지 않는다. 서버 세션이 도입되어도 private API의 owner-scoped SQL, CSRF 방어, `no-store`, 데이터 보존 정책이 별도로 필요하다.

## 12. 면접에서 설명 가능한 선택 근거

> 여행 목록은 사용자 소유 관계와 목록 항목의 중복 방지, 동시 추가/삭제의 원자성이 핵심이어서 PostgreSQL의 FK·UNIQUE·transaction을 선택 후보로 뒀다. Next.js 16 프로젝트에서 직접 이해 가능한 타입 안전 SQL과 검토 가능한 migration을 위해 Drizzle을 Better Auth adapter와 통합하는 안을 제안했다. Auth 사용자 테이블과 `app_users`를 중복 생성하지 않고 검증된 서버 세션의 사용자 ID를 목록 owner FK로 연결한다. `SELECT FOR UPDATE`가 포함된 상호 의존 쿼리는 HTTP 단발 요청용 `neon-http`에 맡기지 않고 `pg` Pool의 동일 connection 또는 검증된 WebSocket transaction 경로에서 처리한다. 다만 실제 Postgres race/rollback 통합 테스트 전에는 보장을 주장하지 않고, CI용 disposable DB와 Preview/production 자격증명을 분리한다.

이 설명은 설계 의도이며 구현 성과나 운영상 성능 수치를 뜻하지 않는다.

## 13. 이번 조사에서 사용한 자료와 미검증 사항

공식 문서는 2026-11-19에 조회했다. 패키지 버전은 같은 날짜 npm registry metadata 조회값이며 설치하지 않았다.

### 공식 자료

- [Better Auth: Next.js integration](https://better-auth.com/docs/integrations/next) — Next.js 16 호환, 서버 `auth.api.getSession`, cookie 존재 검사만으로는 안전하지 않음.
- [Better Auth: Drizzle adapter](https://better-auth.com/docs/adapters/drizzle) — adapter schema와 테이블 mapping.
- [Better Auth: Database concepts](https://better-auth.com/docs/concepts/database) — schema 생성/동기화 개념 및 adapter.
- [Better Auth: Google provider](https://better-auth.com/docs/authentication/google) — callback URL, base URL, Google client 설정.
- [Auth.js: Installation](https://authjs.dev/getting-started/installation?framework=Next.js), [v5 migration](https://authjs.dev/getting-started/migrating-to-v5?authentication-method=middleware) — 현 문서는 `next-auth@beta` 경로 안내.
- [Supabase: SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework) — Next.js SSR cookie/Proxy와 `getClaims`, `getSession` 신뢰 경계.
- [Drizzle: Neon connectors](https://orm.drizzle.team/docs/connect-neon) — HTTP 단일 비대화형 요청 및 session/interactive transaction에 WebSocket 권고, Node `ws` 설정.
- [Drizzle: Transactions](https://orm.drizzle.team/docs/transactions), [migrations](https://orm.drizzle.team/docs/migrations), [push FAQ](https://orm.drizzle.team/docs/faq) — transaction/rollback 및 migration workflow.
- [node-postgres: Transactions](https://node-postgres.com/features/transactions), [Pool API](https://node-postgres.com/apis/pool) — 한 transaction에 같은 client 사용, client 반환.
- [Vercel: Connection pooling with Functions](https://vercel.com/kb/guide/connection-pooling-with-functions), [`attachDatabasePool` API](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package) — Node.js Function에서 global pool, pool lifecycle 및 `pg` 지원.
- [Prisma: Transactions](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions) — interactive transaction 및 rollback 주의.
- [Neon: Free plan 설명](https://neon.com/blog/10x-projects-on-free-plan), [Supabase pricing](https://supabase.com/pricing) — 2026-11-19 확인한 가격 정책 스냅샷. 실제 선택 시 최신 가격 재확인.

### 수행하지 않은 검증

- 패키지를 설치하거나 lockfile을 변경하지 않았으며, peer dependency만으로 런타임 호환성을 확정하지 않았다.
- Google OAuth 계정/credential/provider project를 생성하거나 callback을 실험하지 않았다.
- PostgreSQL, Neon, Supabase DB/branch를 생성하지 않았고 DB 연결·migration을 실행하지 않았다.
- Vercel Preview/production에서 driver pooling, suspend lifecycle 또는 region latency를 측정하지 않았다.
- `SELECT FOR UPDATE`, rollback, race, 2-user IDOR 통합 테스트는 아직 실행되지 않았다. 따라서 DB 동시성 검증 완료로 간주하지 않는다.
- 실제 비용은 사용량, plan, region, branch, egress, provider 정책을 확정하기 전에는 산정하지 않았다.

## 14. 최종 ADR 상태

**조건부 권장:** Better Auth + Google OAuth, Drizzle, PostgreSQL, Vercel Node.js의 `pg + Pool`; Neon은 host 후보로 유지.

**사용자 승인 필요:** 인증 공급자, DB host/region/예산, Preview 격리·과금, 계정 삭제/보존, 실제 package version 및 driver 최종 선택.
**구현 착수 gate:** 승인된 결정을 기준으로 별도 DB foundation/Auth/API/UI PR을 열고, production과 분리된 실제 PostgreSQL integration test에서 transaction/rollback/race/IDOR 기준을 통과시킨다.
