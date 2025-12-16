SET FOREIGN_KEY_CHECKS = 0;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `id` int unsigned AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `id` int unsigned AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `locations` MODIFY COLUMN `id` int unsigned AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `id` int unsigned AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` int unsigned AUTO_INCREMENT NOT NULL;--> statement-breakpoint
SET FOREIGN_KEY_CHECKS = 1;