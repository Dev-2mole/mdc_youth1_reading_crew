/*
  Warnings:

  - Made the column `team_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_team_id_fkey`;

-- DropIndex
DROP INDEX `users_team_id_fkey` ON `users`;

-- AlterTable
ALTER TABLE `users` MODIFY `team_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
