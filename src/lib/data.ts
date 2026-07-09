export interface Technician {
	id: string
	initials: string
	name: string
	nameLabel: string
	rating: number
	jobs: number
	phone: string
	/** service ids this technician is certified for */
	specialties: string[]
}

export interface UserProfile {
	initials: string
	displayName: string
}

export const CURRENT_USER: UserProfile = {
	initials: 'KL',
	displayName: 'Korng Ly'
}

export const APP_NAME = 'Sanitation Modernist'
export const SUPPORT_EMAIL = 'support@sanitationmodernist.com'
export const SUPPORT_PHONE = '+855 23 900 100'

// Full technician roster. Assignment is deterministic (see assignTechnician)
// so the same booking always shows the same technician across steps.
export const TECHNICIANS: Technician[] = [
	{
		id: 'sok-visal',
		initials: 'SV',
		name: 'លោក សុខ វិសាល',
		nameLabel: 'Sok Visal',
		rating: 4.9,
		jobs: 120,
		phone: '+855 12 345 678',
		specialties: ['drain-pump', 'clog-removal']
	},
	{
		id: 'chan-dara',
		initials: 'CD',
		name: 'លោក ចាន់ ដារ៉ា',
		nameLabel: 'Chan Dara',
		rating: 4.8,
		jobs: 96,
		phone: '+855 12 987 654',
		specialties: ['clog-removal', 'maintenance']
	},
	{
		id: 'kim-sophea',
		initials: 'KS',
		name: 'អ្នកស្រី គីម សុភា',
		nameLabel: 'Kim Sophea',
		rating: 5.0,
		jobs: 74,
		phone: '+855 78 222 145',
		specialties: ['smart-sensor', 'maintenance']
	},
	{
		id: 'norg-piseth',
		initials: 'NP',
		name: 'លោក នង់ ពិសិដ្ឋ',
		nameLabel: 'Nong Piseth',
		rating: 4.7,
		jobs: 138,
		phone: '+855 96 550 070',
		specialties: ['drain-pump', 'smart-sensor']
	}
]

function hashString(input: string): number {
	let h = 0
	for (let i = 0; i < input.length; i++) {
		h = (h * 31 + input.charCodeAt(i)) | 0
	}
	return Math.abs(h)
}

/**
 * Pick a technician certified for the requested service. Deterministic on
 * (serviceId, district) so every step of a booking shows the same person.
 */
export function assignTechnician(serviceId: string | undefined, district = ''): Technician {
	if (!serviceId) return TECHNICIANS[0]
	const eligible = TECHNICIANS.filter((t) => t.specialties.includes(serviceId))
	const pool = eligible.length ? eligible : TECHNICIANS
	return pool[hashString(`${serviceId}|${district}`) % pool.length]
}

export const URGENCY_OPTIONS = [
	{ value: 'routine' as const, labelKh: 'ធម្មតា (Routine)', labelEn: 'Within 48 hours', icon: 'calendar' as const },
	{ value: 'urgent' as const, labelKh: 'ប្រញ្ញាប់ (Urgent)', labelEn: 'Same day service', icon: 'clock' as const },
	{ value: 'emergency' as const, labelKh: 'បន្ទាន់ (Emergency)', labelEn: 'Immediate response', icon: 'star' as const }
] as const

// Districts served, with the travel/distance fee (USD) for each. Farther
// districts from the depot in Khan Sen Sok carry a higher fee.
export const DISTRICT_FEES: Record<string, number> = {
	'Khan Sen Sok': 3,
	'BKK1 (Boeng Keng Kang)': 5,
	'Toul Kork': 4,
	'Daun Penh': 6,
	'Chamkar Mon': 5,
	'Mean Chey': 6,
	'Russei Keo': 5,
	'Prek Pnov': 7,
	'Chbar Ampov': 8
}

export const DISTRICTS = Object.keys(DISTRICT_FEES) as readonly string[]

/** Travel fee for a location. Matches a known district name inside the string. */
export function districtFee(location = ''): number {
	if (!location) return 5
	for (const [name, fee] of Object.entries(DISTRICT_FEES)) {
		if (location.includes(name)) return fee
	}
	return 5
}

export interface SavedAddress {
	icon: 'home' | 'office'
	labelKh: string
	address: string
}
