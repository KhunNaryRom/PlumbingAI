<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import type { Booking } from '$lib/db/schema'

	let bookings = $state<Booking[]>([])
	let loading = $state(true)
	let error = $state('')
	let savedEstimates = $state<any[]>([])

	onMount(async () => {
		try {
			const res = await fetch('/api/bookings')
			if (!res.ok) throw new Error('Could not load bookings')
			bookings = await res.json()
		} catch (e) {
			error = (e as Error).message
		} finally {
			loading = false
		}
		try {
			savedEstimates = JSON.parse(localStorage.getItem('sm_saved_estimates') || '[]')
		} catch {
			savedEstimates = []
		}
	})

	function removeEstimate(i: number) {
		savedEstimates = savedEstimates.filter((_, idx) => idx !== i)
		try {
			localStorage.setItem('sm_saved_estimates', JSON.stringify(savedEstimates))
		} catch {
			/* ignore */
		}
	}

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	function formatDate(date: string) {
		if (!date) return ''
		const [y, m, d] = date.split('-').map(Number)
		return `${months[m - 1]} ${String(d).padStart(2, '0')}, ${y}`
	}
	function formatSavedAt(iso: string) {
		const dt = new Date(iso)
		return `${months[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`
	}

	function statusClasses(status: string) {
		switch (status) {
			case 'completed':
			case 'confirmed':
				return 'bg-primary/10 text-primary'
			case 'cancelled':
				return 'bg-red-50 text-red-600'
			default:
				return 'bg-amber-50 text-amber-700'
		}
	}
</script>

<div class="max-w-3xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-primary">ការកក់របស់ខ្ញុំ</h1>
			<p class="text-text-muted mt-0.5">My Bookings</p>
		</div>
		<button onclick={() => goto('/')} class="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors cursor-pointer">
			+ New Booking
		</button>
	</div>

	{#if loading}
		<div class="text-center py-16 text-text-muted text-sm">Loading your bookings…</div>
	{:else if error}
		<div class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
	{:else if bookings.length === 0}
		<div class="bg-white rounded-2xl border border-border p-10 text-center">
			<p class="text-text-muted text-sm">You don't have any bookings yet.</p>
			<button onclick={() => goto('/')} class="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium cursor-pointer">Book a service</button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each bookings as b}
				<div class="bg-white rounded-2xl border border-border p-5">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<h3 class="font-semibold text-text">{b.serviceName}</h3>
								<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase {statusClasses(b.status)}">{b.status}</span>
							</div>
							<p class="text-xs text-text-muted mt-0.5">Reference #{b.id}</p>
						</div>
						{#if b.estimatedPrice != null}
							<p class="text-lg font-bold text-primary shrink-0">${b.estimatedPrice.toFixed(2)}</p>
						{/if}
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
						<div class="flex items-center gap-2 text-text-muted">
							<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5"/></svg>
							<span class="text-text">{formatDate(b.date)} · {b.time}</span>
						</div>
						<div class="flex items-center gap-2 text-text-muted">
							<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
							<span class="text-text truncate">{b.location}</span>
						</div>
						{#if b.technicianName}
							<div class="flex items-center gap-2 text-text-muted">
								<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
								<span class="text-text">{b.technicianName}</span>
							</div>
						{/if}
						<div class="flex items-center gap-2 text-text-muted">
							<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
							<span class="text-text capitalize">{b.urgency}</span>
						</div>
					</div>

					{#if b.problem}
						<p class="text-sm text-text-muted mt-3 pt-3 border-t border-gray-100">{b.problem}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if savedEstimates.length}
		<div class="pt-2">
			<h2 class="text-sm font-semibold text-text mb-2">រក្សាទុកការប៉ាន់ស្មាន / Saved Estimates</h2>
			<div class="space-y-2">
				{#each savedEstimates as est, i}
					<div class="bg-white rounded-xl border border-dashed border-border p-4 flex items-center justify-between gap-3">
						<div class="min-w-0">
							<p class="text-sm font-medium text-text truncate">{est.serviceName}</p>
							<p class="text-xs text-text-muted">
								{#if est.date}{formatDate(est.date)}{#if est.time} · {est.time}{/if} · {/if}Saved {formatSavedAt(est.savedAt)}
							</p>
						</div>
						<div class="flex items-center gap-3 shrink-0">
							<p class="text-base font-bold text-primary">${Number(est.total).toFixed(2)}</p>
							<button onclick={() => removeEstimate(i)} class="p-1 text-text-muted hover:text-red-500 transition-colors cursor-pointer" title="Remove" aria-label="Remove saved estimate">
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
