CREATE TABLE `project_directories` (
	`project_id` text NOT NULL,
	`absolute_path` text NOT NULL,
	PRIMARY KEY(`project_id`, `absolute_path`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_directories_absolute_path_index` ON `project_directories` (`absolute_path`);