<script>
  import { store } from './store.svelte.js';
  import Button from './components/Button.svelte';
  import Input from './components/Input.svelte';
  import Select from './components/Select.svelte';
  import { Folder, History, Settings, Play, Save, Trash2, Plus, X, CheckSquare, Square, LogIn } from 'lucide-svelte';

  let { isCollapsed = $bindable(false) } = $props();

  let activeTab = $state('collections'); // 'history' | 'collections' | 'environments'
  let newCollectionName = $state('');
  
  // Environment editing local states
  let newEnvName = $state('');
  
  function handleAddCollection() {
    if (!newCollectionName.trim()) return;
    store.addCollection(newCollectionName.trim());
    newCollectionName = '';
  }

  function handleAddEnv() {
    if (!newEnvName.trim()) return;
    const newId = Math.random().toString(36).substring(2, 9);
    store.environments = [...store.environments, {
      id: newId,
      name: newEnvName.trim(),
      variables: [{ key: '', value: '', enabled: true }]
    }];
    store.activeEnvId = newId;
    newEnvName = '';
  }

  function handleDeleteEnv(id) {
    if (store.environments.length <= 1) return;
    const oldActiveId = store.activeEnvId;
    store.deleteEnvironment(id);
    if (oldActiveId === id) {
      store.activeEnvId = store.environments[0]?.id || '';
    }
  }

  function addVariable(envId) {
    const envIndex = store.environments.findIndex(e => e.id === envId);
    if (envIndex === -1) return;
    store.environments[envIndex].variables.push({ key: '', value: '', enabled: true });
    store.environments = [...store.environments];
  }

  function removeVariable(envId, varIndex) {
    const envIndex = store.environments.findIndex(e => e.id === envId);
    if (envIndex === -1) return;
    store.environments[envIndex].variables = store.environments[envIndex].variables.filter((_, idx) => idx !== varIndex);
    if (store.environments[envIndex].variables.length === 0) {
      store.environments[envIndex].variables.push({ key: '', value: '', enabled: true });
    }
    store.environments = [...store.environments];
  }

  // Method styling mapping
  const methodColors = {
    GET: 'bg-bauhaus-blue text-bauhaus-white',
    POST: 'bg-bauhaus-yellow text-bauhaus-black',
    PUT: 'bg-bauhaus-black text-bauhaus-white border-2 border-bauhaus-white',
    PATCH: 'bg-bauhaus-red text-bauhaus-white',
    DELETE: 'bg-bauhaus-red text-bauhaus-white'
  };

  const getMethodBadgeClass = (method) => {
    return `text-[10px] font-bold px-1.5 py-0.5 border-r border-bauhaus-black w-14 text-center select-none uppercase shrink-0 ${methodColors[method] || 'bg-gray-300 text-black'}`;
  };
</script>

<aside class="border-r-2 border-bauhaus-black flex flex-col h-full bg-bauhaus-white transition-all duration-300 {isCollapsed ? 'w-[60px]' : 'w-[340px]'}" id="sidebar">
  {#if isCollapsed}
    <!-- Collapsed View -->
    <div class="p-3 border-b-2 border-bauhaus-black bg-bauhaus-yellow flex justify-center items-center">
      <button 
        onclick={() => isCollapsed = false} 
        class="w-8 h-8 flex items-center justify-center border-2 border-bauhaus-black bg-bauhaus-white hover:bg-gray-100 cursor-pointer font-bold font-mono"
        title="expand sidebar"
      >
        &gt;
      </button>
    </div>
    <div class="flex-1 flex flex-col items-center justify-center p-2 bg-bauhaus-grid-bg/50 gap-4">
      <div class="w-8 h-8 rounded-full bg-bauhaus-blue border-2 border-bauhaus-black"></div>
      <div class="w-8 h-8 bg-bauhaus-red border-2 border-bauhaus-black"></div>
      <div class="w-8 h-8 rotate-45 bg-bauhaus-yellow border-2 border-bauhaus-black"></div>
    </div>
    <div class="p-3 border-t-2 border-bauhaus-black bg-bauhaus-black flex justify-center items-center">
      <button 
        onclick={() => store.showAuth = true}
        class="w-8 h-8 flex items-center justify-center border-2 border-bauhaus-black bg-bauhaus-white text-bauhaus-black hover:bg-bauhaus-yellow cursor-pointer"
        title="profile/login"
      >
        <LogIn size={16} />
      </button>
    </div>
  {:else}
    <!-- Expanded View -->
    <div class="p-6 border-b-2 border-bauhaus-black bg-bauhaus-yellow flex justify-between items-center select-none">
      <h1 class="text-3xl font-black font-bauhaus tracking-tighter text-bauhaus-black lowercase">
        postbud
      </h1>
      <button 
        onclick={() => isCollapsed = true}
        class="w-8 h-8 flex items-center justify-center border-2 border-bauhaus-black bg-bauhaus-white hover:bg-gray-100 cursor-pointer font-bold font-mono"
        title="collapse sidebar"
      >
        &lt;
      </button>
    </div>

    <!-- Sidebar Tab Navigation -->
    <nav class="flex border-b-2 border-bauhaus-black select-none bg-bauhaus-black">
      <button 
        onclick={() => activeTab = 'collections'}
        class="flex-1 py-3 text-center text-xs font-bold border-r border-bauhaus-black focus:outline-none transition-colors {activeTab === 'collections' ? 'bg-bauhaus-white text-bauhaus-black' : 'bg-bauhaus-black text-bauhaus-white hover:bg-gray-800'}"
      >
        collections
      </button>
      <button 
        onclick={() => activeTab = 'history'}
        class="flex-1 py-3 text-center text-xs font-bold border-r border-bauhaus-black focus:outline-none transition-colors {activeTab === 'history' ? 'bg-bauhaus-white text-bauhaus-black' : 'bg-bauhaus-black text-bauhaus-white hover:bg-gray-800'}"
      >
        history
      </button>
      <button 
        onclick={() => activeTab = 'environments'}
        class="flex-1 py-3 text-center text-xs font-bold focus:outline-none transition-colors {activeTab === 'environments' ? 'bg-bauhaus-white text-bauhaus-black' : 'bg-bauhaus-black text-bauhaus-white hover:bg-gray-800'}"
      >
        environments
      </button>
    </nav>

    <!-- Panel Contents -->
    <div class="flex-1 overflow-y-auto p-4 bg-bauhaus-grid-bg/50">
      
      <!-- 1. COLLECTIONS TAB -->
      {#if activeTab === 'collections'}
        <div class="space-y-4">
          <div class="flex gap-2">
            <Input 
              bind:value={newCollectionName} 
              placeholder="new collection name" 
              class="flex-1"
              onkeydown={(e) => e.key === 'Enter' && handleAddCollection()}
            />
            <Button variant="black" class="px-3" onclick={handleAddCollection}>
              <Plus size={16} />
            </Button>
          </div>

          <div class="space-y-3">
            {#each store.collections as col (col.id)}
              <div class="border-2 border-bauhaus-black bg-bauhaus-white">
                <div class="flex justify-between items-center p-3 border-b-2 border-bauhaus-black bg-gray-100 select-none">
                  <span class="font-bold text-sm lowercase">{col.name}</span>
                  <div class="flex items-center gap-1">
                    <button 
                      onclick={() => store.runBatch(col.id)}
                      disabled={col.requests.length === 0}
                      class="p-1 hover:bg-bauhaus-yellow border border-transparent hover:border-bauhaus-black focus:outline-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="run batch tests"
                    >
                      <Play size={14} class="fill-current text-bauhaus-black" />
                    </button>
                    <button 
                      onclick={() => store.saveToCollection(col.id)}
                      class="p-1 hover:bg-bauhaus-blue hover:text-white border border-transparent hover:border-bauhaus-black focus:outline-none cursor-pointer"
                      title="save current request here"
                    >
                      <Save size={14} />
                    </button>
                    <button 
                      onclick={() => store.deleteCollection(col.id)}
                      disabled={store.collections.length <= 1}
                      class="p-1 hover:bg-bauhaus-red hover:text-white border border-transparent hover:border-bauhaus-black focus:outline-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="delete collection"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div class="divide-y border-bauhaus-black divide-bauhaus-black">
                  {#if !col.requests || col.requests.length === 0}
                    <div class="p-3 text-xs text-gray-400 italic text-center lowercase">empty collection</div>
                  {:else}
                    {#each col.requests as req (req.id)}
                      <div class="group flex items-center justify-between hover:bg-gray-50">
                        <button 
                          onclick={() => store.loadRequest(req)}
                          class="flex-1 flex items-center text-left py-2 focus:outline-none cursor-pointer"
                        >
                          <span class={getMethodBadgeClass(req.method)}>{req.method}</span>
                          <span class="pl-3 text-xs lowercase truncate max-w-[170px]">{req.name}</span>
                        </button>
                        
                        <button 
                          onclick={() => store.deleteFromCollection(col.id, req.id)}
                          class="p-2 opacity-0 group-hover:opacity-100 hover:text-bauhaus-red cursor-pointer focus:outline-none"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 2. HISTORY TAB -->
      {#if activeTab === 'history'}
        <div class="space-y-3">
          {#if store.history.length === 0}
            <div class="p-6 text-center text-xs text-gray-400 italic lowercase border-2 border-dashed border-gray-400 bg-bauhaus-white">
              no request history recorded yet
            </div>
          {:else}
            <div class="flex justify-between items-center border-b border-bauhaus-black pb-2 select-none">
              <span class="text-xs text-gray-500 font-bold">{store.history.length} items</span>
              <button 
                onclick={() => store.clearHistory()}
                class="text-xs font-bold text-bauhaus-red hover:underline focus:outline-none cursor-pointer"
              >
                clear all
              </button>
            </div>

            <div class="space-y-2">
              {#each store.history as item (item.id)}
                <div class="group relative flex items-stretch border-2 border-bauhaus-black bg-bauhaus-white">
                  <button 
                    onclick={() => store.loadRequest(item)}
                    class="flex-1 flex items-center text-left focus:outline-none hover:bg-gray-50 transition-colors cursor-pointer select-none"
                  >
                    <span class={getMethodBadgeClass(item.method)}>{item.method}</span>
                    <div class="flex-1 min-w-0 p-2 flex flex-col justify-center">
                      <span class="text-xs lowercase truncate font-mono">{item.url}</span>
                      <div class="flex justify-between items-center mt-1">
                        <span class="text-[10px] text-gray-400">
                          {item.timestamp ? (new Date(item.timestamp * 1000)).toLocaleTimeString().toLowerCase() : ''}
                        </span>
                        <span class="text-[10px] font-bold px-1 {item.status >= 200 && item.status < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                          {item.status || 'error'}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button 
                    onclick={() => store.deleteHistoryEntry(item.id)}
                    class="px-2 border-l border-bauhaus-black hover:bg-bauhaus-red hover:text-white cursor-pointer focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                    title="delete item"
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- 3. ENVIRONMENTS TAB -->
      {#if activeTab === 'environments'}
        <div class="space-y-4">
          <div class="space-y-1.5 select-none">
            <label for="active-env-selector" class="block text-xs font-bold lowercase text-gray-600">active environment</label>
            <div class="flex gap-2">
              <Select id="active-env-selector" bind:value={store.activeEnvId} class="flex-1">
                {#each store.environments as env (env.id)}
                  <option value={env.id}>{env.name}</option>
                {/each}
              </Select>
              <Button 
                variant="red" 
                onclick={() => handleDeleteEnv(store.activeEnvId)} 
                disabled={store.environments.length <= 1}
                class="px-3"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          <div class="flex gap-2">
            <Input 
              bind:value={newEnvName} 
              placeholder="create environment" 
              class="flex-1"
              onkeydown={(e) => e.key === 'Enter' && handleAddEnv()}
            />
            <Button variant="black" class="px-3" onclick={handleAddEnv}>
              <Plus size={16} />
            </Button>
          </div>

          {#if store.environments.find(e => e.id === store.activeEnvId)}
            {@const activeEnv = store.environments.find(e => e.id === store.activeEnvId)}
            <div class="border-2 border-bauhaus-black bg-bauhaus-white p-3 space-y-3">
              <div class="flex justify-between items-center select-none">
                <span class="text-xs font-bold lowercase text-gray-500">variables for "{activeEnv.name}"</span>
                <button 
                  onclick={() => addVariable(activeEnv.id)}
                  class="flex items-center text-xs font-bold text-bauhaus-blue hover:underline cursor-pointer focus:outline-none"
                >
                  add variable
                </button>
              </div>

              <div class="space-y-2">
                {#each activeEnv.variables as v, index}
                  <div class="flex items-center gap-1.5">
                    <button 
                      onclick={() => { v.enabled = !v.enabled; store.environments = [...store.environments] }}
                      class="p-1 text-gray-600 hover:text-bauhaus-black focus:outline-none cursor-pointer"
                    >
                      {#if v.enabled}
                        <CheckSquare size={16} class="text-bauhaus-black fill-bauhaus-yellow" />
                      {:else}
                        <Square size={16} />
                      {/if}
                    </button>

                    <div class="flex-1 min-w-0">
                      <Input 
                        bind:value={v.key} 
                        placeholder="key" 
                        class="px-2 py-1 font-mono text-xs" 
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <Input 
                        bind:value={v.value} 
                        placeholder="value" 
                        class="px-2 py-1 font-mono text-xs" 
                      />
                    </div>

                    <button 
                      onclick={() => removeVariable(activeEnv.id, index)}
                      class="p-1 hover:text-bauhaus-red focus:outline-none cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

    </div>

    <!-- Auth Footer Panel -->
    <div class="p-4 border-t-2 border-bauhaus-black bg-bauhaus-black flex items-center justify-between text-bauhaus-white select-none">
      {#if store.activeUser}
        <div class="min-w-0 flex flex-col justify-center">
          <span class="text-[10px] text-gray-400 font-bold lowercase">logged in:</span>
          <span class="text-xs truncate font-bold text-bauhaus-yellow lowercase">{store.activeUser.email}</span>
        </div>
        <button 
          onclick={() => store.showAuth = true}
          class="text-xs font-bold border border-bauhaus-white hover:bg-bauhaus-yellow hover:text-bauhaus-black px-2 py-1 transition-colors focus:outline-none cursor-pointer"
        >
          profile
        </button>
      {:else}
        <span class="text-xs text-gray-400 lowercase">offline / guest</span>
        <button 
          onclick={() => store.showAuth = true}
          class="text-xs font-bold bg-bauhaus-yellow text-bauhaus-black hover:bg-bauhaus-white px-2 py-1 transition-colors focus:outline-none cursor-pointer"
        >
          log in / register
        </button>
      {/if}
    </div>
  {/if}
</aside>
