import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** Better Auth's canonical core schema. User IDs are text, not UUIDs. */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** User-owned metadata only; account deletion behavior remains unapproved. */
export const travelLists = pgTable(
  "travel_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "no action" }),
    name: varchar("name", { length: 80 }).notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "travel_lists_name_valid_check",
      sql`char_length(${table.name}) BETWEEN 1 AND 80 AND ${table.name} = btrim(${table.name}) AND ${table.name} ~ '[^[:space:]]'`,
    ),
    check("travel_lists_version_positive_check", sql`${table.version} > 0`),
    index("travel_lists_owner_updated_id_idx").on(
      table.ownerId,
      table.updatedAt.desc(),
      table.id.desc(),
    ),
  ],
);

/** TourAPI-backed snapshot rows owned through their parent travel list. */
export const travelListItems = pgTable(
  "travel_list_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    travelListId: uuid("travel_list_id")
      .notNull()
      .references(() => travelLists.id, { onDelete: "cascade" }),
    contentId: text("content_id").notNull(),
    contentTypeId: text("content_type_id").notNull(),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    address: text("address"),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "travel_list_items_position_nonnegative_check",
      sql`${table.position} >= 0`,
    ),
    check(
      "travel_list_items_content_id_check",
      sql`${table.contentId} ~ '^[0-9]{1,64}$'`,
    ),
    check(
      "travel_list_items_content_type_id_check",
      sql`${table.contentTypeId} ~ '^[0-9]{1,8}$'`,
    ),
    check(
      "travel_list_items_title_nonblank_check",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    unique("travel_list_items_list_content_unique").on(
      table.travelListId,
      table.contentId,
    ),
    unique("travel_list_items_list_position_unique").on(
      table.travelListId,
      table.position,
    ),
    index("travel_list_items_list_position_id_idx").on(
      table.travelListId,
      table.position,
      table.id,
    ),
  ],
);

export const authSchema = { user, session, account, verification };
