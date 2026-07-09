<script lang="ts">
	import type { Technician } from './data'

	let { technician, label = 'អ្នកបច្ចេកទេសសំណើប / Your Technician' }: {
		technician: Technician
		label?: string
	} = $props()
</script>

<div class="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
	<div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
		{technician.initials}
	</div>
	<div class="flex-1 min-w-0">
		<p class="text-xs text-text-muted">{label}</p>
		<p class="text-sm font-bold text-text">{technician.name}</p>
		<p class="text-xs text-text-muted">{technician.nameLabel}</p>
		<div class="flex items-center gap-1 mt-0.5">
			<svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
			</svg>
			<span class="text-xs text-text-muted font-medium">{technician.rating} ({technician.jobs}+ jobs)</span>
		</div>
	</div>
	<a
		href="tel:{technician.phone.replace(/\s/g, '')}"
		class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
		title="Call {technician.nameLabel}"
	>
		<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
		</svg>
		Call
	</a>
</div>
