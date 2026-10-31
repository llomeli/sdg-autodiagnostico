-- v1.2.0: privacy-notice version per lead + FK with ON DELETE CASCADE (deletion/ARCO requests).
-- Orphaned answers (possible with the non-transactional v1.1.0 insert) must go before the FK is added.
DELETE r FROM `assessment_responses` r LEFT JOIN `prospect_submissions` p ON p.`id` = r.`submissionId` WHERE p.`id` IS NULL;--> statement-breakpoint
ALTER TABLE `prospect_submissions` ADD `privacyNoticeVersion` varchar(40);--> statement-breakpoint
ALTER TABLE `assessment_responses` ADD CONSTRAINT `assessment_responses_submissionId_prospect_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `prospect_submissions`(`id`) ON DELETE cascade ON UPDATE no action;