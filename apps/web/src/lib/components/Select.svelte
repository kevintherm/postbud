<script>
  let { 
    value = $bindable(''), 
    children, 
    class: className = '',
    ...rest 
  } = $props();
</script>

<div class="relative inline-block {className}">
  <select
    bind:value
    class="appearance-none w-full bg-bauhaus-white text-bauhaus-black border-2 border-bauhaus-black px-4 py-2.5 pr-10 text-sm font-bold focus:outline-none focus:bg-gray-100 cursor-pointer uppercase tracking-wider"
    {...rest}
  >
    {@render children?.()}
  </select>
  <!-- Bauhaus geometric dropdown indicator (black diamond rotating inside a yellow border box) -->
  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 border-l-2 border-bauhaus-black bg-bauhaus-yellow">
    <div class="w-1.5 h-1.5 bg-bauhaus-black rotate-45"></div>
  </div>
</div>
