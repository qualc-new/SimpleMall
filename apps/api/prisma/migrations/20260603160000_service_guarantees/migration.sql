-- 服务保障字典表 + SPU 关联字段
CREATE TABLE `service_guarantees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ENABLED',
    `sort` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `service_guarantees_name_key`(`name`),
    INDEX `service_guarantees_status_sort_idx`(`status`, `sort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `spus` ADD COLUMN `service_list` VARCHAR(512) NOT NULL DEFAULT '';
