# TF-03b Better Auth 기반 및 서버 세션

## 감사 기준과 보존 범위

- 기준 `main`: `1f3d8f47774672900c40670b86828f86517a5505` (TF-03c 병합 commit)
- 작업 브랜치: `feat/tf-03b-auth-foundation`
- TF-03a 설계, TF-03 기술 ADR 및 TF-03c DB foundation을 확인했다. Better Auth가 확정 전 조건부 권고였던 ADR보다 이 문서의 실제 패키지·코드·검증 결과가 구현 상태를 기록한다.
- TF-03c의 lazy `pg.Pool`, Drizzle node-postgres adapter, 명시적 `DATABASE_URL` 및 로컬 전용 Drizzle Kit host/database 제한을 재사용한다.
- 기존 `trip-finder:bookmarks` 저장 형식·동기화, TourAPI, 검색·상세 페이지, canonical·robots 정책은 구현 범위에서 제외했다. 여행 목록 API/UI 및 `app_users` projection table도 만들지 않았다.

## 패키지와 호환성

registry stable `latest` 조회 및 설치 시 `better-auth@1.7.26`, `@better-auth/drizzle-adapter@1.7.26`을 고정했다. Better Auth peer metadata는 Next `^14 || ^15 || ^16`, React/React DOM 18/19, Drizzle ORM `^0.45.2` 이상, `drizzle-kit >=0.31.4`를 허용한다. 저장소의 Next `16.4.5`, React `19.2.8`, Drizzle `0.45.4`, drizzle-kit `0.31.11`, `pg 8.23.1`과 범위가 맞고 실제 TypeScript 검사·빌드도 수행했다. Better Auth 공식 Next.js 문서는 Next.js 16 호환 및 App Router Route Handler 연결을 안내한다.

## 인증 schema와 migration

`src/lib/db/schema.ts`가 Drizzle의 단일 schema source다. Better Auth core `user`, `session`, `account`, `verification` 테이블만 정의하고 별도 `app_users`는 만들지 않았다. 공식 core schema에서 user ID는 `string`이며 기본 PostgreSQL 구현은 `text`로 지정했다. 후속 `travel_lists.owner_id`도 이 사용자 식별자를 참조한다면 PostgreSQL `text`를 사용해야 한다.

Drizzle Kit으로 `drizzle/0000_eager_rocket_racer.sql`을 생성·검토했다. 세션과 계정은 `user.id`를 참조하며 사용자 삭제 시 cascade하고, email/token unique 제약 및 사용자·verification lookup index가 있다. 운영 DB migration은 금지했다. 기존 `drizzle.config.ts`는 명시적인 `DATABASE_URL`과 로컬 `tripfinder_dev`/`tripfinder_test`만 허용한다.

CI PostgreSQL Integration은 job 전용 빈 PostgreSQL 18.1 service에 `db:migrate`를 적용하고, 한 번 더 실행해 반복 적용 동작을 확인한 다음 DB 통합 검사를 수행한다. job은 운영 secret이나 cloud DB를 사용하지 않는다.

## 서버 인증 경계

- `src/lib/auth/config.ts`의 `createAuth()`는 기존 Pool·Drizzle schema를 Better Auth adapter에 연결한다. 실제 provider 및 email/password 로그인은 설정하지 않아 Google credentials 없이 build와 session 검증 기반을 구성한다.
- `BETTER_AUTH_SECRET`(32자 이상), origin 형식 `BETTER_AUTH_URL`은 사용 시 필수다. Production에서는 URL이 HTTPS여야 하며 trusted origins는 정확한 HTTP(S) origin allow-list만 받는다. 비밀값에 기본 fallback을 두지 않았다.
- Better Auth의 기본 `HttpOnly`, `SameSite=Lax`, `/` cookie를 명시하고, URL이 HTTPS이면 Secure cookie를 적용한다. 운영은 HTTPS URL과 강한 secret이 필요하다.
- `/api/auth/[...all]`은 Node.js runtime에서 공식 Next handler로 연결한다. POST/PUT/PATCH/DELETE에는 Origin이 필요하며 exact trusted origin이 아니면 403으로 거부한다. 모든 auth 응답은 `Cache-Control: private, no-store`다.
- `getSessionPrincipal()`은 Better Auth 서버 API로 DB session을 검증하고 만료 시간을 다시 확인한 뒤 `user.id`만 반환한다. 요청의 header/body/query `userId`는 읽지 않는다. `requireSessionPrincipal()`은 세션이 없거나 만료되면 private no-store 401 response를 반환한다.
- PostgreSQL 통합 검사는 테스트 전용 `testUtils`로 생성한 사용자/session cookie를 실제 production auth instance의 검증 함수에 전달한다. test helper/plugin은 production auth 구성이나 route에 포함되지 않는다.

## 검증 및 미검증 범위

- 로컬 `npm run typecheck`, `npm run lint`, `npm run test:coverage`: 통과. 36 files / 174 tests 통과, 기존 166개 테스트를 포함하며 global coverage threshold 충족.
- Drizzle migration 생성: 통과. migration SQL은 저장소에서 검토 가능하다.
- E2E 21개와 production build: 로컬에서 통과했다.
- Windows 개발 환경에 Docker CLI가 없어 PostgreSQL 통합 검증은 로컬에서 실행하지 않았다.
- 최종 HEAD의 GitHub Actions [run #44704327331](https://github.com/minjuko/trip-finder/actions/runs/44704327331): **Quality Check**와 **PostgreSQL Integration** 성공. PostgreSQL job에서 빈 DB migration, repeat migration, TF-03c 통합 검사 및 Better Auth schema/session/Origin/no-store/사용자 격리 검사가 통과했다. Quality Check에서 format, lint, typecheck, 174 Vitest tests, 21 E2E tests, production build가 통과했다.
- 실제 Google OAuth 로그인·callback·Google credential은 설정하거나 검증하지 않았다. 계정 복구·linking 정책도 범위 밖이다.
- Neon, Supabase, 유료 서비스, 결제수단, Vercel Production 설정 및 운영 DB는 사용/변경하지 않았다.

## 사용 환경 변수

`.env.example`은 `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` 변수명을 제공한다. 로컬 개발 시 disposable DB URL 및 32자 이상의 로컬 전용 secret을 별도로 설정한다. CI에 쓰는 인증 secret은 테스트 fixture이며 배포용이 아니다.
