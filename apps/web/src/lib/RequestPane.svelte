<script>
  import { store } from './store.svelte.js';
  import Button from './components/Button.svelte';
  import Input from './components/Input.svelte';
  import Select from './components/Select.svelte';
  import { Plus, X, Globe, ShieldAlert, CheckSquare, Square, Save } from 'lucide-svelte';

  let activeTab = $state('params'); // 'params' | 'headers' | 'body'
  let showSaveDropdown = $state(false);

  // Monitor params list, auto-add empty row at bottom
  $effect(() => {
    const params = store.activeRequest.params;
    if (params.length === 0 || params[params.length - 1].key !== '' || params[params.length - 1].value !== '') {
      params.push({ key: '', value: '', enabled: true });
    }
  });

  // Monitor headers list, auto-add empty row at bottom
  $effect(() => {
    const headers = store.activeRequest.headers;
    if (headers.length === 0 || headers[headers.length - 1].key !== '' || headers[headers.length - 1].value !== '') {
      headers.push({ key: '', value: '', enabled: true });
    }
  });

  function removeParam(index) {
    store.activeRequest.params = store.activeRequest.params.filter((_, i) => i !== index);
    store.syncUrlFromParams();
  }

  function removeHeader(index) {
    store.activeRequest.headers = store.activeRequest.headers.filter((_, i) => i !== index);
  }

  function handleUrlChange() {
    store.syncParamsFromUrl();
  }

  function handleParamChange() {
    store.syncUrlFromParams();
  }

  function toggleParamEnabled(index) {
    store.activeRequest.params[index].enabled = !store.activeRequest.params[index].enabled;
    store.syncUrlFromParams();
  }

  function toggleHeaderEnabled(index) {
    store.activeRequest.headers[index].enabled = !store.activeRequest.headers[index].enabled;
  }

  function handleSave(colId) {
    store.saveToCollection(colId);
    showSaveDropdown = false;
  }

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
</script>

<div class="border-b-2 border-bauhaus-black bg-bauhaus-white p-6 space-y-4">
  <!-- Collection Switcher -->
  <div class="flex items-center justify-between text-xs font-bold lowercase text-gray-500 pb-1">
    <div class="flex items-center gap-2">
      <span>active collection:</span>
      <Select bind:value={store.activeCollectionId} class="w-[240px]">
        {#each store.collections as col (col.id)}
          <option value={col.id}>{col.name}</option>
        {/each}
      </Select>
    </div>
    <div class="flex items-center gap-2">
      <span class="bg-bauhaus-yellow px-2 py-0.5 border border-bauhaus-black text-bauhaus-black">proxy: {store.executionMode}</span>
    </div>
  </div>

  <!-- Request Bar -->
  <div class="flex gap-2">
    <!-- Method Selector -->
    <Select bind:value={store.activeRequest.method} class="w-[120px]">
      {#each methods as m}
        <option value={m}>{m}</option>
      {/each}
    </Select>

    <!-- URL Input -->
    <div class="flex-1">
      <Input
        bind:value={store.activeRequest.url}
        placeholder={'enter request url (e.g. {{host}}/api/openapi.json)'}
        oninput={handleUrlChange}
        onkeydown={(e) => e.key === 'Enter' && store.sendRequest()}
        class="font-mono"
      />
    </div>

    <!-- Send Button -->
    <Button 
      variant="black" 
      onclick={() => store.sendRequest()} 
      disabled={store.isSending}
      class="px-8"
    >
      {store.isSending ? 'sending...' : 'send'}
    </Button>

    <!-- Save Button -->
    <div class="relative">
      <Button 
        variant="white" 
        onclick={() => showSaveDropdown = !showSaveDropdown}
        class="px-4"
        title="save request to collection"
      >
        <Save size={18} />
      </Button>

      <!-- Dropdown select collection -->
      {#if showSaveDropdown}
        <!-- Backdrop -->
        <button 
          class="fixed inset-0 z-10 cursor-default" 
          onclick={() => showSaveDropdown = false}
          aria-label="close dropdown"
        ></button>
        
        <div class="absolute right-0 mt-2 w-56 border-2 border-bauhaus-black bg-bauhaus-white shadow-[4px_4px_0px_0px_#111111] z-20 select-none">
          <div class="p-2 border-b border-bauhaus-black bg-bauhaus-yellow font-bold text-xs lowercase">
            save to collection
          </div>
          <div class="max-h-48 overflow-y-auto">
            {#if store.collections.length === 0}
              <div class="p-3 text-xs italic text-gray-400 text-center">no collections found</div>
            {:else}
              {#each store.collections as col}
                <button
                  onclick={() => handleSave(col.id)}
                  class="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 border-b border-gray-100 last:border-0 lowercase font-medium cursor-pointer"
                >
                  {col.name}
                </button>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Variable Highlight & Label Details -->
  <div class="flex justify-between items-center text-xs text-gray-600 select-none">
    <div class="flex items-center gap-1.5">
      <span class="font-bold lowercase">request label:</span>
      <Input 
        bind:value={store.activeRequest.name} 
        placeholder="request name" 
        class="w-64 px-2 py-1 text-xs border border-bauhaus-black bg-gray-50 focus:bg-white" 
      />
    </div>
  </div>

  <!-- Tabs (Params / Headers / Body) -->
  <div class="border-t border-bauhaus-black pt-4 select-none">
    <div class="flex border-b border-bauhaus-black">
      <button
        onclick={() => activeTab = 'params'}
        class="px-5 py-2 text-xs font-bold border-t border-l border-r border-bauhaus-black -mb-[1px] focus:outline-none transition-colors {activeTab === 'params' ? 'bg-bauhaus-yellow border-b border-bauhaus-yellow text-bauhaus-black' : 'bg-white border-b border-bauhaus-black text-gray-500 hover:text-bauhaus-black'}"
      >
        params ({store.activeRequest.params.filter(p => p.key || p.value).length})
      </button>
      <button
        onclick={() => activeTab = 'headers'}
        class="px-5 py-2 text-xs font-bold border-t border-l border-r border-bauhaus-black -mb-[1px] focus:outline-none transition-colors {activeTab === 'headers' ? 'bg-bauhaus-blue border-b border-bauhaus-blue text-white' : 'bg-white border-b border-bauhaus-black text-gray-500 hover:text-bauhaus-black'}"
      >
        headers ({store.activeRequest.headers.filter(h => h.key || h.value).length})
      </button>
      <button
        onclick={() => activeTab = 'body'}
        class="px-5 py-2 text-xs font-bold border-t border-l border-r border-bauhaus-black -mb-[1px] focus:outline-none transition-colors {activeTab === 'body' ? 'bg-bauhaus-red border-b border-bauhaus-red text-white' : 'bg-white border-b border-bauhaus-black text-gray-500 hover:text-bauhaus-black'}"
      >
        body
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="py-4">
      <!-- 1. PARAMS TAB -->
      {#if activeTab === 'params'}
        <div class="border-2 border-bauhaus-black overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-gray-100 border-b-2 border-bauhaus-black font-bold">
              <tr>
                <th class="w-12 p-2 border-r-2 border-bauhaus-black text-center"></th>
                <th class="p-2 border-r-2 border-bauhaus-black">key</th>
                <th class="p-2 border-r-2 border-bauhaus-black">value</th>
                <th class="w-12 p-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {#each store.activeRequest.params as param, index}
                <tr class="border-b-2 last:border-0 border-bauhaus-black bg-white">
                  <!-- Checkbox -->
                  <td class="p-1.5 border-r-2 border-bauhaus-black text-center">
                    <button 
                      onclick={() => toggleParamEnabled(index)}
                      class="focus:outline-none"
                    >
                      {#if param.enabled}
                        <CheckSquare size={16} class="text-bauhaus-black fill-bauhaus-yellow mx-auto" />
                      {:else}
                        <Square size={16} class="text-gray-400 mx-auto" />
                      {/if}
                    </button>
                  </td>
                  
                  <!-- Key input -->
                  <td class="p-1 border-r-2 border-bauhaus-black">
                    <input
                      type="text"
                      bind:value={param.key}
                      placeholder="query parameter"
                      oninput={handleParamChange}
                      class="w-full bg-transparent p-1 focus:outline-none font-mono text-xs"
                    />
                  </td>

                  <!-- Value input -->
                  <td class="p-1 border-r-2 border-bauhaus-black">
                    <input
                      type="text"
                      bind:value={param.value}
                      placeholder="value"
                      oninput={handleParamChange}
                      class="w-full bg-transparent p-1 focus:outline-none font-mono text-xs"
                    />
                  </td>

                  <!-- Delete row -->
                  <td class="p-1 text-center">
                    {#if index < store.activeRequest.params.length - 1}
                      <button
                        onclick={() => removeParam(index)}
                        class="text-gray-400 hover:text-bauhaus-red focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- 2. HEADERS TAB -->
      {#if activeTab === 'headers'}
        <div class="border-2 border-bauhaus-black overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-gray-100 border-b-2 border-bauhaus-black font-bold">
              <tr>
                <th class="w-12 p-2 border-r-2 border-bauhaus-black text-center"></th>
                <th class="p-2 border-r-2 border-bauhaus-black">key</th>
                <th class="p-2 border-r-2 border-bauhaus-black">value</th>
                <th class="w-12 p-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {#each store.activeRequest.headers as header, index}
                <tr class="border-b-2 last:border-0 border-bauhaus-black bg-white">
                  <!-- Checkbox -->
                  <td class="p-1.5 border-r-2 border-bauhaus-black text-center">
                    <button 
                      onclick={() => toggleHeaderEnabled(index)}
                      class="focus:outline-none"
                    >
                      {#if header.enabled}
                        <CheckSquare size={16} class="text-bauhaus-white fill-bauhaus-blue mx-auto" />
                      {:else}
                        <Square size={16} class="text-gray-400 mx-auto" />
                      {/if}
                    </button>
                  </td>
                  
                  <!-- Key input -->
                  <td class="p-1 border-r-2 border-bauhaus-black">
                    <input
                      type="text"
                      bind:value={header.key}
                      placeholder="header name"
                      class="w-full bg-transparent p-1 focus:outline-none font-mono text-xs"
                    />
                  </td>

                  <!-- Value input -->
                  <td class="p-1 border-r-2 border-bauhaus-black">
                    <input
                      type="text"
                      bind:value={header.value}
                      placeholder="value"
                      class="w-full bg-transparent p-1 focus:outline-none font-mono text-xs"
                    />
                  </td>

                  <!-- Delete row -->
                  <td class="p-1 text-center">
                    {#if index < store.activeRequest.headers.length - 1}
                      <button
                        onclick={() => removeHeader(index)}
                        class="text-gray-400 hover:text-bauhaus-red focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- 3. BODY TAB -->
      {#if activeTab === 'body'}
        <div class="space-y-2">
          <div class="flex justify-between items-center text-xs text-gray-500 font-bold select-none">
            <span>raw request body (json/text)</span>
            <button 
              onclick={() => {
                const hasContentType = store.activeRequest.headers.some(h => h.key.toLowerCase() === 'content-type');
                if (!hasContentType) {
                  store.activeRequest.headers.unshift({ key: 'Content-Type', value: 'application/json', enabled: true });
                }
              }}
              class="text-bauhaus-blue hover:underline cursor-pointer focus:outline-none"
            >
              set application/json header
            </button>
          </div>
          <Input
            textarea
            bind:value={store.activeRequest.body}
            placeholder={'{\n  "key": "value"\n}'}
            rows={8}
            class="font-mono text-xs"
          />
        </div>
      {/if}
    </div>
  </div>
</div>
