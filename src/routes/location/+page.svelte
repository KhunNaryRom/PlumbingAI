<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { booking } from "$lib/store";
  import { DISTRICTS, DISTRICT_FEES, type SavedAddress } from "$lib/data";

  const STORAGE_KEY = "sm_saved_addresses";

  let search = $state($booking.location || "");
  let district = $state($booking.district || "");
  let landmark = $state("");

  let savedAddresses = $state<SavedAddress[]>([]);
  let locating = $state(false);
  let locateError = $state("");

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedAddresses = JSON.parse(raw);
    } catch {
      /* ignore corrupt storage */
    }
  });

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAddresses));
    } catch {
      /* storage may be unavailable */
    }
  }

  const chosenDistrict = $derived(
    district || DISTRICTS.find((d) => search.includes(d)) || "",
  );
  const selectedFee = $derived(
    chosenDistrict ? DISTRICT_FEES[chosenDistrict] : undefined,
  );
  const canConfirm = $derived(search.trim().length > 0);

  function useSaved(addr: SavedAddress) {
    search = addr.address;
    const match = DISTRICTS.find((d) => addr.address.includes(d));
    if (match) district = match;
  }

  function saveCurrent() {
    const loc = [search, district, landmark].filter(Boolean).join(", ").trim();
    if (!loc || savedAddresses.some((a) => a.address === loc)) return;
    savedAddresses = [
      ...savedAddresses,
      {
        icon: savedAddresses.length % 2 === 0 ? "home" : "office",
        labelKh: chosenDistrict || "ទីតាំង",
        address: loc,
      },
    ];
    persist();
  }

  function removeSaved(i: number) {
    savedAddresses = savedAddresses.filter((_, idx) => idx !== i);
    persist();
  }

  // 1. Added helper function to query Nominatim OpenStreetMap API with custom headers
  async function getAddressFromCoords(
    lat: number,
    lng: number,
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en,kh`,
        {
          headers: {
            "User-Agent": "SanitationModernistApp/1.0", // Prevents API from rejecting request
          },
        },
      );

      if (!response.ok) throw new Error();
      const data = await response.json();

      if (data && data.display_name) {
        return data.display_name;
      }
      throw new Error();
    } catch {
      // Fallback string if API is offline
      return `Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    }
  }

  // 2. Updated to use the reverse geocoding request and match districts
  function currentLocation() {
    if (!navigator.geolocation) {
      locateError = "Geolocation is not supported on this device.";
      return;
    }
    locating = true;
    locateError = "";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Get real readable location address instead of raw lat/long
        const readableAddress = await getAddressFromCoords(latitude, longitude);

        // Try to auto-match district from the result text
        const matchedDistrict = DISTRICTS.find((d) =>
          readableAddress.toLowerCase().includes(d.toLowerCase()),
        );
        if (matchedDistrict) {
          district = matchedDistrict;
        }

        search = readableAddress;
        locating = false;
      },
      (err) => {
        locateError = err.message || "Could not determine your location.";
        locating = false;
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function confirm() {
    const loc = [search, district, landmark].filter(Boolean).join(", ");
    if (!loc.trim()) return;
    booking.update((s) => ({
      ...s,
      location: loc.trim(),
      district: chosenDistrict,
    }));
    goto("/schedule");
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
  <div class="space-y-6">
    <!-- Map + panel layout -->
    <div
      class="grid grid-cols-1 lg:grid-cols-[1fr_380px] rounded-2xl overflow-hidden border border-border min-h-[520px]"
    >
      <!-- Left: Map -->
      <div
        class="relative bg-[#4fa990] min-h-[300px] lg:min-h-full overflow-hidden"
      >
        <!-- Stylized city map SVG -->
        <svg
          class="absolute inset-0 w-full h-full"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Background teal -->
          <rect width="800" height="600" fill="#4fa990" />
          <!-- Block fills -->
          <rect x="60" y="60" width="120" height="80" rx="4" fill="#45998230" />
          <rect
            x="200"
            y="80"
            width="100"
            height="60"
            rx="4"
            fill="#45998230"
          />
          <rect
            x="320"
            y="50"
            width="140"
            height="90"
            rx="4"
            fill="#45998225"
          />
          <rect
            x="500"
            y="60"
            width="110"
            height="70"
            rx="4"
            fill="#45998230"
          />
          <rect
            x="650"
            y="80"
            width="100"
            height="80"
            rx="4"
            fill="#45998225"
          />
          <rect
            x="60"
            y="200"
            width="100"
            height="120"
            rx="4"
            fill="#45998225"
          />
          <rect
            x="340"
            y="180"
            width="120"
            height="100"
            rx="4"
            fill="#45998230"
          />
          <rect
            x="520"
            y="190"
            width="130"
            height="90"
            rx="4"
            fill="#45998225"
          />
          <rect
            x="680"
            y="200"
            width="90"
            height="110"
            rx="4"
            fill="#45998230"
          />
          <rect
            x="80"
            y="380"
            width="110"
            height="90"
            rx="4"
            fill="#45998225"
          />
          <rect
            x="240"
            y="360"
            width="130"
            height="100"
            rx="4"
            fill="#45998230"
          />
          <rect
            x="500"
            y="370"
            width="120"
            height="100"
            rx="4"
            fill="#45998225"
          />
          <rect
            x="650"
            y="390"
            width="110"
            height="90"
            rx="4"
            fill="#45998230"
          />
          <!-- Water body -->
          <ellipse cx="420" cy="320" rx="70" ry="45" fill="#3d857540" />
          <!-- Major roads (horizontal) -->
          <rect x="0" y="165" width="800" height="18" fill="#3d8575" rx="1" />
          <rect x="0" y="330" width="800" height="14" fill="#3d8575" rx="1" />
          <rect x="0" y="490" width="800" height="14" fill="#3d8575" rx="1" />
          <!-- Major roads (vertical) -->
          <rect x="180" y="0" width="16" height="600" fill="#3d8575" rx="1" />
          <rect x="350" y="0" width="14" height="600" fill="#3d8575" rx="1" />
          <rect x="530" y="0" width="14" height="600" fill="#3d8575" rx="1" />
          <rect x="660" y="0" width="12" height="600" fill="#3d8575" rx="1" />
          <!-- Minor roads -->
          <rect x="0" y="255" width="800" height="8" fill="#47917f" rx="1" />
          <rect x="0" y="420" width="800" height="8" fill="#47917f" rx="1" />
          <rect x="100" y="0" width="8" height="600" fill="#47917f" rx="1" />
          <rect x="270" y="0" width="8" height="600" fill="#47917f" rx="1" />
          <rect x="450" y="0" width="8" height="600" fill="#47917f" rx="1" />
          <rect x="600" y="0" width="8" height="600" fill="#47917f" rx="1" />
          <rect x="730" y="0" width="8" height="600" fill="#47917f" rx="1" />
          <!-- Location pins (small) -->
          <circle cx="280" cy="450" r="10" fill="#1e6b5a" opacity="0.9" />
          <circle cx="280" cy="450" r="6" fill="white" opacity="0.5" />
          <circle cx="540" cy="290" r="10" fill="#1e6b5a" opacity="0.9" />
          <circle cx="540" cy="290" r="6" fill="white" opacity="0.5" />
          <!-- Main user pin -->
          <g transform="translate(410,460)">
            <circle cx="0" cy="0" r="22" fill="#1a4035" opacity="0.3" />
            <circle
              cx="0"
              cy="0"
              r="16"
              fill="#1e6b5a"
              stroke="white"
              stroke-width="2.5"
            />
            <circle cx="0" cy="0" r="6" fill="white" />
          </g>
        </svg>

        <!-- Current Location button overlay -->
        <button
          onclick={currentLocation}
          disabled={locating}
          class="absolute top-4 left-4 flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-md text-sm font-medium text-text hover:shadow-lg disabled:opacity-70 transition-shadow cursor-pointer"
        >
          <svg
            class="w-4 h-4 text-primary {locating ? 'animate-spin' : ''}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            {#if locating}
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            {:else}
              <circle cx="12" cy="12" r="3" /><path
                d="M12 2v3M12 19v3M2 12h3M19 12h3"
              />
              <circle cx="12" cy="12" r="8" stroke-dasharray="2 2" />
            {/if}
          </svg>
          ទីតាំបច្ចុប្បន
          <span class="text-text-muted text-xs"
            >{locating ? "Locating…" : "Current Location"}</span
          >
        </button>
        {#if locateError}
          <div
            class="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2"
          >
            {locateError}
          </div>
        {/if}
      </div>

      <!-- Right: Form panel -->
      <div class="bg-white p-6 flex flex-col gap-5 overflow-y-auto">
        <div>
          <h2 class="text-lg font-bold text-primary">បញ្ជាក់ទីតាំងបស់អ្នក</h2>
          <p class="text-sm text-text-muted mt-0.5">Confirm Your Location</p>
        </div>

        <!-- Search -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-medium text-text"
              >ស្វែងរកទីតាំង ឬ អាសយដ្ឋាន</span
            >
            <span class="text-xs text-text-muted"
              >Search Location or Address</span
            >
          </div>
          <div
            class="flex items-center gap-2 border border-border rounded-xl px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-gray-50"
          >
            <svg
              class="w-4 h-4 text-text-muted shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              bind:value={search}
              type="text"
              placeholder="Street 271, Phnom Penh..."
              class="flex-1 text-sm bg-transparent focus:outline-none text-text placeholder:text-text-muted/60"
            />
          </div>
        </div>

        <!-- District -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-medium text-text">ខណ្ឌ / ស្រុក</span>
            <span class="text-xs text-text-muted">Khan / District</span>
          </div>
          <div class="relative">
            <select
              bind:value={district}
              class="w-full appearance-none border border-border rounded-xl px-3 py-2.5 text-sm text-text bg-gray-50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">Select District</option>
              {#each DISTRICTS as d}
                <option value={d}>{d}</option>
              {/each}
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
          {#if selectedFee !== undefined}
            <p class="text-xs text-text-muted mt-1.5">
              ថ្លៃធ្វើដំណើរ / Travel fee for {chosenDistrict}:
              <span class="font-semibold text-primary"
                >${selectedFee.toFixed(2)}</span
              >
            </p>
          {/if}
        </div>

        <!-- Landmark -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-medium text-text">ចំណាំទីតាំង</span>
            <span class="text-xs text-text-muted"
              >Landmark Notes (e.g. Near Cafe)</span
            >
          </div>
          <textarea
            bind:value={landmark}
            rows={3}
            placeholder="Enter landmark details..."
            class="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text bg-gray-50 placeholder:text-text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          ></textarea>
        </div>

        <!-- Saved addresses -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-text">ទីតាំងដែលបានរក្សាទុក</p>
            <button
              onclick={saveCurrent}
              disabled={!canConfirm}
              class="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
            >
              + Save current
            </button>
          </div>
          <div class="space-y-2">
            {#each savedAddresses as addr, i}
              <div
                class="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-gray-50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <button
                  onclick={() => useSaved(addr)}
                  class="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0"
                  >
                    {#if addr.icon === "home"}
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
                          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                        />
                      </svg>
                    {:else}
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
                          d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                        />
                      </svg>
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-text">{addr.labelKh}</p>
                    <p class="text-xs text-text-muted truncate">
                      {addr.address}
                    </p>
                  </div>
                </button>
                <button
                  onclick={() => removeSaved(i)}
                  class="shrink-0 p-1 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remove saved address"
                  aria-label="Remove saved address"
                >
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg
                  >
                </button>
              </div>
            {:else}
              <p class="text-xs text-text-muted italic py-2">
                No saved addresses yet.
              </p>
            {/each}
          </div>
        </div>

        <!-- Confirm button -->
        <button
          onclick={confirm}
          disabled={!canConfirm}
          class="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer mt-auto"
        >
          <span class="block text-[10px] opacity-70 mb-0.5">បញ្ជាក់ទីតាំង</span>
          CONFIRM LOCATION
        </button>
      </div>
    </div>

    <!-- Bottom navigation -->
    <div class="flex justify-between">
      <button
        onclick={() => goto("/describe-problem")}
        class="px-6 py-3 rounded-xl border-2 border-border text-text font-medium text-sm hover:bg-gray-50 transition-colors cursor-pointer"
      >
        ត្រឡប់ក្រោយ (Back)
      </button>
      <button
        onclick={confirm}
        disabled={!canConfirm}
        class="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary font-medium text-sm hover:bg-primary/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        ច្រើនទៀត (Next Step)
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  </div>
{/if}
