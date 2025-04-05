-- AlterTable
ALTER TABLE `users` ADD COLUMN `passwordReset` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `avatar` VARCHAR(191) NULL DEFAULT '/default.png';
