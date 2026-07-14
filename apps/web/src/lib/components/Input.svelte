<script>
  let { 
    value = $bindable(''), 
    type = 'text', 
    placeholder = '', 
    textarea = false,
    rows = 3,
    class: className = '',
    ...rest 
  } = $props();
</script>

{#if textarea}
  <textarea
    bind:value
    {placeholder}
    {rows}
    class="w-full px-4 py-2.5 bg-bauhaus-white text-bauhaus-black border-2 border-bauhaus-black font-mono text-sm focus:outline-none focus:bg-gray-100 transition-colors resize-y placeholder:text-gray-400 {className}"
    {...rest}
  ></textarea>
{:else}
  <input
    {type}
    bind:value
    {placeholder}
    class="w-full px-4 py-2.5 bg-bauhaus-white text-bauhaus-black border-2 border-bauhaus-black text-sm focus:outline-none focus:bg-gray-100 transition-colors placeholder:text-gray-400 {className}"
    {...rest}
  />
{/if}
