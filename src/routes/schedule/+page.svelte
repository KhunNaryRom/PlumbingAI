<script lang="ts">
	import { goto } from '$app/navigation'
	import { booking } from '$lib/store'
	import { calcTotal } from '$lib/pricing'
	import { assignTechnician, districtFee } from '$lib/data'
	import TechnicianCard from '$lib/TechnicianCard.svelte'

	const today = new Date()
	const dayNamesKh = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']
	const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December']
	const monthNamesKh = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
		'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']

	let currentMonth = $state(today.getMonth())
	let currentYear = $state(today.getFullYear())
	let selectedDate = $state($booking.date || '')
	let selectedTime = $state($booking.time || '')

	const timeSlots = [
		{ time: '08:00 AM', duration: '~1.5 hrs' },
		{ time: '10:30 AM', duration: '~2 hrs' },
		{ time: '01:00 PM', duration: '~1 hr' },
		{ time: '03:30 PM', duration: '~1.5 hrs' },
		{ time: '05:00 PM', duration: '~1 hr' }
	]

	let bookedSlots = $state<string[]>([])
	let loadingSlots = $state(false)

	const technician = $derived(assignTechnician($booking.service?.id, $booking.district))

	// Fetch real slot availability from the API whenever the chosen date changes.
	$effect(() => {
		const date = selectedDate
		if (!date) {
			bookedSlots = []
			return
		}
		let cancelled = false
		loadingSlots = true
		fetch(`/api/bookings?date=${encodeURIComponent(date)}`)
			.then((r) => (r.ok ? r.json() : { bookedSlots: [] }))
			.then((data) => {
				if (!cancelled) bookedSlots = data.bookedSlots ?? []
			})
			.catch(() => {
				if (!cancelled) bookedSlots = []
			})
			.finally(() => {
				if (!cancelled) loadingSlots = false
			})
		return () => {
			cancelled = true
		}
	})

	function todayStr() {
		return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
	}

	function bookExpress() {
		currentMonth = today.getMonth()
		currentYear = today.getFullYear()
		selectedDate = todayStr()
		booking.update((s) => ({ ...s, urgency: 'emergency' }))
		const free = timeSlots.find((slot) => !bookedSlots.includes(slot.time))
		if (free) selectedTime = free.time
	}

	function daysInMonth(month: number, year: number) {
		return new Date(year, month + 1, 0).getDate()
	}

	function firstDayOfMonth(month: number, year: number) {
		return new Date(year, month, 1).getDay()
	}

	const calendarDays = $derived.by<(number | null)[]>(() => {
		const days: (number | null)[] = []
		const totalDays = daysInMonth(currentMonth, currentYear)
		const startDay = firstDayOfMonth(currentMonth, currentYear)
		for (let i = 0; i < startDay; i++) days.push(null)
		for (let i = 1; i <= totalDays; i++) days.push(i)
		return days
	})

	function prevMonth() {
		if (currentMonth === 0) { currentMonth = 11; currentYear-- } else { currentMonth-- }
	}

	function nextMonth() {
		if (currentMonth === 11) { currentMonth = 0; currentYear++ } else { currentMonth++ }
	}

	function selectDate(day: number) {
		selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
	}

	function isPast(day: number) {
		const d = new Date(currentYear, currentMonth, day)
		return d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
	}

	function isSelected(day: number) {
		return selectedDate === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
	}

	function formatDisplayDate() {
		if (!selectedDate) return null
		const [y, m, d] = selectedDate.split('-').map(Number)
		return `${monthNames[m - 1]} ${String(d).padStart(2, '0')}, ${y}`
	}

	function submit() {
		if (!selectedDate || !selectedTime) return
		booking.update(s => ({ ...s, date: selectedDate, time: selectedTime }))
		goto('/estimate')
	}

	const basePrice = $derived($booking.service?.price ?? 0)
	const estimate = $derived(calcTotal(basePrice, { urgency: $booking.urgency, distanceFee: districtFee($booking.district) }))
</script>

{#if !$booking.service || !$booking.location}
	<div class="text-center py-16">
		<p class="text-text-muted">Missing booking details. Please start from the beginning.</p>
		<button onclick={() => goto('/')} class="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium cursor-pointer">Go back</button>
	</div>
{:else}
<div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
	<!-- Left: calendar -->
	<div class="space-y-5">
		<div>
			<h1 class="text-2xl font-bold text-primary">ជ្រើសរើសថ្ងៃ និងម៉ោង</h1>
			<p class="text-text-muted mt-0.5">Pick Date &amp; Time</p>
		</div>

		<!-- Express banner -->
		<div class="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
			<div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
				<svg class="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
				</svg>
			</div>
			<div class="flex-1">
				<p class="text-sm font-semibold text-amber-800">មានសេវាស្ទាន់ ​ ​ ​</p>
				<p class="text-xs text-amber-700">Express slots available for same-day emergency pump &amp; clean.</p>
			</div>
			<button onclick={bookExpress} class="shrink-0 px-3 py-1.5 border border-amber-600 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
				Book Now
			</button>
		</div>

		<!-- Calendar -->
		<div class="bg-white rounded-2xl border border-border p-5 space-y-4">
			<!-- Month nav -->
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-semibold text-text">ឆ្នាំ {monthNamesKh[currentMonth]} {currentYear}</p>
					<p class="text-xs text-text-muted">{monthNames[currentMonth]} {currentYear}</p>
				</div>
				<div class="flex items-center gap-1">
					<button onclick={prevMonth} aria-label="Previous month" class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
						<svg class="w-4 h-4 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="m15 18-6-6 6-6"/>
						</svg>
					</button>
					<button onclick={nextMonth} aria-label="Next month" class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
						<svg class="w-4 h-4 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="m9 18 6-6-6-6"/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Day headers -->
			<div class="grid grid-cols-7 text-center">
				{#each dayNamesKh as d, i}
					<div class="py-1">
						<p class="text-[10px] font-medium text-text-muted">{d}</p>
						<p class="text-[9px] text-text-muted/60">{dayNamesEn[i]}</p>
					</div>
				{/each}
			</div>

			<!-- Days grid -->
			<div class="grid grid-cols-7 gap-0.5 text-center">
				{#each calendarDays as day}
					{#if day !== null}
						{@const past = isPast(day)}
						{@const sel = isSelected(day)}
						<button
							onclick={() => !past && selectDate(day)}
							disabled={past}
							class="py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
								{sel ? 'bg-primary text-white' : past ? 'text-gray-300 cursor-not-allowed' : 'text-text hover:bg-primary/10'}"
						>
							{day}
						</button>
					{:else}
						<div></div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Time slots -->
		<div class="bg-white rounded-2xl border border-border p-5 space-y-3">
			<div>
				<p class="text-sm font-semibold text-text">
					<svg class="w-4 h-4 inline text-primary mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
					</svg>
					ជ្រើសរើសសម្ពត់ <span class="text-text-muted font-normal text-xs">(Select Time)</span>
				</p>
				{#if !selectedDate}
					<p class="text-xs text-text-muted mt-1">Select a date to see available time slots.</p>
				{:else if loadingSlots}
					<p class="text-xs text-text-muted mt-1">Checking availability…</p>
				{/if}
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
				{#each timeSlots as slot}
					{@const booked = bookedSlots.includes(slot.time)}
					{@const sel = selectedTime === slot.time}
					<button
						onclick={() => !booked && (selectedTime = slot.time)}
						disabled={booked}
						class="flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all cursor-pointer
							{sel ? 'border-primary bg-primary/5' : booked ? 'border-border bg-gray-50 opacity-60 cursor-not-allowed' : 'border-border hover:border-primary/40'}"
					>
						<p class="text-sm font-semibold text-text">{slot.time}</p>
						{#if booked}
							<p class="text-[10px] text-red-500 mt-0.5">មិនទំនេរ</p>
						{:else if slot.duration}
							<p class="text-[10px] text-text-muted mt-0.5 flex items-center gap-0.5">
								<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
								</svg>
								{slot.duration}
							</p>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Bottom nav -->
		<div class="flex gap-3">
			<button
				onclick={() => goto('/location')}
				class="flex-1 py-3 px-6 rounded-xl border-2 border-border text-text font-medium text-sm hover:bg-gray-50 transition-colors cursor-pointer"
			>
				ត្រឡប់ក្រោយ (Back)
			</button>
			<button
				onclick={submit}
				disabled={!selectedDate || !selectedTime}
				class="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
			>
				ច្រើនទៀត (Next Step)
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="m9 18 6-6-6-6"/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Right: Booking summary sidebar -->
	<aside class="sticky top-20 space-y-4">
		<!-- Booking Summary card -->
		<div class="bg-white rounded-2xl border border-border overflow-hidden">
			<!-- Teal header -->
			<div class="bg-primary px-5 py-4">
				<p class="text-xs text-white/70">សេចក្ដីសង្ខេបនៃការកក់</p>
				<h3 class="font-semibold text-white mt-0.5">Booking Summary</h3>
			</div>

			<div class="p-4 space-y-3">
				<!-- Service -->
				{#if $booking.service}
					<div class="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
						<div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z"/>
							</svg>
						</div>
						<div>
							<p class="text-xs text-text-muted">សេវាកម្ម</p>
							<p class="text-sm font-semibold text-text">{$booking.service.nameKhmer}</p>
							<p class="text-xs text-text-muted">{$booking.service.name}</p>
						</div>
					</div>
				{/if}

				<!-- Date -->
				<div class="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
					<div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
						<svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5"/>
						</svg>
					</div>
					<div>
						<p class="text-xs text-text-muted">ថ្ងៃ</p>
						{#if formatDisplayDate()}
							<p class="text-sm font-semibold text-text">{formatDisplayDate()}</p>
						{:else}
							<p class="text-sm text-text-muted italic">No date selected</p>
						{/if}
					</div>
				</div>

				<!-- Time -->
				<div class="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
					<div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
						<svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<div>
						<p class="text-xs text-text-muted">ម៉ោង</p>
						{#if selectedTime}
							<p class="text-sm font-semibold text-text">{selectedTime}</p>
						{:else}
							<p class="text-sm text-text-muted italic">មិនទាន់ជ្រើស / No time selected</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Price -->
			<div class="px-4 py-3 border-t border-border space-y-1.5">
				<div class="flex justify-between text-sm">
					<span class="text-text-muted">ថ្លៃសេវា (Base Fee)</span>
					<span class="text-text">${basePrice.toFixed(2)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-text-muted">ថ្លៃបន្ថែម + សម្ភារ</span>
					<span class="text-text">${(estimate.surcharge + estimate.parts).toFixed(2)}</span>
				</div>
				<div class="border-t border-dashed border-gray-200 pt-1.5 flex justify-between font-bold">
					<span class="text-text">ស្មានតម្លៃ (Estimate)</span>
					<span class="text-primary text-lg">${estimate.total.toFixed(2)}</span>
				</div>
			</div>

			<!-- AI note -->
			<div class="mx-4 mb-4 flex gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
				<svg class="w-4 h-4 text-primary shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
				</svg>
				<p class="text-xs text-primary/80">Includes preliminary AI diagnostic check.</p>
			</div>
		</div>

		<TechnicianCard {technician} label="អ្នកបច្ចេកទេសសំណើប / Your Technician" />
	</aside>
</div>
{/if}
