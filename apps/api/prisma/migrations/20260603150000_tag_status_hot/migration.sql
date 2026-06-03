ALTER TABLE `tags`
    ADD COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'ENABLED',
    ADD COLUMN `is_hot` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `tags_status_is_hot_idx` ON `tags`(`status`, `is_hot`);
