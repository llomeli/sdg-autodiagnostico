CREATE TABLE `assessment_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`domain` varchar(120) NOT NULL,
	`questionId` varchar(32) NOT NULL,
	`score` int,
	`isNotApplicable` boolean NOT NULL DEFAULT false,
	`priority` varchar(20),
	`responsibleRole` varchar(255),
	`processSystem` varchar(255),
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospect_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`legalName` varchar(255),
	`website` varchar(500),
	`sector` varchar(120) NOT NULL,
	`employeeRange` varchar(40) NOT NULL,
	`state` varchar(120) NOT NULL,
	`city` varchar(120),
	`systems` text,
	`keyProcesses` text,
	`criticalData` text,
	`fullName` varchar(255) NOT NULL,
	`jobTitle` varchar(255) NOT NULL,
	`area` varchar(255),
	`workEmail` varchar(320) NOT NULL,
	`phone` varchar(64),
	`preferredChannel` varchar(40),
	`decisionRole` varchar(40),
	`primaryConcern` text NOT NULL,
	`businessImpact` varchar(40) NOT NULL,
	`urgency` varchar(40) NOT NULL,
	`upcomingProject` text,
	`expectedOutcome` text,
	`consent` boolean NOT NULL,
	`consentAt` timestamp NOT NULL,
	`overallScore` int,
	`status` enum('new','reviewing','contacted','qualified','archived') NOT NULL DEFAULT 'new',
	`source` varchar(80) NOT NULL DEFAULT 'web-autodiagnostico',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospect_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assessment_responses_submission_idx` ON `assessment_responses` (`submissionId`);--> statement-breakpoint
CREATE INDEX `assessment_responses_domain_idx` ON `assessment_responses` (`domain`);--> statement-breakpoint
CREATE INDEX `assessment_responses_question_idx` ON `assessment_responses` (`questionId`);--> statement-breakpoint
CREATE INDEX `prospect_submissions_email_idx` ON `prospect_submissions` (`workEmail`);--> statement-breakpoint
CREATE INDEX `prospect_submissions_created_idx` ON `prospect_submissions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `prospect_submissions_status_idx` ON `prospect_submissions` (`status`);