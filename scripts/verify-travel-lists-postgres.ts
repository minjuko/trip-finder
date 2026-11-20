import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { testUtils, type TestHelpers } from "better-auth/plugins";
import { closePool, getPool, withTransaction } from "../src/lib/db/index.js";
import { createAuth } from "../src/lib/auth/config.js";
import { GET as authGet } from "../src/app/api/auth/[...all]/route.js";
import {
  GET as getLists,
  POST as postList,
} from "../src/app/api/travel-lists/route.js";
import {
  DELETE as deleteList,
  GET as getList,
  PATCH as patchList,
} from "../src/app/api/travel-lists/[listId]/route.js";

const localDatabaseName = "tripfinder_test";
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const appOrigin = "http://127.0.0.1:3000";

function assertTestDatabaseTarget(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required for travel-list tests.");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !allowedHosts.has(url.hostname) ||
    databaseName !== localDatabaseName
  ) {
    throw new Error(
      `Refusing DB tests unless DATABASE_URL targets local ${localDatabaseName}.`,
    );
  }
}

function cookieHeader(login: {
  headers: Headers;
  cookies: { name: string; value: string }[];
}) {
  return (
    login.headers.get("cookie") ??
    login.cookies.map(({ name, value }) => `${name}=${value}`).join("; ")
  );
}

function request(
  path: string,
  options: {
    method?: string;
    cookie?: string;
    body?: string;
    origin?: string | null;
    extraHeaders?: Record<string, string>;
  } = {},
): Request {
  const headers = new Headers(options.extraHeaders);
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.origin !== null)
    headers.set("origin", options.origin ?? appOrigin);
  if (options.body !== undefined)
    headers.set("content-type", "application/json");
  return new Request(`${appOrigin}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
  });
}

async function assertPrivate(response: Response): Promise<void> {
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
}

async function assertApiError(
  response: Response,
  status: number,
  code: string,
): Promise<{ error: { code: string; message: string } }> {
  await assertPrivate(response);
  assert.equal(response.status, status);
  const body = (await response.json()) as {
    error: { code: string; message: string };
  };
  assert.equal(body.error.code, code);
  return body;
}

async function expectSqlState(
  operation: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) => {
    assert.equal((error as { code?: string }).code, expectedCode);
    return true;
  });
}

async function main(): Promise<void> {
  assertTestDatabaseTarget();
  const pool = getPool();
  const originalAuthEnvironment = {
    secret: process.env.BETTER_AUTH_SECRET,
    url: process.env.BETTER_AUTH_URL,
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
  };
  const testAuth = createAuth([testUtils()]);
  const helpers = (
    (await testAuth.$context) as unknown as { test: TestHelpers }
  ).test;
  const userIds: string[] = [];
  const testListIds: string[] = [];

  try {
    const userA = await helpers.saveUser(
      helpers.createUser({
        email: `tf03d-a-${randomUUID()}@example.test`,
      }),
    );
    userIds.push(userA.id);
    const userB = await helpers.saveUser(
      helpers.createUser({
        email: `tf03d-b-${randomUUID()}@example.test`,
      }),
    );
    userIds.push(userB.id);

    const loginA1 = await helpers.login({ userId: userA.id });
    const loginA2 = await helpers.login({ userId: userA.id });
    const loginB = await helpers.login({ userId: userB.id });
    const cookieA1 = cookieHeader(loginA1);
    const cookieA2 = cookieHeader(loginA2);
    const cookieB = cookieHeader(loginB);

    const originalSecret = process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_SECRET;
    try {
      const disabled = await getLists(request("/api/travel-lists"));
      await assertApiError(disabled, 503, "AUTH_DISABLED");
    } finally {
      if (originalSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
      else process.env.BETTER_AUTH_SECRET = originalSecret;
    }

    const unauthenticated = await getLists(request("/api/travel-lists"));
    await assertApiError(unauthenticated, 401, "AUTHENTICATION_REQUIRED");

    const noOrigin = await postList(
      request("/api/travel-lists", {
        method: "POST",
        cookie: cookieA1,
        body: JSON.stringify({ name: "blocked" }),
        origin: null,
      }),
    );
    await assertApiError(noOrigin, 403, "ORIGIN_FORBIDDEN");
    const foreignOrigin = await postList(
      request("/api/travel-lists", {
        method: "POST",
        cookie: cookieA1,
        body: JSON.stringify({ name: "blocked" }),
        origin: "https://attacker.example",
      }),
    );
    await assertApiError(foreignOrigin, 403, "ORIGIN_FORBIDDEN");

    const malformedJson = await postList(
      request("/api/travel-lists", {
        method: "POST",
        cookie: cookieA1,
        body: "{",
      }),
    );
    await assertApiError(malformedJson, 400, "INVALID_JSON");

    for (const body of [
      { name: "   " },
      { name: "x".repeat(81) },
      { name: "forbidden", ownerId: userB.id },
      { name: "forbidden", items: [] },
    ]) {
      const invalid = await postList(
        request("/api/travel-lists", {
          method: "POST",
          cookie: cookieA1,
          body: JSON.stringify(body),
        }),
      );
      await assertApiError(invalid, 400, "VALIDATION_ERROR");
    }

    const create = async (name: string, cookie = cookieA1) => {
      const response = await postList(
        request("/api/travel-lists", {
          method: "POST",
          cookie,
          body: JSON.stringify({ name }),
        }),
      );
      await assertPrivate(response);
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.name, name.trim());
      assert.equal(body.version, 1);
      assert.equal(Object.hasOwn(body, "itemCount"), false);
      testListIds.push(body.id);
      return body as {
        id: string;
        name: string;
        version: number;
        updatedAt: string;
      };
    };

    const first = await create("  duplicate name  ");
    const duplicate = await create("duplicate name");
    const third = await create("third list");
    assert.notEqual(first.id, duplicate.id, "duplicate names must be allowed");

    const firstPage = await getLists(
      request("/api/travel-lists?limit=1", {
        cookie: cookieA1,
        extraHeaders: { "x-user-id": userB.id },
      }),
    );
    await assertPrivate(firstPage);
    assert.equal(firstPage.status, 200);
    const firstPageBody = await firstPage.json();
    assert.equal(firstPageBody.items.length, 1);
    assert.equal(Object.hasOwn(firstPageBody.items[0], "itemCount"), false);
    assert.ok(firstPageBody.nextCursor);

    const secondPage = await getLists(
      request(
        `/api/travel-lists?limit=1&cursor=${encodeURIComponent(firstPageBody.nextCursor)}`,
        { cookie: cookieA1 },
      ),
    );
    await assertPrivate(secondPage);
    const secondPageBody = await secondPage.json();
    assert.notEqual(firstPageBody.items[0].id, secondPageBody.items[0].id);

    const badCursor = await getLists(
      request("/api/travel-lists?cursor=not-a-cursor", { cookie: cookieA1 }),
    );
    await assertApiError(badCursor, 400, "VALIDATION_ERROR");
    const invalidQuery = await getLists(
      request("/api/travel-lists?ownerId=someone-else", { cookie: cookieA1 }),
    );
    await assertApiError(invalidQuery, 400, "VALIDATION_ERROR");
    const invalidId = await getList(
      request("/api/travel-lists/not-a-uuid", { cookie: cookieA1 }),
      { params: Promise.resolve({ listId: "not-a-uuid" }) },
    );
    await assertApiError(invalidId, 400, "VALIDATION_ERROR");

    const detailA = await getList(
      request(`/api/travel-lists/${first.id}`, { cookie: cookieA1 }),
      { params: Promise.resolve({ listId: first.id }) },
    );
    await assertPrivate(detailA);
    assert.equal(detailA.status, 200);

    const crossOwner = await getList(
      request(`/api/travel-lists/${first.id}`, { cookie: cookieB }),
      { params: Promise.resolve({ listId: first.id }) },
    );
    const missingId = randomUUID();
    const missing = await getList(
      request(`/api/travel-lists/${missingId}`, { cookie: cookieB }),
      { params: Promise.resolve({ listId: missingId }) },
    );
    const crossOwnerBody = await assertApiError(crossOwner, 404, "NOT_FOUND");
    const missingBody = await assertApiError(missing, 404, "NOT_FOUND");
    assert.deepEqual(missingBody, crossOwnerBody);
    assert.equal(missing.status, crossOwner.status);

    const patch = async (id: string, cookie: string, payload: unknown) =>
      patchList(
        request(`/api/travel-lists/${id}`, {
          method: "PATCH",
          cookie,
          body: JSON.stringify(payload),
        }),
        { params: Promise.resolve({ listId: id }) },
      );

    const renamedResponse = await patch(first.id, cookieA1, {
      name: "renamed",
      expectedVersion: 1,
    });
    await assertPrivate(renamedResponse);
    assert.equal(renamedResponse.status, 200);
    const renamed = await renamedResponse.json();
    assert.equal(renamed.version, 2);

    const noOpResponse = await patch(first.id, cookieA1, {
      name: "renamed",
      expectedVersion: 1,
    });
    assert.equal(noOpResponse.status, 200);
    assert.equal((await noOpResponse.json()).version, 2);

    const staleResponse = await patch(first.id, cookieA1, {
      name: "stale value",
      expectedVersion: 1,
    });
    await assertApiError(staleResponse, 409, "VERSION_CONFLICT");

    const concurrent = await Promise.all([
      patch(first.id, cookieA1, { name: "race one", expectedVersion: 2 }),
      patch(first.id, cookieA2, { name: "race two", expectedVersion: 2 }),
    ]);
    assert.deepEqual(
      concurrent.map((response) => response.status).sort(),
      [200, 409],
    );
    for (const response of concurrent) await assertPrivate(response);

    const badPatch = await patch(first.id, cookieA1, {
      name: "mass assignment",
      expectedVersion: 3,
      ownerId: userB.id,
    });
    await assertApiError(badPatch, 400, "VALIDATION_ERROR");

    const ownerMismatchPatch = await patch(first.id, cookieB, {
      name: "forbidden",
      expectedVersion: 3,
    });
    await assertApiError(ownerMismatchPatch, 404, "NOT_FOUND");

    const deleteResponse = await deleteList(
      request(`/api/travel-lists/${duplicate.id}`, {
        method: "DELETE",
        cookie: cookieA1,
      }),
      { params: Promise.resolve({ listId: duplicate.id }) },
    );
    await assertPrivate(deleteResponse);
    assert.equal(deleteResponse.status, 204);
    testListIds.splice(testListIds.indexOf(duplicate.id), 1);
    const deleteAgain = await deleteList(
      request(`/api/travel-lists/${duplicate.id}`, {
        method: "DELETE",
        cookie: cookieA1,
      }),
      { params: Promise.resolve({ listId: duplicate.id }) },
    );
    await assertApiError(deleteAgain, 404, "NOT_FOUND");
    const otherDelete = await deleteList(
      request(`/api/travel-lists/${third.id}`, {
        method: "DELETE",
        cookie: cookieB,
      }),
      { params: Promise.resolve({ listId: third.id }) },
    );
    await assertApiError(otherDelete, 404, "NOT_FOUND");

    const deleteRaceList = await create("delete race");
    const race = await Promise.all([
      patch(deleteRaceList.id, cookieA1, {
        name: "race then delete",
        expectedVersion: 1,
      }),
      deleteList(
        request(`/api/travel-lists/${deleteRaceList.id}`, {
          method: "DELETE",
          cookie: cookieA2,
        }),
        { params: Promise.resolve({ listId: deleteRaceList.id }) },
      ),
    ]);
    assert.ok([200, 404].includes(race[0].status));
    assert.equal(race[1].status, 204);
    for (const response of race) await assertPrivate(response);
    testListIds.splice(testListIds.indexOf(deleteRaceList.id), 1);

    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_lists (owner_id, name) VALUES ($1, '')`,
          [userA.id],
        ),
      "23514",
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_lists (owner_id, name) VALUES ($1, $2)`,
          [userA.id, "\t"],
        ),
      "23514",
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_lists (owner_id, name) VALUES ($1, 'orphan')`,
          [`missing-${randomUUID()}`],
        ),
      "23503",
    );
    await expectSqlState(
      () => pool.query(`DELETE FROM "user" WHERE id = $1`, [userA.id]),
      "23503",
    );
    const retainedOwner = await pool.query(
      `SELECT id FROM "user" WHERE id = $1`,
      [userA.id],
    );
    assert.equal(retainedOwner.rowCount, 1);

    const rollbackListId = randomUUID();
    const rollbackSentinel = new Error("travel list rollback sentinel");
    await assert.rejects(
      withTransaction(async ({ client }) => {
        await client.query(
          `INSERT INTO travel_lists (id, owner_id, name) VALUES ($1, $2, $3)`,
          [rollbackListId, userA.id, "must rollback"],
        );
        throw rollbackSentinel;
      }),
      (error) => error === rollbackSentinel,
    );
    const rollbackCheck = await pool.query(
      `SELECT id FROM travel_lists WHERE id = $1`,
      [rollbackListId],
    );
    assert.equal(rollbackCheck.rowCount, 0);

    const disabledAuthSecret = process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_SECRET;
    try {
      const disabledAuth = await authGet(request("/api/auth/get-session"));
      assert.equal(disabledAuth.status, 503);
      assert.equal(
        disabledAuth.headers.get("Cache-Control"),
        "private, no-store",
      );
    } finally {
      if (disabledAuthSecret === undefined)
        delete process.env.BETTER_AUTH_SECRET;
      else process.env.BETTER_AUTH_SECRET = disabledAuthSecret;
    }

    console.log("Travel-list PostgreSQL integration checks passed:");
    console.log(
      "- Better Auth disabled 503, no-session 401, and Origin CSRF 403",
    );
    console.log(
      "- A/B owner isolation, owner-scoped 404, and ignored user ID headers",
    );
    console.log(
      "- strict JSON/name/UUID/cursor validation and private no-store responses",
    );
    console.log("- create/list/detail/rename/no-op/stale version/delete CRUD");
    console.log(
      "- keyset pagination, FK/check constraints, and retained account rows",
    );
    console.log(
      "- independent-session concurrent PATCH and PATCH/DELETE serialization",
    );
    console.log("- PostgreSQL transaction rollback leaves no partial list");
  } finally {
    await pool.query(
      `DELETE FROM travel_lists WHERE owner_id = ANY($1::text[])`,
      [userIds],
    );
    for (const userId of userIds) await helpers.deleteUser(userId);
    if (originalAuthEnvironment.secret === undefined) {
      delete process.env.BETTER_AUTH_SECRET;
    } else process.env.BETTER_AUTH_SECRET = originalAuthEnvironment.secret;
    if (originalAuthEnvironment.url === undefined) {
      delete process.env.BETTER_AUTH_URL;
    } else process.env.BETTER_AUTH_URL = originalAuthEnvironment.url;
    if (originalAuthEnvironment.trustedOrigins === undefined) {
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
    } else {
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        originalAuthEnvironment.trustedOrigins;
    }
    await closePool();
  }
}

main().catch((error: unknown) => {
  console.error("Travel-list PostgreSQL integration checks failed.");
  console.error(error instanceof Error ? error.message : "Unknown failure");
  process.exitCode = 1;
});
