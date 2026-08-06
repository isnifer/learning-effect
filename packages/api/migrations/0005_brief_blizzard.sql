CREATE TABLE `__new_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'TODO' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "tickets_number_check" CHECK(typeof("__new_tickets"."number") = 'integer' and "__new_tickets"."number" > 0),
	CONSTRAINT "tickets_status_check" CHECK("__new_tickets"."status" in ('TODO', 'IN_PROGRESS', 'COMPLETED'))
);
--> statement-breakpoint
INSERT INTO `__new_tickets` (`id`, `project_id`, `number`, `title`, `status`, `created_at`)
SELECT
	`id`,
	`project_id`,
	row_number() OVER (PARTITION BY `project_id` ORDER BY `id`),
	`title`,
	`status`,
	`created_at`
FROM `tickets`;
--> statement-breakpoint
DROP TABLE `tickets`;
--> statement-breakpoint
ALTER TABLE `__new_tickets` RENAME TO `tickets`;
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_project_id_number_unique` ON `tickets` (`project_id`,`number`);
--> statement-breakpoint
CREATE TRIGGER `tickets_active_project_insert`
BEFORE INSERT ON `tickets`
FOR EACH ROW
WHEN EXISTS (
	SELECT 1
	FROM `projects`
	WHERE `projects`.`id` = NEW.`project_id`
		AND `projects`.`archived_at` IS NOT NULL
)
BEGIN
	SELECT RAISE(ABORT, 'tickets_project_archived');
END;
