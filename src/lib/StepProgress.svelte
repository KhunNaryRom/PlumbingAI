<script lang="ts">
	import { STEPS } from './types'

	let { current = 0 }: { current: number } = $props()
</script>

<nav class="flex items-center justify-center gap-0 px-4 py-6 max-w-3xl mx-auto">
	{#each STEPS as step, i}
		<div class="flex items-center">
			<button
				disabled
				class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors {i <= current ? 'text-primary' : 'text-text-muted'}"
			>
				<span
					class="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold {i < current
						? 'bg-primary text-white'
						: i === current
							? 'bg-primary text-white ring-2 ring-primary/30'
							: 'bg-border text-text-muted'}"
				>
					{#if i < current}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
							<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
						</svg>
					{:else}
						{i + 1}
					{/if}
				</span>
				<span class="hidden sm:inline">{step}</span>
			</button>
			{#if i < STEPS.length - 1}
				<div class="w-8 sm:w-16 h-0.5 mx-1 rounded {i < current ? 'bg-primary' : 'bg-border'}"></div>
			{/if}
		</div>
	{/each}
</nav>
