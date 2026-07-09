<script lang="ts">
	import { goto } from '$app/navigation'
	import { booking, EMPTY_BOOKING } from '$lib/store'
	import { assignTechnician } from '$lib/data'
	import TechnicianCard from '$lib/TechnicianCard.svelte'

	const svc = $derived($booking.service)
	const bookingId = $derived($booking.bookingId)
	const technician = $derived(assignTechnician($booking.service?.id, $booking.district))

	function formatDate(date: string) {
		if (!date) return ''
		const [y, m, d] = date.split('-').map(Number)
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
		return `${months[m - 1]} ${String(d).padStart(2, '0')}, ${y}`
	}

	function bookAnother() {
		booking.set({ ...EMPTY_BOOKING })
		goto('/')
	}
</script>

<div class="flex flex-col items-center justify-center py-16 text-center space-y-6 max-w-lg mx-auto">
	<!-- Success icon -->
	<div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
		<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-primary" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
		</svg>
	</div>

	<div class="space-y-1">
		<h1 class="text-3xl font-bold text-primary">ការកក់ត្រូវបានបញ្ជាក់!</h1>
		<p class="text-text-muted text-sm">Booking Confirmed</p>
		{#if bookingId}
			<p class="text-xs text-text-muted mt-1">Reference #<span class="font-semibold text-text">{bookingId}</span></p>
		{/if}
	</div>

	<p class="text-text-muted leading-relaxed text-sm">
		We'll send a technician to your location at the scheduled time. You'll receive a confirmation message shortly.
	</p>

	<!-- Booking details card -->
	{#if svc}
		<div class="w-full bg-white rounded-2xl border border-border overflow-hidden text-left">
			<div class="bg-primary px-5 py-4">
				<p class="text-xs text-white/70">សេចក្ដីសង្ខេបនៃការកក់</p>
				<h3 class="font-semibold text-white mt-0.5">Booking Summary</h3>
			</div>
			<div class="p-5 space-y-3">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z"/>
						</svg>
					</div>
					<div>
						<p class="text-xs text-text-muted">សេវាកម្ម / Service</p>
						<p class="text-sm font-semibold text-text">{svc.nameKhmer}</p>
						<p class="text-xs text-text-muted">{svc.name}</p>
					</div>
				</div>
				{#if $booking.location}
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
							</svg>
						</div>
						<div>
							<p class="text-xs text-text-muted">ទីតាំង / Location</p>
							<p class="text-sm font-medium text-text">{$booking.location}</p>
						</div>
					</div>
				{/if}
				{#if $booking.date}
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5"/>
							</svg>
						</div>
						<div>
							<p class="text-xs text-text-muted">ពេលវេលា / Date & Time</p>
							<p class="text-sm font-medium text-text">{formatDate($booking.date)} · {$booking.time}</p>
						</div>
					</div>
				{/if}
				{#if $booking.estimate}
					<div class="border-t border-border pt-3 flex justify-between items-center">
						<p class="text-sm text-text-muted">ស្មានតម្លៃ / Estimated Total</p>
						<p class="text-base font-bold text-primary">${$booking.estimate.toFixed(2)}</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Technician card -->
	<TechnicianCard {technician} label="អ្នកបច្ចេកទេស / Your Technician" />

	<button
		onclick={bookAnother}
		class="w-full py-3 px-8 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer"
	>
		<span class="block text-[10px] opacity-70 mb-0.5">កក់សេវាកម្មថ្មី</span>
		Book Another Service
	</button>
</div>
