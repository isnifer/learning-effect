CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'TODO' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "tickets_status_check" CHECK("tickets"."status" in ('TODO', 'IN_PROGRESS', 'COMPLETED'))
);
