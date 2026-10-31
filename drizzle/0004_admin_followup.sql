CREATE TABLE `lead_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`type` enum('note','call','email','meeting','status','assignment') NOT NULL,
	`body` text NOT NULL,
	`author` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `prospect_submissions` ADD `assignedTo` varchar(120);--> statement-breakpoint
ALTER TABLE `prospect_submissions` ADD `nextAction` varchar(255);--> statement-breakpoint
ALTER TABLE `prospect_submissions` ADD `nextActionAt` timestamp;--> statement-breakpoint
ALTER TABLE `prospect_submissions` ADD `lastContactAt` timestamp;--> statement-breakpoint
ALTER TABLE `lead_activities` ADD CONSTRAINT `lead_activities_submissionId_prospect_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `prospect_submissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lead_activities_submission_idx` ON `lead_activities` (`submissionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `prospect_submissions_assigned_idx` ON `prospect_submissions` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `prospect_submissions_next_action_idx` ON `prospect_submissions` (`nextActionAt`);