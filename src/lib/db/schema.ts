import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const bookings = sqliteTable('bookings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	serviceId: text('service_id').notNull(),
	serviceName: text('service_name').notNull(),
	problem: text('problem'),
	location: text('location').notNull(),
	district: text('district'),
	// JSON-encoded array of (downscaled) data-URL photo thumbnails
	photos: text('photos'),
	date: text('date').notNull(),
	time: text('time').notNull(),
	urgency: text('urgency').notNull().default('urgent'),
	estimatedPrice: real('estimated_price'),
	technicianId: text('technician_id'),
	technicianName: text('technician_name'),
	status: text('status').default('pending').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
})

export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
