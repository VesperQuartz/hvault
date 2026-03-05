CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`vault_item_id` text,
	`action` text NOT NULL,
	`domain` text,
	`hedera_topic_id` text NOT NULL,
	`hedera_message_id` text,
	`hedera_sequence_number` text,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`hedera_topic_id` text NOT NULL,
	`kms_key_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_metadata_user_id_unique` ON `user_metadata` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_metadata_hedera_topic_id_unique` ON `user_metadata` (`hedera_topic_id`);--> statement-breakpoint
CREATE TABLE `vault_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`encrypted_data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
