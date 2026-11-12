-- AlterTable
ALTER TABLE `activitylog` ADD COLUMN `demoKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `comment` ADD COLUMN `demoKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notification` ADD COLUMN `demoKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `project` ADD COLUMN `demoKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `task` ADD COLUMN `demoKey` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ActivityLog_demoKey_key` ON `ActivityLog`(`demoKey`);

-- CreateIndex
CREATE UNIQUE INDEX `Comment_demoKey_key` ON `Comment`(`demoKey`);

-- CreateIndex
CREATE UNIQUE INDEX `Notification_demoKey_key` ON `Notification`(`demoKey`);

-- CreateIndex
CREATE UNIQUE INDEX `Project_demoKey_key` ON `Project`(`demoKey`);

-- CreateIndex
CREATE UNIQUE INDEX `Task_demoKey_key` ON `Task`(`demoKey`);
