DELETE FROM `tickets`;
--> statement-breakpoint
ALTER TABLE `tickets` ADD `project_id` text NOT NULL REFERENCES projects(id);
