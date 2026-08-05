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
