CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'TODO' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "tasks_status_check" CHECK("tasks"."status" in ('TODO', 'IN_PROGRESS', 'COMPLETED'))
);
