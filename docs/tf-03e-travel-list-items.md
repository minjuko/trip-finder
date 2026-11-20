# TF-03e 여행 목록 항목 API

## 기준과 범위

- 기준 main은 `18d96ac9a290dd9391d55440815b02e2b19d4a10`이다. TF-03d의 Better Auth 세션, owner-scoped list repository, `pg.Pool` transaction 경계를 재사용한다.
- 사용자별 목록 항목 조회·추가·제거 API만 구현한다. 로그인/목록 UI, 항목 순서 변경, 메모, 공유 및 북마크 이전은 포함하지 않는다.
- 기존 localStorage 북마크, 공개 TourAPI 검색·상세 및 SEO 동작을 변경하지 않는다.

## 표시 snapshot 정책

새 항목을 추가할 때 서버가 입력한 문자열을 TourAPI `detailCommon2`로 조회한다. 요청의 content ID와 응답의 canonical content ID가 일치해야 하며 content type ID도 응답값과 대조한다. 클라이언트는 `title`, `address`, `thumbnail` 값을 보낼 수 없고, strict Zod schema가 추가 필드를 거부한다.

검증된 기본 표시 snapshot으로 title, 기본 주소(`addr1`, 없으면 null), 대표 이미지 URL(`firstimage`, 없으면 null)을 저장한다. 원본 콘텐츠의 간단한 이름·위치·이미지를 별도 외부 요청 없이 표시하고 TourAPI 장애에도 이미 담긴 항목을 읽게 하기 위한 선택이다. `content_id`와 `content_type_id`는 외부 식별자이므로 숫자 DB 타입으로 바꾸지 않고 문자열로 저장한다.

snapshot은 추가 시점 값이며 주기적 갱신은 하지 않는다. 같은 항목 재추가 PUT은 저장된 snapshot을 반환하는 no-op이며 TourAPI를 재조회하거나 list version을 올리지 않는다. 항목을 제거한 뒤 다시 추가하면 그 시점의 TourAPI 값으로 새 snapshot을 만든다. 따라서 저장된 이름·주소·이미지는 최신 원본과 달라질 수 있다. 화면 표시는 snapshot을 우선하고, 별도의 새로고침 기능은 이 단계에 포함하지 않는다.

없는 콘텐츠는 `404 CONTENT_NOT_FOUND`; TourAPI timeout은 `504 CONTENT_SOURCE_TIMEOUT`; HTTP/응답/API 장애 또는 읽을 수 없는 콘텐츠 응답은 `503 CONTENT_SOURCE_UNAVAILABLE`로 구분한다. 새 항목 추가가 실패해도 기존 DB 항목은 영향을 받지 않으며 목록 조회는 외부 API를 호출하지 않는다. 기존 `detailCommon2` 정규화 및 1시간 캐시를 재사용하고 별도 외부 서비스나 백그라운드 갱신 job은 추가하지 않는다.

## DB schema와 migration

Drizzle schema와 증분 migration `drizzle/0003_clumsy_dark_beast.sql`을 단일 관리 경로로 사용한다. `travel_list_items`는 UUID PK, `travel_lists.id` FK (`ON DELETE CASCADE`), 문자열 `content_id`/`content_type_id`, 0부터 시작하는 append position, 검증된 title/address/thumbnail snapshot, `created_at`을 가진다.

- `(travel_list_id, content_id)` UNIQUE는 목록 내 중복을 막는다. 같은 ID의 다른 type 요청은 API에서 409로 거절한다.
- `(travel_list_id, position)` UNIQUE와 `(travel_list_id, position, id)` 조회 인덱스, nonnegative position·형식·공백 title DB check를 둔다.
- 모든 item 변경은 owner-scoped parent `travel_lists` 행을 `SELECT FOR UPDATE`한 한 PostgreSQL transaction에서 수행한다. 새 추가는 현재 마지막 position + 1을 사용하며 삭제 후 다른 position을 재배열하지 않는다.
- `travel_lists.owner_id`의 기존 Better Auth FK와 계정 삭제 정책은 바꾸지 않는다. 목록 삭제 시에만 child item을 cascade 삭제한다.

CI는 빈 disposable PostgreSQL에 기존 auth/list migration 다음 item migration을 적용하고 즉시 재적용해 migration 반복 가능성을 확인한다. Production 및 운영 DB에는 migration을 실행하지 않는다.

## API 계약

모든 경로는 Node.js Route Handler이며 인증 principal의 owner ID를 사용한다. private 응답은 `Cache-Control: private, no-store`; 오류는 `{ "error": { "code": string, "message": string } }` 형식이다.

| 요청                                                                                         | 응답                                                                                                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/travel-lists/{listId}/items?limit=20&cursor=...`                                   | `200 { items, nextCursor, listVersion, itemCount }`. item은 `{ id, contentId, contentTypeId, title, address, thumbnailUrl, position, createdAt }` |
| `PUT /api/travel-lists/{listId}/items/{contentId}` body `{ contentTypeId, expectedVersion }` | 새 항목 `201 { item, listVersion }`; 같은 content ID/type 재시도 `200` 동일 구조의 no-op                                                          |
| `DELETE /api/travel-lists/{listId}/items/{contentId}` header `If-Match: "list-vN"`           | 삭제/이미 없음 모두 `204` body 없음                                                                                                               |

항목 조회는 repeatable-read read-only transaction에서 owner-scoped list version, 항목 page, 실제 DB count를 읽는다. cursor는 `{ version, position, id }`를 포함한다. 정렬은 `(position ASC, id ASC)`이며 이어지는 cursor의 version이 현재 version과 다르면 `409 CURSOR_STALE`이다. 삭제는 남은 position을 바꾸지 않는다.

PUT은 owner-scoped parent 존재를 먼저 확인한다. 동일 content ID가 이미 있다면 parent lock transaction 안에서 type을 비교하고, 같은 type은 version에 관계없이 `200` no-op, 다른 type은 `409 CONTENT_ID_CONFLICT`다. 신규 요청의 서버 TourAPI 검증은 DB transaction/row lock 바깥에서 끝낸다. 그 후 parent `FOR UPDATE` transaction 안에서 존재·중복·type·expectedVersion을 다시 확인하고, 신규 item 삽입과 list version/updated_at 증가를 함께 commit한다. stale 신규 PUT은 `409 VERSION_CONFLICT`다.

DELETE는 owner-scoped list를 확인한 뒤 `If-Match` 부재는 `428 PRECONDITION_REQUIRED`, 형식 오류는 `400 VALIDATION_ERROR`로 거절한다. parent lock 안에서 항목이 없으면 stale version이어도 `204` no-op이며, 존재하면 현재 list version 불일치 시 `412 PRECONDITION_FAILED`; 일치 시 item 삭제와 list version 증가를 함께 commit한다. 무인증 401, auth 미설정 503, mutation의 trusted Origin 실패 403, 없는/타 owner list 404, 일반 내부 오류 500이다.

## 검증

`scripts/verify-travel-list-items-postgres.ts`는 로컬 `tripfinder_test`로 제한된 CLI이며 CI에서는 disposable PostgreSQL만 사용한다. CI TourAPI 응답은 기존 fixture 경로로 대체하고, 실패/timeout 경우에만 fixture 경로 밖의 fetch를 테스트 내에서 대체한다. 실제 data.go.kr 연결은 실행하지 않는다.

검증기는 user A/B owner isolation, owner 미존재 시 TourAPI 미호출, auth/Origin/strict input/no-store, 성공·미존재·timeout·upstream error, snapshot 저장, 중복·type conflict·stale version, If-Match/no-op, 동시 중복 PUT 및 PUT/DELETE, limit=1 전체 페이지 순회와 cursor invalidation, 실제 itemCount/position, FK/UNIQUE/CHECK, rollback, cascade delete를 확인한다.

로컬 Docker/PostgreSQL은 사용하지 않는다. CI 결과로 실제 PostgreSQL 동작을 검증하며 그 결과가 나오기 전에는 통합 검증 완료로 보고하지 않는다. Google OAuth, 유료 서비스, 외부 Cloud DB, Production 설정 및 운영 migration은 사용하지 않는다.
