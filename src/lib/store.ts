import { writable } from 'svelte/store'
import type { BookingState } from './types'

export const EMPTY_BOOKING: BookingState = {
	service: null,
	problem: '',
	location: '',
	district: '',
	photos: [],
	date: '',
	time: '',
	estimate: null,
	urgency: 'urgent',
	bookingId: null
}

export const booking = writable<BookingState>({ ...EMPTY_BOOKING })

// Shared service search query (bound to the navbar search box, read by the
// service list on the home page).
export const serviceQuery = writable('')
