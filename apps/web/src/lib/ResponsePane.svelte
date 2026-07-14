<script>
  import { store } from './store.svelte.js';
  import Button from './components/Button.svelte';
  import { Copy, ClipboardCheck } from 'lucide-svelte';

  let activeTab = $state('body'); // 'body' | 'headers'
  let copied = $state(false);

  // Format body output (pretty-print JSON if possible)
  const formattedBody = $derived.by(() => {
    if (!store.activeResponse || !store.activeResponse.body) return '';
    try {
      const parsed = JSON.parse(store.activeResponse.body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return store.activeResponse.body;
    }
  });

  function handleCopy() {
    if (!store.activeResponse || !store.activeResponse.body) return;
    navigator.clipboard.writeText(formattedBody);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function getStatusColor(status) {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 border-green-300';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (status >= 400 && status < 500) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-bauhaus-red/10 text-bauhaus-red border-bauhaus-red/30';
  }

  function formatSize(bytes) {
    if (bytes === 0) return '0 b';
    const k = 1024;
    const sizes = ['b', 'kb', 'mb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<div class="flex-1 overflow-y-auto p-6 flex flex-col bg-bauhaus-grid-bg/30 relative">
  <!-- Loading State Shimmer & Bauhaus Animation Overlay -->
  {#if store.isSending}
    <div class="absolute inset-0 bg-bauhaus-white/90 backdrop-blur-[1px] flex flex-col items-center justify-center z-30 select-none">
      <div class="relative w-32 h-32 mb-6">
        <!-- Pulse/Ping Yellow Base -->
        <div class="absolute w-24 h-24 rounded-full bg-bauhaus-yellow border-2 border-bauhaus-black left-4 top-4 animate-ping opacity-30"></div>
        <div class="absolute w-20 h-20 rounded-full bg-bauhaus-yellow border-2 border-bauhaus-black left-6 top-6"></div>
        <!-- Spin Blue Square -->
        <div class="absolute w-14 h-14 bg-bauhaus-blue border-2 border-bauhaus-black left-9 top-9 animate-spin [animation-duration:3s]"></div>
        <!-- Bounce Red Triangle -->
        <div class="absolute w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-bauhaus-red left-[49px] top-4 animate-bounce"></div>
      </div>
      <span class="text-xs font-black font-bauhaus tracking-widest lowercase text-bauhaus-black animate-pulse">
        dispatching request...
      </span>
    </div>
  {/if}
  
  {#if !store.activeResponse}
    <!-- Bauhaus geometric art placeholder -->
    <div class="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
      <div class="relative w-64 h-64 mb-8 flex items-center justify-center">
        <!-- Abstract Bauhaus Composition -->
        <div class="absolute w-48 h-48 rounded-full bg-bauhaus-yellow opacity-85"></div>
        <div class="absolute w-36 h-36 bg-bauhaus-blue bottom-4 left-4 border-2 border-bauhaus-black"></div>
        <div class="absolute w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[80px] border-b-bauhaus-red top-8 right-8"></div>
        <!-- Decorative stripes -->
        <div class="absolute w-full h-1.5 bg-bauhaus-black top-12 left-0 transform -rotate-12"></div>
        <div class="absolute w-full h-1.5 bg-bauhaus-black bottom-16 right-0 transform rotate-12"></div>
        <div class="absolute w-2 h-full bg-bauhaus-black left-12 top-0 transform rotate-6"></div>
        <div class="absolute w-12 h-12 rounded-full bg-bauhaus-black top-20 left-20"></div>
      </div>
      <h2 class="text-lg font-bold font-bauhaus tracking-tight lowercase text-bauhaus-black mb-2">
        no request executed yet
      </h2>
      <p class="text-xs text-gray-400 max-w-sm lowercase">
        configure your parameters and click send above to test api endpoints offline or online.
      </p>
    </div>
  {:else}
    <!-- Status / Info Bar -->
    <div class="flex flex-wrap items-center justify-between border-2 border-bauhaus-black bg-bauhaus-white p-4 mb-6 select-none gap-3">
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-gray-500 lowercase">status:</span>
        <span class="px-3 py-1 font-mono text-sm font-bold border-2 border-bauhaus-black {getStatusColor(store.activeResponse.status)}">
          {store.activeResponse.status || 'error'}
        </span>
      </div>

      <div class="flex items-center gap-6 text-xs font-bold">
        <div class="flex items-center gap-2">
          <span class="text-gray-500 lowercase">time:</span>
          <span class="font-mono text-bauhaus-blue">{store.activeResponse.time} ms</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-500 lowercase">size:</span>
          <span class="font-mono text-bauhaus-red">{formatSize(store.activeResponse.size)}</span>
        </div>
      </div>
    </div>

    <!-- Tabs (Body / Headers) -->
    <div class="flex border-b border-bauhaus-black select-none">
      <button
        onclick={() => activeTab = 'body'}
        class="px-5 py-2 text-xs font-bold border-t border-l border-r border-bauhaus-black -mb-[1px] focus:outline-none transition-colors {activeTab === 'body' ? 'bg-bauhaus-yellow border-b border-bauhaus-yellow text-bauhaus-black' : 'bg-white border-b border-bauhaus-black text-gray-500 hover:text-bauhaus-black'}"
      >
        response body
      </button>
      <button
        onclick={() => activeTab = 'headers'}
        class="px-5 py-2 text-xs font-bold border-t border-l border-r border-bauhaus-black -mb-[1px] focus:outline-none transition-colors {activeTab === 'headers' ? 'bg-bauhaus-blue border-b border-bauhaus-blue text-white' : 'bg-white border-b border-bauhaus-black text-gray-500 hover:text-bauhaus-black'}"
      >
        headers ({Object.keys(store.activeResponse.headers || {}).length})
      </button>
    </div>

    <!-- Panel Content -->
    <div class="flex-1 flex flex-col pt-4 min-h-0">
      <!-- 1. RESPONSE BODY -->
      {#if activeTab === 'body'}
        <div class="flex-1 flex flex-col border-2 border-bauhaus-black bg-bauhaus-white relative overflow-hidden">
          
          <!-- Actions Header -->
          <div class="flex justify-end p-2 bg-gray-50 border-b-2 border-bauhaus-black select-none">
            <Button 
              variant="white" 
              onclick={handleCopy} 
              class="px-3 py-1 text-xs flex items-center gap-1.5"
            >
              {#if copied}
                <ClipboardCheck size={14} class="text-green-600" />
                <span>copied!</span>
              {:else}
                <Copy size={14} />
                <span>copy body</span>
              {/if}
            </Button>
          </div>

          <!-- Code View -->
          <pre class="flex-1 p-4 overflow-auto font-mono text-xs text-bauhaus-black select-text bg-gray-50/50 whitespace-pre-wrap breakdown-words break-all">{formattedBody}</pre>
        </div>
      {/if}

      <!-- 2. RESPONSE HEADERS -->
      {#if activeTab === 'headers'}
        <div class="border-2 border-bauhaus-black overflow-hidden bg-bauhaus-white">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-gray-100 border-b-2 border-bauhaus-black font-bold select-none">
              <tr>
                <th class="p-3 border-r-2 border-bauhaus-black w-[240px]">header key</th>
                <th class="p-3">value</th>
              </tr>
            </thead>
            <tbody>
              {#each Object.entries(store.activeResponse.headers || {}) as [key, value]}
                <tr class="border-b-2 last:border-0 border-bauhaus-black">
                  <td class="p-3 border-r-2 border-bauhaus-black font-bold font-mono text-[11px] select-all lowercase">{key}</td>
                  <td class="p-3 font-mono text-[11px] select-all break-all">{value}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  {/if}

</div>
