<script>
  let { 
    variant = 'black', 
    type = 'button', 
    disabled = false, 
    onclick, 
    children, 
    class: className = '',
    ...rest 
  } = $props();

  const variants = {
    black: 'bg-bauhaus-black text-bauhaus-white hover:bg-bauhaus-red hover:text-bauhaus-white active:bg-bauhaus-blue active:text-bauhaus-white',
    yellow: 'bg-bauhaus-yellow text-bauhaus-black hover:bg-bauhaus-black hover:text-bauhaus-white active:bg-bauhaus-blue active:text-bauhaus-white',
    blue: 'bg-bauhaus-blue text-bauhaus-white hover:bg-bauhaus-black hover:text-bauhaus-white active:bg-bauhaus-red active:text-bauhaus-white',
    red: 'bg-bauhaus-red text-bauhaus-white hover:bg-bauhaus-black hover:text-bauhaus-white active:bg-bauhaus-yellow active:text-bauhaus-black',
    white: 'bg-bauhaus-white text-bauhaus-black hover:bg-bauhaus-yellow active:bg-bauhaus-blue active:text-bauhaus-white'
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="px-5 py-2.5 font-bold border-2 border-bauhaus-black transition-all duration-150 tracking-wider focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase text-sm {variants[variant]} {className}"
  {...rest}
>
  {@render children?.()}
</button>
