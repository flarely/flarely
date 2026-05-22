CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`key_hash` text NOT NULL,
	`label` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_hash_unique` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE TABLE `dedup_log` (
	`fingerprint` text NOT NULL,
	`project_id` text NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`hit_count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`fingerprint`, `project_id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`level` text NOT NULL,
	`source` text NOT NULL,
	`fingerprint` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`destination` text NOT NULL,
	`config` text NOT NULL,
	`dedup_window` integer DEFAULT 600 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
