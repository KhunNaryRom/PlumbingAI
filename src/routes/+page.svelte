<script lang="ts">
	import { goto } from '$app/navigation'
	import { SERVICES, type Service } from '$lib/types'
	import { booking, serviceQuery } from '$lib/store'
	import { calcTotal } from '$lib/pricing'
	import { districtFee } from '$lib/data'

	const basePrice = $derived($booking.service?.price ?? 0)
	const estimate = $derived(calcTotal(basePrice, { urgency: $booking.urgency, distanceFee: districtFee($booking.district) }))

	const filteredServices = $derived.by(() => {
		const q = $serviceQuery.trim().toLowerCase()
		if (!q) return SERVICES
		return SERVICES.filter(
			(s) =>
				s.name.toLowerCase().includes(q) ||
				s.nameKhmer.includes(q) ||
				s.description.toLowerCase().includes(q)
		)
	})

	function select(service: Service) {
		booking.update(s => ({ ...s, service }))
	}

	function bookEmergency() {
		booking.update(s => ({ ...s, urgency: 'emergency' }))
		if ($booking.service) goto('/describe-problem')
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
	<!-- Left: content -->
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-bold text-primary">ជ្រើសរើសសេវាកម្ម</h1>
			<p class="text-text-muted mt-0.5">Select Service</p>
		</div>

		<!-- Emergency banner -->
		<div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
			<div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
				</svg>
			</div>
			<div class="flex-1 min-w-0">
				<p class="font-semibold text-amber-800 text-sm">សេវាបន្ទាន់ (២៤/៧)</p>
				<p class="text-xs text-amber-700 mt-0.5">24/7 Emergency Response: Rapid deployment for critical blockages and overflows. Additional fees apply.</p>
			</div>
			<button onclick={bookEmergency} class="shrink-0 px-3 py-1.5 bg-amber-800 text-white text-xs font-semibold rounded-lg hover:bg-amber-900 transition-colors cursor-pointer" title="Book emergency response">
				{$booking.service ? 'ចុចទំនួលខុសសេវ' : 'ជ្រើសសេវាមុន'}
			</button>
		</div>

		<!-- Service cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{#each filteredServices as service}
				{@const selected = $booking.service?.id === service.id}
				<button
					onclick={() => select(service)}
					class="relative flex flex-col p-5 rounded-2xl border-2 bg-white text-left transition-all duration-150 cursor-pointer {selected ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-primary/40 hover:shadow-sm'}"
				>
					<!-- Top row: icon + price -->
					<div class="flex items-start justify-between mb-4">
						<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
							{#if service.id === 'drain-pump'}
								<svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z"/>
								</svg>
							{:else if service.id === 'clog-removal'}
								<svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
									<circle cx="12" cy="12" r="9" stroke-width="1.5"/>
								</svg>
							{:else if service.id === 'maintenance'}
								<svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L3 3.75l1.5-1.5 3.75 1.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
								</svg>
							{:else}
								<svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"/>
								</svg>
							{/if}
						</div>
						<span class="text-base font-bold text-text">${service.price}.00</span>
					</div>

					<h3 class="font-bold text-text text-base leading-tight">{service.nameKhmer}</h3>
					<p class="text-sm text-text-muted mt-0.5">{service.name}</p>
					<p class="text-xs text-text-muted mt-2 flex-1">{service.description}</p>

					{#if service.badge}
						<div class="mt-3">
							{#if service.badge.type === 'ai'}
								<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
									<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
									</svg>
									{service.badge.label}
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
									<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
									</svg>
									{service.badge.label}
								</span>
							{/if}
						</div>
					{/if}
				</button>
			{:else}
				<div class="sm:col-span-2 text-center py-10 text-sm text-text-muted">
					No services match "{$serviceQuery}".
				</div>
			{/each}
		</div>
	</div>

	<!-- Right: Booking Summary -->
	<aside class="sticky top-20">
		<div class="bg-white rounded-2xl border border-border overflow-hidden">
			<div class="px-5 py-4 border-b border-border">
				<p class="text-xs text-text-muted">សេចក្ដីសង្ខេបនៃការកក់</p>
				<h3 class="font-semibold text-text mt-0.5">Booking Summary</h3>
			</div>

			<div class="px-5 py-4 space-y-4 border-b border-border">
				<!-- Service row -->
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
						</svg>
					</div>
					<div>
						<p class="text-xs text-text-muted">សេវាកម្ម (Service)</p>
						{#if $booking.service}
							<p class="text-sm font-medium text-text">{$booking.service.name}</p>
						{:else}
							<p class="text-sm text-text-muted italic">No service selected</p>
						{/if}
					</div>
				</div>

				<!-- Location row -->
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
						</svg>
					</div>
					<div>
						<p class="text-xs text-text-muted">ទីតាំង (Location)</p>
						<p class="text-sm text-text-muted italic">Select in next step</p>
					</div>
				</div>

				<!-- Time row -->
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<div>
						<p class="text-xs text-text-muted">ពេលវេលា (Time)</p>
						<p class="text-sm text-text-muted italic">Schedule in next step</p>
					</div>
				</div>
			</div>

			<!-- Price breakdown -->
			<div class="px-5 py-4 space-y-2 border-b border-border">
				<div class="flex justify-between text-sm">
					<span class="text-text-muted">Base Fee</span>
					<span class="text-text">${basePrice.toFixed(2)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-text-muted">Surcharge + Parts</span>
					<span class="text-text">${(estimate.surcharge + estimate.parts).toFixed(2)}</span>
				</div>
				<div class="border-t border-dashed border-gray-200 pt-2 mt-1 flex justify-between font-bold">
					<span class="text-text">Estimated Total</span>
					<span class="text-primary text-lg">${estimate.total.toFixed(2)}</span>
				</div>
			</div>

			<div class="p-4">
				<button
					onclick={() => $booking.service && goto('/describe-problem')}
					disabled={!$booking.service}
					class="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
				>
					<span class="block text-[10px] opacity-70 mb-0.5">ច្រើនទៀត</span>
					<span class="text-xs tracking-widest">NEXT STEP</span>
				</button>
			</div>
		</div>
	</aside>
</div>
