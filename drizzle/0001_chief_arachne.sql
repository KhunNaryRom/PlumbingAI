ALTER TABLE `bookings` ALTER COLUMN "estimated_price" TO "estimated_price" real;--> statement-breakpoint
ALTER TABLE `bookings` ADD `district` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `photos` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `technician_id` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `technician_name` text;