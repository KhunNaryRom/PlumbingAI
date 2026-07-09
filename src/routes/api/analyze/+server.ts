import { json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'

export interface Analysis {
	severity: 'low' | 'medium' | 'high'
	suggestedUrgency: 'routine' | 'urgent' | 'emergency'
	refinedDescription: string
	likelyCauses: string[]
	recommendation: string
	source: 'ai' | 'heuristic'
}

const ANALYSIS_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		severity: { type: 'string', enum: ['low', 'medium', 'high'] },
		suggestedUrgency: { type: 'string', enum: ['routine', 'urgent', 'emergency'] },
		refinedDescription: {
			type: 'string',
			description: 'A clear, professional 1-3 sentence rewrite of the customer problem for the technician.'
		},
		likelyCauses: { type: 'array', items: { type: 'string' } },
		recommendation: { type: 'string', description: 'One-sentence next-step recommendation for the customer.' }
	},
	required: ['severity', 'suggestedUrgency', 'refinedDescription', 'likelyCauses', 'recommendation']
} as const

// Keyword-driven fallback so the feature works with no API key configured.
const EMERGENCY_WORDS = ['overflow', 'flood', 'sewage', 'burst', 'leak everywhere', ' លិច', 'ហៀរ', 'បន្ទាន់']
const URGENT_WORDS = ['clog', 'block', 'smell', 'slow drain', 'backup', 'ស្ទះ', 'ក្លិន', 'ស្អុយ']



function heuristicAnalysis(problem: string, serviceName: string): Analysis {
	const text = problem.toLowerCase()
	const isEmergency = EMERGENCY_WORDS.some((w) => text.includes(w.toLowerCase()))
	const isUrgent = URGENT_WORDS.some((w) => text.includes(w.toLowerCase()))

	const severity: Analysis['severity'] = isEmergency ? 'high' : isUrgent ? 'medium' : 'low'
	const suggestedUrgency: Analysis['suggestedUrgency'] = isEmergency
		? 'emergency'
		: isUrgent
			? 'urgent'
			: 'routine'

	const refined = problem.trim()
		? `${serviceName}: ${problem.trim().replace(/\s+/g, ' ')}`
		: `${serviceName} requested. Customer did not provide problem details.`

	return {
		severity,
		suggestedUrgency,
		refinedDescription: refined,
		likelyCauses: isEmergency
			? ['Blockage causing overflow', 'Damaged or full septic tank', 'Broken seal or pipe']
			: isUrgent
				? ['Partial pipe obstruction', 'Grease or debris buildup', 'Venting issue']
				: ['Routine wear', 'Scheduled maintenance due'],
		recommendation: isEmergency
			? 'Book immediate emergency response and stop using the fixture until inspected.'
			: isUrgent
				? 'Same-day service recommended to prevent the issue from worsening.'
				: 'A routine scheduled visit is sufficient.',
		source: 'heuristic'
	}
}



type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
const SUPPORTED_MEDIA: ImageMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function toImageBlock(dataUrl: string) {
	const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl)
	if (!match) return null
	const mediaType = match[1] as ImageMediaType
	if (!SUPPORTED_MEDIA.includes(mediaType)) return null
	return {
		type: 'image' as const,
		source: { type: 'base64' as const, media_type: mediaType, data: match[2] }
	}
}

export async function POST({ request }) {
	const body = await request.json().catch(() => ({}))
	const problem: string = typeof body?.problem === 'string' ? body.problem : ''
	const serviceName: string = typeof body?.serviceName === 'string' ? body.serviceName : 'Plumbing service'
	const photos: string[] = Array.isArray(body?.photos) ? body.photos.slice(0, 3) : []
//////////////____________92-129______________////////////////////
	const apiKey = env.ANTHROPIC_API_KEY
	if (!apiKey) {
		return json(heuristicAnalysis(problem, serviceName))
	}

	try {
		const { default: Anthropic } = await import('@anthropic-ai/sdk')
		const client = new Anthropic({ apiKey })

		const imageBlocks = photos.map(toImageBlock).filter((b): b is NonNullable<typeof b> => b !== null)

		const message = await client.messages.create({
			model: 'claude-opus-4-8',
			max_tokens: 2000,
			thinking: { type: 'adaptive' },
			system:
				'You are a triage assistant for a plumbing and sanitation company in Phnom Penh, Cambodia. ' +
				'Customers describe problems in Khmer and/or English. Assess severity, recommend an urgency level, ' +
				'rewrite the problem clearly for the field technician, and list likely causes. Be concise and practical.',
			output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
			messages: [
				{
					role: 'user',
					content: [
						...imageBlocks,
						{
							type: 'text',
							text: `Service requested: ${serviceName}\nCustomer problem description:\n"""${problem || '(none provided)'}"""`
						}
					]
				}
			]
		})

		const textBlock = message.content.find((b) => b.type === 'text')
		const parsed = textBlock && 'text' in textBlock ? JSON.parse(textBlock.text) : null
		if (!parsed) throw new Error('No structured output returned')

		return json({ ...parsed, source: 'ai' } satisfies Analysis)
	} catch (e) {
		console.error('AI analysis failed, using heuristic fallback:', e)
		return json(heuristicAnalysis(problem, serviceName))
	}
}
