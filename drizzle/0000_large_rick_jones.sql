CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_id` text NOT NULL,
	`service_name` text NOT NULL,
	`problem` text,
	`location` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`urgency` text DEFAULT 'urgent' NOT NULL,
	`estimated_price` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
