CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'TODO' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "todos_status_check" CHECK("todos"."status" in ('TODO', 'IN_PROGRESS', 'COMPLETED'))
);
