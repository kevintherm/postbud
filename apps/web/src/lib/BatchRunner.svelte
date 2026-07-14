<script>
  import { store } from './store.svelte.js';
  import Button from './components/Button.svelte';
  import { CheckCircle2, AlertTriangle, X, Play, RefreshCw } from 'lucide-svelte';

  function handleClose() {
    store.batchRunner.isOpen = false;
  }

  function handleReRun() {
    // Find the collection index in collections by name
    const col = store.collections.find(c => c.name === store.batchRunner.collectionName);
    if (col) {
      store.runBatch(col.id);
    }
  }

  // Derived metrics
  const stats = $derived.by(() => {
    const results = store.batchRunner.results;
    const total = results.length;
    const passed = results.filter(r => !r.error).length;
    const failed = total - passed;
    const avgTime = total > 0 ? Math.round(results.reduce((acc, r) => acc + r.time, 0) / total) : 0;
    return { total, passed, failed, avgTime };
  });
</script>

{#if store.batchRunner.isOpen}
  <!-- Backdrop -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-bauhaus-black/70 p-6 backdrop-blur-sm">
    
    <!-- Modal Card -->
    <div class="w-full max-w-4xl bg-bauhaus-white border-4 border-bauhaus-black flex flex-col max-h-[85vh] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)]">
      
      <!-- Modal Header -->
      <div class="p-6 border-b-4 border-bauhaus-black bg-bauhaus-yellow flex justify-between items-center select-none">
        <div class="space-y-1">
          <h2 class="text-2xl font-black font-bauhaus tracking-tight lowercase">batch request runner</h2>
          <p class="text-xs font-bold text-bauhaus-black/60 lowercase">testing: {store.batchRunner.collectionName}</p>
        </div>
        <button 
          onclick={handleClose} 
          class="p-2 border-2 border-bauhaus-black bg-bauhaus-white hover:bg-bauhaus-red hover:text-white cursor-pointer focus:outline-none"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Runner Progress & Status Bar -->
      <div class="p-6 border-b-2 border-bauhaus-black bg-gray-50 flex flex-wrap justify-between items-center select-none gap-4">
        <!-- Progress bar or state indicator -->
        <div class="flex-1 min-w-[240px]">
          {#if store.batchRunner.isRunning}
            <div class="flex items-center gap-3 mb-2">
              <RefreshCw size={16} class="animate-spin text-bauhaus-blue" />
              <span class="text-xs font-bold lowercase">
                running request {store.batchRunner.current} of {store.batchRunner.total}...
              </span>
            </div>
            <!-- Progress Bar -->
            <div class="w-full h-4 bg-gray-200 border-2 border-bauhaus-black overflow-hidden">
              <div 
                class="h-full bg-bauhaus-blue transition-all duration-300"
                style="width: {(store.batchRunner.current / store.batchRunner.total) * 100}%"
              ></div>
            </div>
          {:else}
            <div class="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={20} class="fill-green-100" />
              <span class="text-sm font-bold lowercase">batch run completed!</span>
            </div>
          {/if}
        </div>

        <!-- Mini Stats -->
        <div class="flex gap-4 text-xs font-bold select-none">
          <div class="border-2 border-bauhaus-black bg-white px-3 py-1.5 text-center">
            <div class="text-[10px] text-gray-500 lowercase">passed</div>
            <div class="text-lg text-green-600 font-mono">{stats.passed}</div>
          </div>
          <div class="border-2 border-bauhaus-black bg-white px-3 py-1.5 text-center">
            <div class="text-[10px] text-gray-500 lowercase">failed</div>
            <div class="text-lg text-bauhaus-red font-mono">{stats.failed}</div>
          </div>
          <div class="border-2 border-bauhaus-black bg-white px-3 py-1.5 text-center">
            <div class="text-[10px] text-gray-500 lowercase">avg response time</div>
            <div class="text-lg text-bauhaus-blue font-mono">{stats.avgTime} ms</div>
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div class="flex-1 overflow-y-auto p-6 min-h-0 bg-bauhaus-grid-bg/30">
        {#if store.batchRunner.results.length === 0}
          <div class="h-48 flex items-center justify-center italic text-xs text-gray-400 lowercase">
            waiting to run...
          </div>
        {:else}
          <div class="border-2 border-bauhaus-black bg-bauhaus-white overflow-hidden">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-gray-100 border-b-2 border-bauhaus-black font-bold select-none">
                <tr>
                  <th class="p-3 border-r border-bauhaus-black w-24 text-center">verdict</th>
                  <th class="p-3 border-r border-bauhaus-black">request name</th>
                  <th class="p-3 border-r border-bauhaus-black w-16 text-center">method</th>
                  <th class="p-3 border-r border-bauhaus-black">resolved url</th>
                  <th class="p-3 border-r border-bauhaus-black w-20 text-center">status</th>
                  <th class="p-3 w-24 text-center">duration</th>
                </tr>
              </thead>
              <tbody class="divide-y border-bauhaus-black divide-bauhaus-black">
                {#each store.batchRunner.results as res, idx}
                  <tr class="hover:bg-gray-50/50">
                    <!-- Verdict -->
                    <td class="p-2 border-r border-bauhaus-black text-center select-none">
                      {#if res.error}
                        <span class="px-2 py-0.5 border border-bauhaus-red bg-bauhaus-red text-white text-[10px] font-black uppercase">fail</span>
                      {:else}
                        <span class="px-2 py-0.5 border border-green-600 bg-green-600 text-white text-[10px] font-black uppercase">pass</span>
                      {/if}
                    </td>
                    
                    <!-- Name -->
                    <td class="p-3 border-r border-bauhaus-black font-bold lowercase truncate max-w-[150px]">{res.name}</td>
                    
                    <!-- Method -->
                    <td class="p-2 border-r border-bauhaus-black text-center select-none">
                      <span class="px-1.5 py-0.5 text-[9px] font-bold border border-bauhaus-black uppercase bg-gray-200">{res.method}</span>
                    </td>
                    
                    <!-- URL -->
                    <td class="p-3 border-r border-bauhaus-black font-mono text-[11px] truncate max-w-[250px]">{res.url}</td>
                    
                    <!-- Status -->
                    <td class="p-2 border-r border-bauhaus-black text-center font-mono font-bold select-none">
                      <span class="px-1.5 py-0.5 text-[11px] {res.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                        {res.status || 'error'}
                      </span>
                    </td>
                    
                    <!-- Duration -->
                    <td class="p-3 text-center font-mono font-medium select-none">{res.time} ms</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="p-6 border-t-2 border-bauhaus-black bg-gray-50 flex justify-between items-center select-none">
        <Button 
          variant="white" 
          onclick={handleReRun} 
          disabled={store.batchRunner.isRunning}
          class="flex items-center gap-2"
        >
          <RefreshCw size={14} class={store.batchRunner.isRunning ? 'animate-spin' : ''} />
          <span>run again</span>
        </Button>
        
        <Button 
          variant="black" 
          onclick={handleClose}
          disabled={store.batchRunner.isRunning}
        >
          close
        </Button>
      </div>

    </div>
  </div>
{/if}
