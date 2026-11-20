import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { testUtils, type TestHelpers } from "better-auth/plugins";
import { closePool, getPool } from "../src/lib/db/index.js";
import { createAuth } from "../src/lib/auth/config.js";
import { POST as postList } from "../src/app/api/travel-lists/route.js";
import { DELETE as deleteList } from "../src/app/api/travel-lists/[listId]/route.js";
import { GET as getItems } from "../src/app/api/travel-lists/[listId]/items/route.js";
import {
  DELETE as deleteItem,
  PUT as putItem,
} from "../src/app/api/travel-lists/[listId]/items/[contentId]/route.js";

const localDatabaseName = "tripfinder_test";
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const appOrigin = "http://127.0.0.1:3000";

function assertTestDatabaseTarget(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw)
    throw new Error("DATABASE_URL is required for item integration tests.");
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
) {
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
  const originalEnvironment = {
    secret: process.env.BETTER_AUTH_SECRET,
    tourKey: process.env.TOUR_API_SERVICE_KEY,
    tourFixtures: process.env.TOUR_API_E2E_FIXTURES,
  };
  process.env.TOUR_API_SERVICE_KEY ??= "ci-fixture-only-not-a-real-key";
  process.env.TOUR_API_E2E_FIXTURES = "true";

  const auth = createAuth([testUtils()]);
  const helpers = ((await auth.$context) as unknown as { test: TestHelpers })
    .test;
  const userIds: string[] = [];
  const listIds: string[] = [];
  const originalFetch = globalThis.fetch;
  const triggerName = "tf03e_force_item_rollback";
  const functionName = "tf03e_force_item_rollback_fn";

  try {
    const userA = await helpers.saveUser(
      helpers.createUser({ email: `tf03e-a-${randomUUID()}@example.test` }),
    );
    userIds.push(userA.id);
    const userB = await helpers.saveUser(
      helpers.createUser({ email: `tf03e-b-${randomUUID()}@example.test` }),
    );
    userIds.push(userB.id);
    const cookieA = cookieHeader(await helpers.login({ userId: userA.id }));
    const cookieB = cookieHeader(await helpers.login({ userId: userB.id }));

    const createList = async (cookie: string, name: string) => {
      const response = await postList(
        request("/api/travel-lists", {
          method: "POST",
          cookie,
          body: JSON.stringify({ name }),
        }),
      );
      await assertPrivate(response);
      assert.equal(response.status, 201);
      const list = (await response.json()) as { id: string; version: number };
      listIds.push(list.id);
      return list;
    };
    const listA = await createList(cookieA, "TF-03e owner A");
    const listB = await createList(cookieB, "TF-03e owner B");

    await assertApiError(
      await getItems(request(`/api/travel-lists/${listA.id}/items`), {
        params: Promise.resolve({ listId: listA.id }),
      }),
      401,
      "AUTHENTICATION_REQUIRED",
    );
    const unauthOrigin = await putItem(
      request(`/api/travel-lists/${listA.id}/items/127480`, {
        method: "PUT",
        cookie: cookieA,
        body: JSON.stringify({ contentTypeId: "12", expectedVersion: 1 }),
        origin: "https://attacker.example",
      }),
      { params: Promise.resolve({ listId: listA.id, contentId: "127480" }) },
    );
    await assertApiError(unauthOrigin, 403, "ORIGIN_FORBIDDEN");

    const invalid = await putItem(
      request(`/api/travel-lists/${listA.id}/items/127480`, {
        method: "PUT",
        cookie: cookieA,
        body: JSON.stringify({
          contentTypeId: "12",
          expectedVersion: 1,
          ownerId: userB.id,
        }),
      }),
      { params: Promise.resolve({ listId: listA.id, contentId: "127480" }) },
    );
    await assertApiError(invalid, 400, "VALIDATION_ERROR");

    const secretBeforeDisabledCheck = process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_SECRET;
    try {
      await assertApiError(
        await getItems(request(`/api/travel-lists/${listA.id}/items`), {
          params: Promise.resolve({ listId: listA.id }),
        }),
        503,
        "AUTH_DISABLED",
      );
    } finally {
      if (secretBeforeDisabledCheck === undefined)
        delete process.env.BETTER_AUTH_SECRET;
      else process.env.BETTER_AUTH_SECRET = secretBeforeDisabledCheck;
    }

    let networkCalls = 0;
    globalThis.fetch = async () => {
      networkCalls += 1;
      throw new Error("unexpected TourAPI request");
    };
    delete process.env.TOUR_API_E2E_FIXTURES;
    const missingList = randomUUID();
    await assertApiError(
      await putItem(
        request(`/api/travel-lists/${missingList}/items/127480`, {
          method: "PUT",
          cookie: cookieA,
          body: JSON.stringify({ contentTypeId: "12", expectedVersion: 1 }),
        }),
        {
          params: Promise.resolve({ listId: missingList, contentId: "127480" }),
        },
      ),
      404,
      "NOT_FOUND",
    );
    assert.equal(
      networkCalls,
      0,
      "missing owner-scoped list must short-circuit TourAPI",
    );

    await assertApiError(
      await getItems(
        request(`/api/travel-lists/${listA.id}/items`, { cookie: cookieB }),
        { params: Promise.resolve({ listId: listA.id }) },
      ),
      404,
      "NOT_FOUND",
    );
    await assertApiError(
      await getItems(
        request(`/api/travel-lists/${listB.id}/items`, { cookie: cookieA }),
        { params: Promise.resolve({ listId: listB.id }) },
      ),
      404,
      "NOT_FOUND",
    );
    await assertApiError(
      await putItem(
        request(`/api/travel-lists/${listA.id}/items/127480`, {
          method: "PUT",
          cookie: cookieB,
          body: JSON.stringify({ contentTypeId: "12", expectedVersion: 1 }),
        }),
        { params: Promise.resolve({ listId: listA.id, contentId: "127480" }) },
      ),
      404,
      "NOT_FOUND",
    );
    assert.equal(networkCalls, 0, "foreign owner must not trigger TourAPI");

    globalThis.fetch = async (_input, init) => {
      networkCalls += 1;
      const input = new URL(String(_input));
      if (input.searchParams.get("contentId") === "998") {
        throw new DOMException("fixture timeout", "TimeoutError");
      }
      if (input.searchParams.get("contentId") === "997") {
        return new Response("upstream unavailable", { status: 502 });
      }
      return originalFetch(_input, init);
    };
    await assertApiError(
      await putItem(
        request(`/api/travel-lists/${listA.id}/items/998`, {
          method: "PUT",
          cookie: cookieA,
          body: JSON.stringify({ contentTypeId: "12", expectedVersion: 1 }),
        }),
        { params: Promise.resolve({ listId: listA.id, contentId: "998" }) },
      ),
      504,
      "CONTENT_SOURCE_TIMEOUT",
    );
    await assertApiError(
      await putItem(
        request(`/api/travel-lists/${listA.id}/items/997`, {
          method: "PUT",
          cookie: cookieA,
          body: JSON.stringify({ contentTypeId: "12", expectedVersion: 1 }),
        }),
        { params: Promise.resolve({ listId: listA.id, contentId: "997" }) },
      ),
      503,
      "CONTENT_SOURCE_UNAVAILABLE",
    );
    process.env.TOUR_API_E2E_FIXTURES = "true";

    const put = async (
      contentId: string,
      contentTypeId: string,
      expectedVersion: number,
      cookie = cookieA,
      listId = listA.id,
    ) =>
      putItem(
        request(`/api/travel-lists/${listId}/items/${contentId}`, {
          method: "PUT",
          cookie,
          body: JSON.stringify({ contentTypeId, expectedVersion }),
        }),
        { params: Promise.resolve({ listId, contentId }) },
      );

    await assertApiError(await put("0", "12", 1), 404, "CONTENT_NOT_FOUND");
    await assertApiError(
      await put("127480", "13", 1),
      422,
      "INVALID_CONTENT_TYPE",
    );

    const first = await put("127480", "12", 1);
    await assertPrivate(first);
    assert.equal(first.status, 201);
    const firstBody = (await first.json()) as {
      item: {
        title: string;
        address: string;
        thumbnailUrl: string;
        position: number;
      };
      listVersion: number;
    };
    assert.equal(firstBody.item.title, "가거도");
    assert.equal(firstBody.item.position, 0);
    assert.equal(firstBody.listVersion, 2);

    for (const id of ["127481", "127482"]) {
      const response = await put(id, "12", id === "127481" ? 2 : 3);
      await assertPrivate(response);
      assert.equal(response.status, 201);
    }

    const pages: { id: string; contentId: string; position: number }[] = [];
    let cursor: string | null = null;
    let listVersion = 0;
    let firstCursor: string | null = null;
    do {
      const query = cursor
        ? `?limit=1&cursor=${encodeURIComponent(cursor)}`
        : "?limit=1";
      const response = await getItems(
        request(`/api/travel-lists/${listA.id}/items${query}`, {
          cookie: cookieA,
        }),
        { params: Promise.resolve({ listId: listA.id }) },
      );
      await assertPrivate(response);
      assert.equal(response.status, 200);
      const page = (await response.json()) as {
        items: { id: string; contentId: string; position: number }[];
        nextCursor: string | null;
        listVersion: number;
        itemCount: number;
      };
      listVersion = page.listVersion;
      assert.equal(page.itemCount, 3);
      pages.push(...page.items);
      if (!firstCursor) firstCursor = page.nextCursor;
      cursor = page.nextCursor;
    } while (cursor);
    assert.deepEqual(
      pages.map(({ contentId }) => contentId),
      ["127480", "127481", "127482"],
    );
    assert.deepEqual(
      pages.map(({ position }) => position),
      [0, 1, 2],
    );
    assert.equal(new Set(pages.map(({ id }) => id)).size, pages.length);
    const staleCursor = (
      await getItems(
        request(`/api/travel-lists/${listA.id}/items?limit=1`, {
          cookie: cookieA,
        }),
        { params: Promise.resolve({ listId: listA.id }) },
      )
    ).headers.get("Cache-Control");
    assert.equal(staleCursor, "private, no-store");
    assert.ok(firstCursor);

    const added = await put("127483", "12", listVersion);
    assert.equal(added.status, 201);
    await assertApiError(
      await getItems(
        request(
          `/api/travel-lists/${listA.id}/items?limit=1&cursor=${encodeURIComponent(firstCursor)}`,
          { cookie: cookieA },
        ),
        { params: Promise.resolve({ listId: listA.id }) },
      ),
      409,
      "CURSOR_STALE",
    );

    const duplicate = await put("127483", "12", listVersion);
    assert.equal(
      duplicate.status,
      200,
      "duplicate PUT is a stale-version-safe no-op",
    );
    await assertApiError(
      await put("127483", "13", listVersion),
      409,
      "CONTENT_ID_CONFLICT",
    );
    await assertApiError(
      await put("127484", "12", listVersion),
      409,
      "VERSION_CONFLICT",
    );

    const currentPage = await getItems(
      request(`/api/travel-lists/${listA.id}/items?limit=1`, {
        cookie: cookieA,
      }),
      { params: Promise.resolve({ listId: listA.id }) },
    );
    const currentBody = (await currentPage.json()) as { listVersion: number };
    const concurrent = await Promise.all([
      put("127485", "12", currentBody.listVersion),
      put("127485", "12", currentBody.listVersion),
    ]);
    assert.deepEqual(
      concurrent.map((response) => response.status).sort(),
      [200, 201],
    );
    const versionAfterConcurrent = await pool.query(
      `SELECT version FROM travel_lists WHERE id = $1::uuid`,
      [listA.id],
    );
    assert.equal(
      versionAfterConcurrent.rows[0].version,
      currentBody.listVersion + 1,
    );
    const afterConcurrent = await getItems(
      request(`/api/travel-lists/${listA.id}/items?limit=100`, {
        cookie: cookieA,
      }),
      { params: Promise.resolve({ listId: listA.id }) },
    );
    const afterConcurrentBody = (await afterConcurrent.json()) as {
      items: { contentId: string; position: number }[];
      itemCount: number;
      listVersion: number;
    };
    assert.equal(
      afterConcurrentBody.items.filter((item) => item.contentId === "127485")
        .length,
      1,
    );
    assert.equal(afterConcurrentBody.itemCount, 5);

    const raceVersion = afterConcurrentBody.listVersion;
    const putDeleteRace = await Promise.all([
      put("127485", "12", raceVersion),
      deleteItem(
        request(`/api/travel-lists/${listA.id}/items/127485`, {
          method: "DELETE",
          cookie: cookieA,
          extraHeaders: { "if-match": `"list-v${raceVersion}"` },
        }),
        { params: Promise.resolve({ listId: listA.id, contentId: "127485" }) },
      ),
    ]);
    assert.equal(putDeleteRace[1].status, 204);
    assert.ok([200, 409].includes(putDeleteRace[0].status));
    const afterRace = await getItems(
      request(`/api/travel-lists/${listA.id}/items?limit=100`, {
        cookie: cookieA,
      }),
      { params: Promise.resolve({ listId: listA.id }) },
    );
    const afterRaceBody = (await afterRace.json()) as {
      items: { contentId: string; position: number }[];
      itemCount: number;
      listVersion: number;
    };
    assert.equal(
      afterRaceBody.items.some((item) => item.contentId === "127485"),
      false,
    );
    assert.equal(afterRaceBody.itemCount, 4);
    assert.deepEqual(
      afterRaceBody.items.map((item) => item.position),
      [0, 1, 2, 3],
    );

    const removeMiddle = await deleteItem(
      request(`/api/travel-lists/${listA.id}/items/127481`, {
        method: "DELETE",
        cookie: cookieA,
        extraHeaders: {
          "if-match": `"list-v${afterRaceBody.listVersion}"`,
        },
      }),
      { params: Promise.resolve({ listId: listA.id, contentId: "127481" }) },
    );
    assert.equal(removeMiddle.status, 204);
    const afterMiddleRemoval = await getItems(
      request(`/api/travel-lists/${listA.id}/items?limit=100`, {
        cookie: cookieA,
      }),
      { params: Promise.resolve({ listId: listA.id }) },
    );
    const afterMiddleRemovalBody = (await afterMiddleRemoval.json()) as {
      items: { position: number }[];
      itemCount: number;
      listVersion: number;
    };
    assert.equal(afterMiddleRemovalBody.itemCount, 3);
    assert.deepEqual(
      afterMiddleRemovalBody.items.map((item) => item.position),
      [0, 2, 3],
    );

    const missingHeader = await deleteItem(
      request(`/api/travel-lists/${listA.id}/items/127480`, {
        method: "DELETE",
        cookie: cookieA,
      }),
      { params: Promise.resolve({ listId: listA.id, contentId: "127480" }) },
    );
    await assertApiError(missingHeader, 428, "PRECONDITION_REQUIRED");
    const staleDelete = await deleteItem(
      request(`/api/travel-lists/${listA.id}/items/127480`, {
        method: "DELETE",
        cookie: cookieA,
        extraHeaders: { "if-match": '"list-v1"' },
      }),
      { params: Promise.resolve({ listId: listA.id, contentId: "127480" }) },
    );
    await assertApiError(staleDelete, 412, "PRECONDITION_FAILED");
    const noOpDelete = await deleteItem(
      request(`/api/travel-lists/${listA.id}/items/127499`, {
        method: "DELETE",
        cookie: cookieA,
        extraHeaders: { "if-match": '"list-v1"' },
      }),
      { params: Promise.resolve({ listId: listA.id, contentId: "127499" }) },
    );
    await assertPrivate(noOpDelete);
    assert.equal(noOpDelete.status, 204);

    await pool.query(
      `CREATE FUNCTION ${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$
       BEGIN RAISE EXCEPTION 'forced TF-03e rollback'; END $$`,
    );
    await pool.query(
      `CREATE TRIGGER ${triggerName} BEFORE UPDATE OF version ON travel_lists
       FOR EACH ROW EXECUTE FUNCTION ${functionName}()`,
    );
    try {
      const versionBeforeRollback = afterMiddleRemovalBody.listVersion;
      const response = await put("127486", "12", versionBeforeRollback);
      await assertApiError(response, 500, "INTERNAL_ERROR");
      const itemAfterRollback = await pool.query(
        `SELECT id FROM travel_list_items WHERE travel_list_id = $1::uuid AND content_id = $2`,
        [listA.id, "127486"],
      );
      const listAfterRollback = await pool.query(
        `SELECT version FROM travel_lists WHERE id = $1::uuid`,
        [listA.id],
      );
      assert.equal(itemAfterRollback.rowCount, 0);
      assert.equal(listAfterRollback.rows[0].version, versionBeforeRollback);
    } finally {
      await pool.query(`DROP TRIGGER ${triggerName} ON travel_lists`);
      await pool.query(`DROP FUNCTION ${functionName}()`);
    }

    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_list_items
           (travel_list_id, content_id, content_type_id, position, title)
         VALUES ($1::uuid, '127480', '12', 99, 'duplicate')`,
          [listA.id],
        ),
      "23505",
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_list_items
             (travel_list_id, content_id, content_type_id, position, title)
           VALUES ($1::uuid, '127488', '12', 0, 'duplicate position')`,
          [listA.id],
        ),
      "23505",
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_list_items
             (travel_list_id, content_id, content_type_id, position, title)
           VALUES ($1::uuid, 'not-an-id', '12', 8, 'invalid ID')`,
          [listA.id],
        ),
      "23514",
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_list_items
             (travel_list_id, content_id, content_type_id, position, title)
           VALUES ($1::uuid, '127489', '12', -1, 'invalid position')`,
          [listA.id],
        ),
      "23514",
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_list_items
             (travel_list_id, content_id, content_type_id, position, title)
           VALUES ($1::uuid, '127490', '12', 8, '   ')`,
          [listA.id],
        ),
      "23514",
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO travel_list_items
             (travel_list_id, content_id, content_type_id, position, title)
           VALUES ($1::uuid, '127491', '12', 8, 'orphan')`,
          [randomUUID()],
        ),
      "23503",
    );

    const cascadeList = await createList(cookieA, "TF-03e cascade");
    const cascadeItem = await put(
      "127487",
      "12",
      cascadeList.version,
      cookieA,
      cascadeList.id,
    );
    assert.equal(cascadeItem.status, 201);
    const cascadeDelete = await deleteList(
      request(`/api/travel-lists/${cascadeList.id}`, {
        method: "DELETE",
        cookie: cookieA,
      }),
      { params: Promise.resolve({ listId: cascadeList.id }) },
    );
    assert.equal(cascadeDelete.status, 204);
    const cascaded = await pool.query(
      `SELECT id FROM travel_list_items WHERE travel_list_id = $1::uuid`,
      [cascadeList.id],
    );
    assert.equal(cascaded.rowCount, 0);

    console.log("Travel-list item PostgreSQL integration checks passed:");
    console.log(
      "- session auth, owner isolation, Origin, no-store and strict input",
    );
    console.log(
      "- TourAPI fixture snapshot, not-found, timeout and upstream failure",
    );
    console.log(
      "- duplicate PUT, stale version, If-Match delete and no-op invariants",
    );
    console.log(
      "- concurrent duplicate PUT and PUT/DELETE parent-lock serialization",
    );
    console.log(
      "- limit=1 keyset traversal, cursor invalidation and actual itemCount",
    );
    console.log("- database UNIQUE, cascade delete, and transaction rollback");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnvironment.secret === undefined)
      delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = originalEnvironment.secret;
    if (originalEnvironment.tourKey === undefined)
      delete process.env.TOUR_API_SERVICE_KEY;
    else process.env.TOUR_API_SERVICE_KEY = originalEnvironment.tourKey;
    if (originalEnvironment.tourFixtures === undefined)
      delete process.env.TOUR_API_E2E_FIXTURES;
    else process.env.TOUR_API_E2E_FIXTURES = originalEnvironment.tourFixtures;
    if (userIds.length > 0) {
      await pool.query(
        "DELETE FROM travel_lists WHERE owner_id = ANY($1::text[])",
        [userIds],
      );
      await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [
        userIds,
      ]);
    }
    await closePool();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
