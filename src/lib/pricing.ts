export const KHR_RATE = 4100
export const PARTS_FACTOR = 0.5
export const DEFAULT_DISTANCE_FEE = 5

// Urgency drives a real service surcharge: routine is free, same-day and
// emergency response cost progressively more.
export const URGENCY_SURCHARGE = {
	routine: 0,
	urgent: 5,
	emergency: 15
} as const

export type Urgency = keyof typeof URGENCY_SURCHARGE

export interface EstimateOptions {
	urgency?: Urgency
	distanceFee?: number
}

export interface Estimate {
	base: number
	distance: number
	urgencyFee: number
	parts: number
	/** distance + urgency, kept for compact summaries that show one combined line */
	surcharge: number
	total: number
}

function round2(n: number) {
	return Math.round(n * 100) / 100
}

export function calcTotal(basePrice: number, opts: EstimateOptions = {}): Estimate {
	const base = basePrice || 0
	const urgency = opts.urgency ?? 'urgent'
	const distance = opts.distanceFee ?? DEFAULT_DISTANCE_FEE
	const urgencyFee = URGENCY_SURCHARGE[urgency] ?? URGENCY_SURCHARGE.urgent
	const parts = round2(base * PARTS_FACTOR)
	const total = round2(base + distance + urgencyFee + parts)
	return { base, distance, urgencyFee, parts, surcharge: round2(distance + urgencyFee), total }
}

export function toKHR(usd: number) {
	return Math.round(usd * KHR_RATE).toLocaleString()
}
