<script lang="ts">
	import './layout.css'
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import StepProgress from '$lib/StepProgress.svelte'
	import { CURRENT_USER, APP_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from '$lib/data'
	import { serviceQuery } from '$lib/store'

	let { children } = $props()

	const stepRoutes = ['/', '/describe-problem', '/location', '/schedule', '/estimate']
	const currentStep = $derived(stepRoutes.indexOf(page.url.pathname))
	const isBookingFlow = $derived(currentStep >= 0)

	const bookingPaths = ['/describe-problem', '/location', '/schedule', '/estimate', '/confirmation']
	const isServicesActive = $derived(page.url.pathname === '/' || bookingPaths.includes(page.url.pathname))
	const isHistoryActive = $derived(page.url.pathname === '/history')

	function onSearchInput() {
		if (page.url.pathname !== '/') goto('/')
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-surface">
	<!-- Navbar -->
	<header class="bg-white border-b border-gray-100 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
			<a href="/" class="text-primary font-bold text-lg shrink-0 tracking-tight">{APP_NAME}</a>

			<nav class="flex items-center gap-1 flex-1">
				<a href="/" class="px-3 py-1.5 text-sm font-medium transition-colors {isServicesActive ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text rounded-md'}">Services</a>
				<a href="/history" class="px-3 py-1.5 text-sm font-medium transition-colors {isHistoryActive ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text rounded-md'}">My Bookings</a>
				<a href="mailto:{SUPPORT_EMAIL}" class="px-3 py-1.5 text-sm font-medium text-text-muted hover:text-text rounded-md transition-colors">Support</a>
			</nav>

			<div class="flex items-center gap-3">
				<div class="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-sm w-48 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
					</svg>
					<input
						type="search"
						bind:value={$serviceQuery}
						oninput={onSearchInput}
						placeholder="Search services..."
						class="flex-1 min-w-0 bg-transparent text-text placeholder:text-text-muted focus:outline-none"
					/>
				</div>
				<a href="/history" class="p-1.5 text-text-muted hover:text-text rounded-full hover:bg-gray-100 transition-colors" title="Booking updates">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
					</svg>
				</a>
				<div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold select-none" title={CURRENT_USER.displayName}>{CURRENT_USER.initials}</div>
			</div>
		</div>
	</header>

	<!-- Page content -->
	<main class="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
		{#if isBookingFlow}
			<StepProgress current={currentStep} />
		{/if}
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="bg-white border-t border-gray-100 mt-auto">
		<div class="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
			<div>
				<p class="font-semibold text-text text-sm">{APP_NAME}</p>
				<p class="text-xs text-text-muted mt-0.5">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
			</div>
			<div class="flex gap-6">
				<a href="tel:{SUPPORT_PHONE.replace(/\s/g, '')}" class="text-sm text-text-muted hover:text-text transition-colors">{SUPPORT_PHONE}</a>
				<a href="mailto:{SUPPORT_EMAIL}" class="text-sm text-text-muted hover:text-text transition-colors">Contact Us</a>
			</div>
		</div>
	</footer>
</div>
