import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  primaryKey,
  unique,
  index,
  foreignKey,
  pgEnum,
} from "drizzle-orm/pg-core";
const time = (name: string) => timestamp(name, { withTimezone: true });
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: time("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: time("access_token_expires_at"),
    refreshTokenExpiresAt: time("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("account_user_idx").on(t.userId),
    unique("account_provider_unique").on(t.providerId, t.accountId),
  ],
);
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: time("expires_at").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const roleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);
export const projectStatus = pgEnum("project_status", [
  "planned",
  "active",
  "completed",
]);
export const taskStatus = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);
export const priorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const members = pgTable(
  "members",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("member"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.userId] }),
    index("members_user_idx").on(t.userId),
  ],
);
export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: roleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: time("expires_at").notNull(),
    acceptedAt: time("accepted_at"),
    revokedAt: time("revoked_at"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [index("invitations_org_idx").on(t.organizationId)],
);
export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    company: text("company"),
    notes: text("notes"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("clients_tenant_id_unique").on(t.organizationId, t.id),
    index("clients_org_idx").on(t.organizationId),
  ],
);
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatus("status").notNull().default("planned"),
    dueDate: text("due_date"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("projects_tenant_id_unique").on(t.organizationId, t.id),
    index("projects_org_idx").on(t.organizationId),
    foreignKey({
      columns: [t.organizationId, t.clientId],
      foreignColumns: [clients.organizationId, clients.id],
      name: "projects_client_tenant_fk",
    }).onDelete("restrict"),
  ],
);
export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull(),
    title: text("title").notNull(),
    status: taskStatus("status").notNull().default("todo"),
    priority: priorityEnum("priority").notNull().default("medium"),
    dueDate: text("due_date"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("tasks_org_idx").on(t.organizationId),
    foreignKey({
      columns: [t.organizationId, t.projectId],
      foreignColumns: [projects.organizationId, projects.id],
      name: "tasks_project_tenant_fk",
    }).onDelete("cascade"),
  ],
);
