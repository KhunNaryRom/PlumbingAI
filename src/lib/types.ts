export interface Service {
	id: string
	name: string
	nameKhmer: string
	description: string
	price: number
	badge?: { label: string; type: 'ai' | 'top' }
}

export interface BookingState {
	service: Service | null
	problem: string
	location: string
	district: string
	photos: string[]
	date: string
	time: string
	estimate: number | null
	urgency: 'routine' | 'urgent' | 'emergency'
	bookingId: number | null
}

export const STEPS = ['Select Service', 'Describe Problem', 'Enter Location', 'Pick Date & Time', 'AI Price Estimate'] as const

export const SERVICES: Service[] = [
	{
		id: 'drain-pump',
		name: 'Septic Tank Pump-out',
		nameKhmer: 'បូមលូ និងអាងចម្រោះ',
		description: 'Professional sludge removal and eco-friendly disposal.',
		price: 45,
		badge: { label: 'AI Optimized Route', type: 'ai' }
	},
	{
		id: 'clog-removal',
		name: 'Toilet Unblocking',
		nameKhmer: 'សេវាកម្មកម្ចាត់ការស្ទះ',
		description: 'High-pressure cleaning for stubborn pipe obstructions.',
		price: 25
	},
	{
		id: 'maintenance',
		name: 'System Maintenance',
		nameKhmer: 'ការថែទាំជាប្រចាំ',
		description: 'Biannual check-up and sensor calibration for smart systems.',
		price: 35
	},
	{
		id: 'smart-sensor',
		name: 'Smart Sensor Install',
		nameKhmer: 'តម្លើងសេនស័រវៃឆ្លាត',
		description: 'IoT level monitoring with real-time mobile app alerts.',
		price: 60,
		badge: { label: 'TOP RATED', type: 'top' }
	}
]
