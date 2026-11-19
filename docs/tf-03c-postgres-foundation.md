# TF-03c PostgreSQL 기반 및 실제 DB 테스트

작업: [Issue #13](https://github.com/minjuko/trip-finder/issues/13)
기준 `main`: `e5a9093db531ff6dd55f692875d3ed71b8fe735b`
현재 범위: 로컬 Docker PostgreSQL, `pg` Pool, Drizzle 연결 기반과 CI용 실제 PostgreSQL 검증.

## 로컬 실행

필요한 도구는 Node.js 22, npm, Docker Engine 및 Docker Compose다. 저장소의 `compose.yaml`은 `postgres:18.1-alpine`을 `127.0.0.1:5432`에만 노출하며 데이터베이스 이름은 `tripfinder_dev`다.

```powershell
docker compose up -d postgres
docker compose exec postgres createdb -U tripfinder_dev tripfinder_test
$env:DATABASE_URL = "postgres://tripfinder_dev:tripfinder_dev@127.0.0.1:5432/tripfinder_test"
npm run test:db
docker compose stop postgres
```

Test runner는 매 실행마다 무작위 test schema를 만들고 끝에 제거한다. DB URL과 비밀번호는 로그에 출력하지 않는다. Compose의 계정/비밀번호는 로컬 전용 고정 샘플이며 운영·Cloud에서 재사용하지 않는다.

## 현재 DB schema 및 migration 범위

아직 Better Auth가 설치되지 않았으며 `user.id`의 SQL 타입과 FK 방식은 확정되지 않았다. TourAPI item의 title/address/thumbnail snapshot 저장 여부도 미결정이다. 그러므로 `app_users`, `travel_lists`, `travel_list_items` 또는 그 migration을 만들지 않았다. `src/lib/db/schema.ts`는 후속 결정 전 domain table을 추가하지 않는 빈 schema entry point다. **현재 application migration SQL은 없다.**

통합 검사는 disposable test schema 안에만 fixture용 parent/item 테이블을 생성해 FK, UNIQUE, CHECK, rollback, 두 connection의 row lock을 확인한다. 이는 application schema의 migration 검증도, 여행 목록 API의 race 검증도 아니다. 사용자 ID·snapshot 정책 승인 후 Drizzle schema와 reviewable SQL migration을 별도 작업으로 추가하고, 빈 PostgreSQL에 적용하는 검증을 해야 한다.

## 연결 및 트랜잭션 helper

`src/lib/db/index.ts`의 `getPool()`은 `DATABASE_URL`을 실제로 요청받을 때만 Pool을 만든다. 빌드 시 DB 환경변수가 없어도 public route/build가 import만으로 DB에 연결하지 않는다. `withTransaction()`은 `pool.connect()`에서 받은 단일 `PoolClient`에 `BEGIN`, callback의 raw query와 Drizzle query, `COMMIT` 또는 `ROLLBACK`을 모두 실행하고 `finally`에서 반환한다. rollback 자체가 실패하면 해당 client를 pool에 재사용하지 않고 파기한다.

`npm run test:db`는 로컬 전용 host와 정확한 DB 이름 `tripfinder_test`만 허용한다. GitHub Actions는 job 전용 PostgreSQL 18 service를 사용하며 Production URL/secret을 받지 않는다.

### 개발·테스트와 운영 migration 경계

`drizzle.config.ts`는 `DATABASE_URL`이 명시되지 않으면 즉시 실패한다. Drizzle Kit 명령은 PostgreSQL URL의 host가 `localhost`, `127.0.0.1`, `::1` 중 하나이고 DB 이름이 `tripfinder_dev` 또는 `tripfinder_test`인 경우에만 진행한다. 기본 연결 대상은 없으며, 원격·운영 DB URL은 거부된다. 현재 schema가 비어 있어 application migration도 없다.

개발·테스트 migration은 disposable 로컬 또는 CI DB에서만 검토·검증한다. 운영 migration은 이번 기반 작업의 실행 대상이 아니다. 향후 운영 적용이 필요하면 별도 승인된 변경에서 SQL diff를 검토하고, 운영 전용 절차와 자격증명을 사용해 명시적으로 실행해야 한다. 앱 시작이나 배포에서 migration을 자동 실행하지 않으며, 이 작업에서는 운영 DB·Vercel Production 설정을 읽거나 변경하지 않는다.

## 검증 경계

Docker CLI가 없는 Windows 개발 환경에서는 로컬 실제 DB 테스트를 실행할 수 없다. GitHub Actions의 disposable PostgreSQL 결과는 CI runner의 PostgreSQL 18.1 환경에 대한 증거일 뿐, Neon, Supabase, Vercel pooler 또는 실제 cloud runtime 검증이 아니다. 이번 기반 테스트만으로 travel-list API의 동시성 보장도 주장하지 않는다.

## 이번 작업의 로컬 검증 기록

- npm registry 조회(2026-11-19): `drizzle-orm` `0.45.4`, `pg` `8.23.1`, `drizzle-kit` `0.31.11`, `tsx` `4.23.15`. 안정 버전 후보이며 실제 cloud 호환성을 보증하지 않는다. 공식 연결 참고: [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [node-postgres transactions](https://node-postgres.com/features/transactions).
- `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:coverage` 성공. Vitest 32 files / 166 tests 통과.
- E2E 전체 21 tests 통과. 첫 실행에서 기존 정렬 URL scenario 1건이 실패했고, 해당 테스트 단독 재실행과 전체 suite 재실행은 통과했다.
- fixture 환경변수로 `npm run build` 성공.
- Windows checkout의 `core.autocrlf=true` 상태에서 기본 `npm run format:check`는 LF/CRLF 차이로 여러 기존 파일을 포함해 실패했다. 전체 파일의 `npx prettier --end-of-line auto --check ...` 및 변경된 코드/설정 파일 검사는 통과했다. GitHub Actions의 Linux formatting job으로 정규 workflow 결과를 확인한다.
- Docker CLI가 없어 `npm run test:db`의 PostgreSQL 통합 검사를 로컬에서 실행하지 않았다. 미설정 `DATABASE_URL`에서 runner가 안전하게 거부하는 동작만 확인했다. 실제 constraint/rollback/row-lock 검증 결과는 CI 실행 결과로 별도 보고한다.
- owner ID와 TourAPI snapshot 정책 미결정에 따라 Drizzle application table 및 SQL migration은 생성/실행하지 않았다. Test runner에서 생성하는 임시 fixture DDL은 실제 테스트 DB 안에서만 사용되고 실행 종료 시 schema를 삭제한다.
