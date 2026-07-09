<script lang="ts">
  import { goto } from "$app/navigation";
  import { booking } from "$lib/store";
  import { calcTotal } from "$lib/pricing";
  import { URGENCY_OPTIONS, districtFee } from "$lib/data";
  import type { Analysis } from "../api/analyze/+server";

  let problem = $state($booking.problem || "");
  let photos = $state<string[]>([...$booking.photos]);

  let analyzing = $state(false);
  let analysis = $state<Analysis | null>(null);
  let analyzeError = $state("");

  const urgencyOptions = URGENCY_OPTIONS;

  // Downscale to a small JPEG thumbnail so photos can be persisted with the
  // booking without shipping multi-MB data URLs.
  function downscale(file: File, maxEdge = 800): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("canvas unsupported"));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files).slice(0, 5 - photos.length);
    input.value = "";
    for (const file of files) {
      try {
        photos = [...photos, await downscale(file)];
      } catch {
        /* skip unreadable image */
      }
    }
  }

  function removePhoto(i: number) {
    photos = photos.filter((_, idx) => idx !== i);
  }

  async function analyze() {
    if (!$booking.service || analyzing) return;
    analyzing = true;
    analyzeError = "";
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: $booking.service.id,
          serviceName: $booking.service.name,
          problem,
          photos,
        }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      analysis = await res.json();
      if (analysis)
        booking.update((s) => ({ ...s, urgency: analysis!.suggestedUrgency }));
    } catch (e) {
      analyzeError = (e as Error).message;
    } finally {
      analyzing = false;
    }
  }

  function applyRefined() {
    if (analysis) problem = analysis.refinedDescription;
  }

  function submit() {
    if (!problem.trim() || !$booking.service) return;
    booking.update((s) => ({ ...s, problem: problem.trim(), photos }));
    goto("/location");
  }
</script>

{#if !$booking.service}
  <div class="text-center py-16">
    <p class="text-text-muted">No service selected.</p>
    <button
      onclick={() => goto("/")}
      class="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium cursor-pointer"
      >Go back</button
    >
  </div>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
    <!-- Left: content -->
    <div class="space-y-5">
      <div>
        <h1 class="text-2xl font-bold text-primary">ពិពណ៌នាបញ្ហាបស់អ្នក</h1>
        <p class="text-text-muted mt-0.5">Describe Your Problem</p>
        <p class="text-sm text-text-muted mt-1">
          ផ្តល់ព័ត៌មានលម្អិត និងរូបថតសម្រាប់ការប៉ាន់ស្មានឆ្លាតវៃត្រឹមត្រូវ។។
        </p>
        <p class="text-xs text-text-muted">
          Provide details and photos for an accurate smart estimate.
        </p>
      </div>

      <!-- Problem Details -->
      <div class="bg-white rounded-2xl border border-border overflow-hidden">
        <div
          class="px-5 py-4 border-b border-border flex items-center justify-between"
        >
          <div>
            <p class="text-sm font-semibold text-text">
              ព័ត៌មានលំអិតពីបញ្ហា ({$booking.service.nameKhmer})
            </p>
            <p class="text-xs text-text-muted mt-0.5">Problem Details</p>
          </div>
          <button
            onclick={analyze}
            disabled={analyzing || !problem.trim()}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <svg
              class="w-3.5 h-3.5 {analyzing ? 'animate-spin' : ''}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              {#if analyzing}
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              {:else}
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                />
              {/if}
            </svg>
            {analyzing ? "Analyzing…" : "AI Assist"}
          </button>
        </div>
        <div class="p-5">
          <textarea
            bind:value={problem}
            rows={6}
            placeholder="ចំបាលើការ ប្រែស្រូ ប្រទានស្អ... Describe what happened..."
            class="w-full text-sm text-text placeholder:text-text-muted/60 resize-none focus:outline-none leading-relaxed"
          ></textarea>
          <div
            class="flex items-center justify-between pt-3 border-t border-gray-100 mt-2"
          >
            <p class="text-xs text-text-muted">
              Minimum 20 characters recommended
            </p>
            <button
              onclick={analyze}
              disabled={analyzing || !problem.trim()}
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-medium hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                />
              </svg>
              RK AI ផ្ដល់ការវិភាគ
            </button>
          </div>
        </div>

        {#if analyzeError}
          <div
            class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            {analyzeError}
          </div>
        {/if}

        {#if analysis}
          {@const sevColor =
            analysis.severity === "high"
              ? "text-red-600 bg-red-50 border-red-200"
              : analysis.severity === "medium"
                ? "text-amber-700 bg-amber-50 border-amber-200"
                : "text-primary bg-primary/5 border-primary/20"}
          <div
            class="bg-white rounded-2xl border border-border overflow-hidden"
          >
            <div
              class="px-5 py-4 border-b border-border flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  />
                </svg>
                <p class="text-sm font-semibold text-text">RK AI Analysis</p>
              </div>
              <span
                class="text-[10px] px-2 py-0.5 rounded-full border {sevColor} font-semibold uppercase"
                >{analysis.severity} severity</span
              >
            </div>
            <div class="p-5 space-y-3">
              <div>
                <p class="text-xs text-text-muted mb-1">Refined description</p>
                <p class="text-sm text-text">{analysis.refinedDescription}</p>
                <button
                  onclick={applyRefined}
                  class="mt-1.5 text-xs text-primary hover:underline cursor-pointer"
                  >Use this description</button
                >
              </div>
              {#if analysis.likelyCauses.length}
                <div>
                  <p class="text-xs text-text-muted mb-1">Likely causes</p>
                  <ul
                    class="text-sm text-text list-disc list-inside space-y-0.5"
                  >
                    {#each analysis.likelyCauses as cause}<li>
                        {cause}
                      </li>{/each}
                  </ul>
                </div>
              {/if}
              <div
                class="flex gap-2 bg-primary/5 border border-primary/15 rounded-xl p-3"
              >
                <svg
                  class="w-4 h-4 text-primary shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" /><line
                    x1="12"
                    x2="12"
                    y1="8"
                    y2="12"
                  /><line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <p class="text-xs text-primary/90">
                  {analysis.recommendation}
                  <span class="text-primary/60"
                    >· Suggested urgency applied.</span
                  >
                </p>
              </div>
              <p class="text-[10px] text-text-muted">
                {analysis.source === "ai"
                  ? "Powered by Claude"
                  : "On-device estimate"}
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Problem Photos -->
      <div class="bg-white rounded-2xl border border-border overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <p class="text-sm font-semibold text-text">រូបភាពបញ្ហា (អតិបរមា ៥)</p>
          <p class="text-xs text-text-muted mt-0.5">Problem Photos (Max 5)</p>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-5 gap-2">
            <!-- Uploaded photos -->
            {#each photos as photo, i}
              <div
                class="aspect-square rounded-xl overflow-hidden border border-border relative group"
              >
                <img
                  src={photo}
                  alt="Problem {i + 1}"
                  class="w-full h-full object-cover"
                />
                <button
                  onclick={() => removePhoto(i)}
                  class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove"
                  aria-label="Remove photo"
                >
                  <svg
                    class="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg
                  >
                </button>
              </div>
            {/each}

            <!-- Upload slot -->
            {#if photos.length < 5}
              <label
                class="aspect-square rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <svg
                  class="w-5 h-5 text-primary/60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                  />
                </svg>
                <span class="text-[10px] text-primary/60 font-medium"
                  >បន្ថែមរូប</span
                >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  onchange={handlePhotoUpload}
                />
              </label>
            {/if}

            <!-- Empty placeholders -->
            {#each Array(Math.max(0, 4 - photos.length)) as _}
              <div
                class="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Back button -->
      <div>
        <button
          onclick={() => goto("/")}
          class="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
        >
          ← ត្រឡប់ក្រោយ (Back)
        </button>
      </div>
    </div>

    <!-- Right: sidebar -->
    <aside class="sticky top-20 space-y-4">
      <!-- Urgency Level -->
      <div class="bg-white rounded-2xl border border-border overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <p class="text-xs text-text-muted">កម្រិតនៃភាពបន្ទាន់</p>
          <h3 class="font-semibold text-text mt-0.5">Urgency Level</h3>
        </div>
        <div class="p-4 space-y-2">
          {#each urgencyOptions as opt}
            {@const selected = $booking.urgency === opt.value}
            {@const isEmergency = opt.value === "emergency"}
            <button
              onclick={() =>
                booking.update((s) => ({ ...s, urgency: opt.value }))}
              class="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all cursor-pointer
								{selected && !isEmergency
                ? 'border-primary bg-primary/5'
                : isEmergency && selected
                  ? 'border-red-400 bg-red-50'
                  : 'border-border hover:border-gray-300'}"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
								{selected && !isEmergency
                  ? 'bg-primary/15 text-primary'
                  : isEmergency && selected
                    ? 'bg-red-100 text-red-500'
                    : 'bg-gray-100 text-text-muted'}"
              >
                {#if opt.icon === "calendar"}
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                {:else if opt.icon === "clock"}
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                {:else}
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <p
                  class="text-sm font-medium {isEmergency
                    ? 'text-red-600'
                    : 'text-text'}"
                >
                  {opt.labelKh}
                </p>
                <p
                  class="text-xs {isEmergency
                    ? 'text-red-500'
                    : 'text-text-muted'}"
                >
                  {opt.labelEn}
                </p>
              </div>
              <div
                class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
								{selected && !isEmergency
                  ? 'border-primary bg-primary'
                  : selected && isEmergency
                    ? 'border-red-500 bg-red-500'
                    : 'border-gray-300'}"
              >
                {#if selected}
                  <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Booking Summary (compact) -->
      <div class="bg-white rounded-2xl border border-border overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <p class="text-xs text-text-muted">សេចក្ដីសង្ខេបនៃការកក់</p>
          <h3 class="font-semibold text-text mt-0.5">Booking Summary</h3>
        </div>
        <div class="px-5 py-4 space-y-3">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
            >
              <svg
                class="w-4 h-4 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z"
                />
              </svg>
            </div>
            <div>
              <p class="text-xs text-text-muted">សេវាកម្ម (Service)</p>
              <p class="text-sm font-semibold text-primary">
                {$booking.service.nameKhmer}
              </p>
              <p class="text-xs text-text-muted">{$booking.service.name}</p>
            </div>
          </div>
          {#if $booking.location}
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"
              >
                <svg
                  class="w-4 h-4 text-text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-xs text-text-muted">ទីតាំង (Location)</p>
                <p class="text-sm font-medium text-text">{$booking.location}</p>
              </div>
            </div>
          {/if}
          <div class="border-t border-border pt-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-text-muted">
                ស្មានតម្លៃសរុប / Estimated Total
              </p>
              <p class="text-sm font-bold text-primary">
                ${calcTotal($booking.service.price, {
                  urgency: $booking.urgency,
                  distanceFee: districtFee($booking.district),
                }).total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div class="px-4 pb-4">
          <button
            onclick={submit}
            disabled={!problem.trim()}
            class="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span class="block text-[10px] opacity-70 mb-0.5">ច្រើនទៀត</span>
            NEXT STEP
          </button>
        </div>
      </div>

      <!-- Emergency notice -->
      {#if $booking.urgency === "emergency"}
        <div
          class="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
        >
          <svg
            class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" /><line
              x1="12"
              x2="12"
              y1="8"
              y2="12"
            /><line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <div>
            <p class="text-xs text-amber-800">
              សេវាបន្ទាន់អាចគិតថ្លៃបន្ថែម។ ។ ។ ។ ។ ។
            </p>
            <p class="text-xs text-amber-700 mt-0.5">
              Emergency services may incur additional surcharges.
            </p>
          </div>
        </div>
      {/if}
    </aside>
  </div>
{/if}
