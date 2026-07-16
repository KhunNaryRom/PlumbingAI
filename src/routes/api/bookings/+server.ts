import { json } from '@sveltejs/kit'
import { and, desc, eq, ne } from 'drizzle-orm'
import { getDb } from '$lib/db'
import { bookings } from '$lib/db/schema'

export async function POST({ request }) {
	try {
		const db = getDb()
		const body = await request.json()

		if (!body?.serviceId || !body?.serviceName || !body?.location || !body?.date || !body?.time) {
			return json({ error: 'Missing required booking fields' }, { status: 400 })
		}

		const photos = Array.isArray(body.photos) ? body.photos : []

		const [booking] = await db
			.insert(bookings)
			.values({
				serviceId: body.serviceId,
				serviceName: body.serviceName,
				problem: body.problem ?? null,
				location: body.location,
				district: body.district ?? null,
				photos: photos.length ? JSON.stringify(photos) : null,
				date: body.date,
				time: body.time,
				urgency: body.urgency ?? 'urgent',
				estimatedPrice: typeof body.estimatedPrice === 'number' ? body.estimatedPrice : null,
				technicianId: body.technicianId ?? null,
				technicianName: body.technicianName ?? null
			})
			.returning()

		return json(booking, { status: 201 })
	} catch (error) {
		console.error('POST /bookings failed:', error)
		return json(
			{
				error: error instanceof Error ? error.message : String(error),
				cause: error instanceof Error ? (error as any).cause : undefined
			},
			{ status: 500 }
		)
	}
}

export async function GET({ url }) {
	try {
		const db = getDb()
		const date = url.searchParams.get('date')

		// Availability check for the schedule page: which time slots are already
		// taken (any non-cancelled booking) on a given day.
		if (date) {
			const rows = await db
				.select({ time: bookings.time })
				.from(bookings)
				.where(and(eq(bookings.date, date), ne(bookings.status, 'cancelled')))
			const bookedSlots = [...new Set(rows.map((r) => r.time))]
			return json({ date, bookedSlots })
		}

		// Booking history — newest first.
		const rows = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(100)
		return json(rows)
	} catch (error) {
		console.error('GET /bookings failed:', error)
		return json(
			{
				error: error instanceof Error ? error.message : String(error),
				cause: error instanceof Error ? (error as any).cause : undefined
			},
			{ status: 500 }
		)
	}
}