# TF-03d 여행 목록 메타데이터 API

## 범위와 근거

- Issue #17의 범위에 따라 목록의 이름과 버전 메타데이터 CRUD API만 제공한다. 장소 항목, TourAPI snapshot, 목록 UI, 로그인 UI, 실제 OAuth 설정은 포함하지 않는다.
- 구현 기준은 `main`의 `7ba5ac0c97b70fa7b88826505c857eecf138b94c`이며, TF-03a 설계와 ADR의 미결정 정책, TF-03b Better Auth 세션, TF-03c Pool/Drizzle/migration 경계를 재사용한다.
- 기존 Better Auth 테이블과 migration은 변경하지 않는다. 별도의 `app_users` 및 `travel_list_items` 테이블도 만들지 않는다.

## DB schema와 계정 삭제 정책

`travel_lists`는 UUID primary key, `owner_id text`, `varchar(80) name`, 양의 integer `version`(기본 1), `timestamptz created_at/updated_at`으로 구성한다. 이름의 trim/non-empty/최대 길이와 version 양수 조건은 API와 DB check constraint 양쪽에서 검사한다. 이름 중복은 허용한다. `(owner_id, updated_at DESC, id DESC)` 인덱스가 소유자별 keyset 페이지 정렬을 지원한다.

증분 migration `drizzle/0001_wooden_the_executioner.sql`은 auth migration 다음 순서로 테이블을 추가하고, `drizzle/0002_low_luke_cage.sql`은 공백뿐인 이름도 DB에서 거부하도록 제약을 강화한다. `owner_id`는 기존 Better Auth `user.id`를 참조하며 FK 삭제 동작은 명시적 `NO ACTION`이다. 계정 삭제 후 목록 데이터를 즉시 지울지 보존·내보내기 할지는 미결정이다. 현재 FK는 목록이 남은 사용자의 삭제를 막아 실수로 목록을 cascade 삭제하지 않도록 한다. 실제 계정 삭제 기능을 만들기 전 retention/export 정책과 호환하는 별도 migration을 결정해야 한다.

## API 계약

모든 경로는 Node.js Route Handler이며 JSON 응답에 `Cache-Control: private, no-store`를 적용한다. 오류 body는 `{ "error": { "code": string, "message": string } }` 형식이다.

| 요청                                                                | 성공 응답                                                                  |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `GET /api/travel-lists?limit=20&cursor=...`                         | `200 { items: [{ id, name, version, createdAt, updatedAt }], nextCursor }` |
| `POST /api/travel-lists` body `{ name }`                            | `201` 및 생성된 목록 객체                                                  |
| `GET /api/travel-lists/{listId}`                                    | `200` 및 목록 객체                                                         |
| `PATCH /api/travel-lists/{listId}` body `{ name, expectedVersion }` | 변경 또는 no-op `200`; 이름이 바뀌면 version 증가                          |
| `DELETE /api/travel-lists/{listId}`                                 | 성공 `204` (body 없음)                                                     |

`itemCount`는 item 테이블이 없어서 응답하지 않는다. 항목 API를 도입할 TF-03e에서 실제 데이터 기반 계약을 확정한다. 페이지네이션은 `updated_at DESC, id DESC` 순서와 limit 1–100 (기본 20)을 사용하며 total count를 제공하지 않는다. cursor는 base64url로 직렬화한 위치값으로, 클라이언트는 opaque token으로 취급해야 한다. 페이지 사이에 목록이 추가·수정되면 조회 결과가 달라질 수 있는 best-effort pagination이다.

POST 재시도는 같은 이름의 별도 목록을 만들 수 있다. 클라이언트 자동 재시도 및 Idempotency-Key 정책은 정하지 않았고, 중복 생성 가능성을 호출 측에서 고려해야 한다. 사용자별 목록 개수 상한은 임의로 정하지 않았다. 실제 배포 사용량을 관측한 뒤 abuse 방지와 비용 정책을 별도 결정해야 한다.

## 인증, 소유권, 동시성

- 인증 설정이 빠져 있으면 일반 `503 AUTH_DISABLED`; 설정됐으나 세션이 없거나 만료되면 `401 AUTHENTICATION_REQUIRED`를 반환한다.
- POST/PATCH/DELETE는 trusted Origin이 필요하며 빠지거나 허용되지 않으면 `403 ORIGIN_FORBIDDEN`이다. 사용자 ID를 body/query/header에서 받지 않는다.
- 모든 DB 접근은 Better Auth 세션에서 검증한 `userId`와 `owner_id` 조건을 함께 사용한다. 다른 사용자의 목록과 없는 목록은 모두 동일한 `404 NOT_FOUND` body를 반환한다.
- 입력 object는 Zod strict다. 추가 필드(`ownerId`, `items` 등), 잘못된 JSON, UUID, cursor, 이름은 공통 오류 형식으로 거부한다. 일반 실행 오류는 세부 내용을 감춘 `500 INTERNAL_ERROR`이며 설정 비활성 503과 구별한다.
- PATCH는 owner-scoped `SELECT ... FOR UPDATE` transaction 안에서 현재 값을 확인한다. 같은 이름이면 stale `expectedVersion`이어도 version/updated_at을 변경하지 않는 200 no-op이다. 실제 변경의 version이 다르면 409, 일치하면 이름 변경·version +1·updated_at 갱신을 커밋한다.
- DELETE는 owner-scoped SQL DELETE다. PostgreSQL row lock과 statement transaction이 PATCH와 경합을 직렬화한다. 삭제 승자는 204, 뒤따르는 조회·수정·삭제는 404가 된다.

## 검증 경계

`scripts/verify-travel-lists-postgres.ts`는 오직 로컬 `tripfinder_test`를 대상으로 한다. CI에서는 기존 auth migration과 이 migration을 빈 disposable PostgreSQL에 순서대로 적용하고 migration 재실행 후 이 검증기를 실행한다. 검증 범위에는 Better Auth 테스트 사용자 A/B 및 두 A 세션, API CRUD/IDOR/입력/Origin/no-store, cursor, FK/check, 동시 PATCH와 PATCH/DELETE, transaction rollback이 포함된다. 로컬 Docker가 없으면 이 작업은 실행하지 않고 CI 결과와 구분한다. 운영 DB와 Vercel Production 설정은 사용하지 않는다.
