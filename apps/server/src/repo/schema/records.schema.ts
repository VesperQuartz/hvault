import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth.schema";

/**
 * Medical Records Table
 * Stores encrypted medical records with KMS envelope encryption and Hedera fingerprints
 */
export const records = sqliteTable(
  "records",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    // File metadata
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(), // bytes
    mimeType: text("mime_type").notNull(),

    // Document metadata (user-provided)
    title: text("title"), // Human-readable title e.g. "Blood Test Results"
    documentType: text("document_type"), // lab_result | prescription | imaging | vaccination | report | other
    recordDate: text("record_date"), // Date on the document (YYYY-MM-DD)
    doctorName: text("doctor_name"),
    hospitalName: text("hospital_name"),
    notes: text("notes"),
    
    // Encryption (KMS envelope encryption)
    encryptedDataKey: text("encrypted_data_key").notNull(), // KMS-encrypted data key
    
    // Storage
    r2Key: text("r2_key").notNull(), // R2 object path
    
    // Hedera fingerprint
    fileHash: text("file_hash").notNull(), // SHA-256 hash of original file
    hederaTopicId: text("hedera_topic_id").notNull(),
    hederaTransactionId: text("hedera_transaction_id"),
    hederaSequenceNumber: text("hedera_sequence_number"),
    
    // Timestamps
    uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("records_userId_idx").on(table.userId),
    index("records_fileHash_idx").on(table.fileHash),
  ]
);

/**
 * Share Links Table
 * Expiring links for doctors to access specific records
 */
export const shareLinks = sqliteTable(
  "share_links",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    // Share token (UUID for URL)
    token: text("token").notNull().unique(),
    
    // Expiry
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    
    // Access tracking
    accessedAt: integer("accessed_at", { mode: "timestamp_ms" }),
    accessCount: integer("access_count").default(0).notNull(),
    
    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("share_links_token_idx").on(table.token),
    index("share_links_recordId_idx").on(table.recordId),
  ]
);

/**
 * Audit Logs Table
 * Local mirror of Hedera audit trail for quick queries
 */
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recordId: text("record_id").references(() => records.id, { onDelete: "set null" }),
    
    // Action type
    action: text("action").notNull(), // UPLOAD, ACCESS, SHARE, DELETE, VERIFY, TAMPER_DETECTED
    
    // Hedera proof
    hederaTopicId: text("hedera_topic_id").notNull(),
    hederaTransactionId: text("hedera_transaction_id"),
    hederaSequenceNumber: text("hedera_sequence_number"),
    
    // Additional context
    metadata: text("metadata"), // JSON string for extra data
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    // Timestamp
    timestamp: integer("timestamp", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("audit_logs_userId_idx").on(table.userId),
    index("audit_logs_recordId_idx").on(table.recordId),
    index("audit_logs_action_idx").on(table.action),
  ]
);

/**
 * User Keys Table
 * Per-user KMS and Hedera resources
 */
export const userKeys = sqliteTable("user_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // AWS KMS key for this user
  kmsKeyId: text("kms_key_id").notNull(),
  
  // Hedera topic for this user's audit log
  hederaTopicId: text("hedera_topic_id").notNull().unique(),
  
  // Timestamp
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/**
 * Relations
 */
export const recordsRelations = relations(records, ({ one, many }) => ({
  user: one(user, {
    fields: [records.userId],
    references: [user.id],
  }),
  shareLinks: many(shareLinks),
  auditLogs: many(auditLogs),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  record: one(records, {
    fields: [shareLinks.recordId],
    references: [records.id],
  }),
  user: one(user, {
    fields: [shareLinks.userId],
    references: [user.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(user, {
    fields: [auditLogs.userId],
    references: [user.id],
  }),
  record: one(records, {
    fields: [auditLogs.recordId],
    references: [records.id],
  }),
}));

export const userKeysRelations = relations(userKeys, ({ one }) => ({
  user: one(user, {
    fields: [userKeys.userId],
    references: [user.id],
  }),
}));
