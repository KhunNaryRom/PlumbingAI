<script lang="ts">
  import { goto } from "$app/navigation";
  import { booking } from "$lib/store";
  import { SERVICES } from "$lib/types";
  import { calcTotal, toKHR } from "$lib/pricing";
  import { assignTechnician, districtFee } from "$lib/data";
  import TechnicianCard from "$lib/TechnicianCard.svelte";

  const svc = $derived(SERVICES.find((s) => s.id === $booking.service?.id));
  const technician = $derived(
    assignTechnician($booking.service?.id, $booking.district),
  );

  const basePrice = $derived(svc?.price ?? 0);
  const estimate = $derived(
    calcTotal(basePrice, {
      urgency: $booking.urgency,
      distanceFee: districtFee($booking.district),
    }),
  );

  let submitting = $state(false);
  let error = $state("");
  let saved = $state(false);

  function saveEstimate() {
    if (!svc) return;
    try {
      const drafts = JSON.parse(
        localStorage.getItem("sm_saved_estimates") || "[]",
      );
      drafts.unshift({
        serviceId: svc.id,
        serviceName: svc.name,
        serviceNameKhmer: svc.nameKhmer,
        location: $booking.location,
        date: $booking.date,
        time: $booking.time,
        urgency: $booking.urgency,
        total: estimate.total,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(
        "sm_saved_estimates",
        JSON.stringify(drafts.slice(0, 20)),
      );
      saved = true;
      setTimeout(() => (saved = false), 2500);
    } catch {
      /* storage unavailable */
    }
  }

  function formatDate() {
    if (!$booking.date) return "";
    const [y, m, d] = $booking.date.split("-").map(Number);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const date = new Date(y, m - 1, d);
    return `${days[date.getDay()]} ${months[m - 1]} ${String(d).padStart(2, "0")}, ${String($booking.time)}`;
  }

  async function confirmBooking() {
    if (!svc) return;
    submitting = true;
    error = "";
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: svc.id,
          serviceName: svc.name,
          problem: $booking.problem,
          location: $booking.location,
          district: $booking.district,
          photos: $booking.photos,
          date: $booking.date,
          time: $booking.time,
          urgency: $booking.urgency,
          estimatedPrice: estimate.total,
          technicianId: technician.id,
          technicianName: technician.nameLabel,
        }),
      });
      if (!res.ok) throw new Error("Failed to save booking");
      const saved = await res.json();
      booking.update((s) => ({
        ...s,
        estimate: estimate.total,
        bookingId: saved.id,
      }));
      goto("/confirmation");
    } catch (e) {
      error = (e as Error).message;
    } finally {
      submitting = false;
    }
  }
</script>

{#if !svc}
  <div class="text-center py-16">
    <p class="text-text-muted">No booking data. Please start over.</p>
    <button
      onclick={() => goto("/")}
      class="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium cursor-pointer"
      >Start over</button
    >
  </div>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
    <!-- Left: price breakdown -->
    <div class="space-y-5">
      <div>
        <h1 class="text-2xl font-bold text-primary">ការប៉ាន់ស្មានតម្លៃ AI</h1>
        <p class="text-text-muted mt-0.5">AI Price Estimate</p>
      </div>

      <!-- Price breakdown card -->
      <div class="bg-white rounded-2xl border border-border overflow-hidden">
        <div
          class="px-5 py-4 border-b border-border flex items-center justify-between"
        >
          <div>
            <p class="text-sm font-semibold text-text">ការបំបែកតម្លៃ</p>
            <p class="text-xs text-text-muted mt-0.5">Price Breakdown</p>
          </div>
          <span
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
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
            RK · ភាពជឿជាក់ខ្ពស់ / High Confidence
          </span>
        </div>

        <div class="px-5 py-5 space-y-4">
          <!-- Line items -->
          <div class="flex justify-between items-end">
            <div>
              <p class="text-sm font-medium text-text">ថ្លៃជូសសេវាមូលដ្ឋាន</p>
              <p class="text-xs text-text-muted">Base Service Fee</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-text">${basePrice.toFixed(2)}</p>
              <p class="text-xs text-text-muted">{toKHR(basePrice)} KHR</p>
            </div>
          </div>

          <div class="flex justify-between items-end">
            <div>
              <p class="text-sm font-medium text-text">
                ថ្លៃធ្វើដំណើរ (ចម្ងាយ)
              </p>
              <p class="text-xs text-text-muted">
                Travel / Distance{$booking.district
                  ? ` · ${$booking.district}`
                  : ""}
              </p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-text">
                ${estimate.distance.toFixed(2)}
              </p>
              <p class="text-xs text-text-muted">
                {toKHR(estimate.distance)} KHR
              </p>
            </div>
          </div>

          {#if estimate.urgencyFee > 0}
            <div class="flex justify-between items-end">
              <div>
                <p class="text-sm font-medium text-text">ថ្លៃភាពបន្ទាន់</p>
                <p class="text-xs text-text-muted">
                  Urgency ({$booking.urgency})
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-text">
                  ${estimate.urgencyFee.toFixed(2)}
                </p>
                <p class="text-xs text-text-muted">
                  {toKHR(estimate.urgencyFee)} KHR
                </p>
              </div>
            </div>
          {/if}

          <div class="flex justify-between items-end">
            <div>
              <p class="text-sm font-medium text-text">
                គ្រឿងបន្លាស់ និងសម្ភារៈ
              </p>
              <p class="text-xs text-text-muted">Parts &amp; Materials</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-text">
                ${estimate.parts.toFixed(2)}
              </p>
              <p class="text-xs text-text-muted">{toKHR(estimate.parts)} KHR</p>
            </div>
          </div>

          <div
            class="border-t border-border pt-4 flex justify-between items-end"
          >
            <div>
              <p class="text-base font-bold text-text">សរុប</p>
              <p class="text-xs text-text-muted">Total</p>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold text-primary">
                ${estimate.total.toFixed(2)}
              </p>
              <p class="text-xs text-text-muted">{toKHR(estimate.total)} KHR</p>
            </div>
          </div>
        </div>

        <!-- Notice -->
        <div
          class="mx-5 mb-5 flex gap-3 bg-primary/5 border border-primary/15 rounded-xl p-4"
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
          <div>
            <p class="text-xs text-primary font-medium">
              ការប៉ាន់ស្មាននេះផ្អែកលើប្រវត្តិសេវាដូចគ្នានៅតំបន់របស់អ្នក
            </p>
            <p class="text-xs text-primary/80 mt-0.5">
              This estimate is based on similar service history in your area.
              Final price may vary slightly after physical inspection.
            </p>
          </div>
        </div>
      </div>

      {#if error}
        <div
          class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {error}
        </div>
      {/if}

      <!-- Back -->
      <button
        onclick={() => goto("/schedule")}
        class="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
      >
        ← ត្រឡប់ក្រោយ (Back)
      </button>
    </div>

    <!-- Right: booking summary sidebar -->
    <aside class="sticky top-20 space-y-4">
      <div class="bg-white rounded-2xl border border-border overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <p class="text-xs text-text-muted">សេចក្ដីសង្ខេបនៃការកក់</p>
          <h3 class="font-semibold text-text mt-0.5">Booking Summary</h3>
        </div>

        <div class="px-5 py-4 space-y-3 border-b border-border">
          <!-- Service row with edit -->
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
            <div class="flex-1 min-w-0">
              <p class="text-xs text-text-muted">សេវាកម្ម / Service</p>
              <p class="text-sm font-medium text-text truncate">
                {svc.nameKhmer}
              </p>
              <p class="text-xs text-text-muted">{svc.name}</p>
            </div>
            <button
              onclick={() => goto("/")}
              class="text-xs text-primary hover:underline shrink-0 cursor-pointer"
              >កែប្រែ / Edit</button
            >
          </div>

          <!-- Location row with edit -->
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
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-text-muted">ទីតាំង / Location</p>
              <p class="text-sm font-medium text-text truncate">
                {$booking.location || "Not set"}
              </p>
            </div>
            <button
              onclick={() => goto("/location")}
              class="text-xs text-primary hover:underline shrink-0 cursor-pointer"
              >កែប្រែ / Edit</button
            >
          </div>

          <!-- Time row with edit -->
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5"
                />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-text-muted">ពេលវេលា / Time</p>
              <p class="text-sm font-medium text-text">{formatDate()}</p>
            </div>
            <button
              onclick={() => goto("/schedule")}
              class="text-xs text-primary hover:underline shrink-0 cursor-pointer"
              >កែប្រែ / Edit</button
            >
          </div>
        </div>

        <div class="p-4 space-y-2">
          <button
            onclick={confirmBooking}
            disabled={submitting}
            class="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting
              ? "Processing..."
              : "ចេញទៅការទូទាត់ / Proceed to Payment"}
          </button>
          <button
            onclick={saveEstimate}
            disabled={submitting}
            class="w-full py-3 rounded-xl border-2 border-border text-text font-medium text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer {saved
              ? 'border-primary text-primary'
              : ''}"
          >
            {saved
              ? "✓ បានរក្សាទុក / Saved"
              : "រក្សាទុកការប៉ាន់ស្មាន / Save Estimate"}
          </button>
        </div>
      </div>

      <TechnicianCard {technician} />
    </aside>
  </div>
{/if}
