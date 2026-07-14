<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    oncomplete?: () => void;
  }

  let { oncomplete }: Props = $props();
  let visible = $state(true);

  onMount(() => {
    const timer = setTimeout(() => {
      visible = false;
      if (oncomplete) oncomplete();
    }, 2200);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="overlay" transition:fade={{ duration: 400 }}>
    <div class="composition-wrapper">
      <div class="composition">
        <div class="shape circle-yellow"></div>
        <div class="shape rect-blue"></div>
        <div class="shape triangle-red"></div>
        <div class="shape line-black"></div>
      </div>
      <div class="branding">
        <h1 class="logo-text">postbud</h1>
        <p class="tagline-text">api client // form follows function</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--bauhaus-white);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    background-image: 
      linear-gradient(rgba(17, 17, 17, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(17, 17, 17, 0.03) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .composition-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }

  .composition {
    position: relative;
    width: 240px;
    height: 240px;
    background-color: var(--bauhaus-white);
    border: 3px solid var(--bauhaus-black);
    overflow: hidden;
  }

  /* Base shapes */
  .shape {
    position: absolute;
    border: 2px solid var(--bauhaus-black);
    opacity: 0;
  }

  .circle-yellow {
    width: 110px;
    height: 110px;
    background-color: var(--bauhaus-yellow);
    border-radius: 50%;
    top: 30px;
    left: 30px;
    transform: scale(0);
    animation: scaleUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
  }

  .rect-blue {
    width: 90px;
    height: 90px;
    background-color: var(--bauhaus-blue);
    bottom: 30px;
    right: 30px;
    transform: translateX(-150%);
    animation: slideIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
  }

  .triangle-red {
    width: 0;
    height: 0;
    border-left: 50px solid transparent;
    border-right: 50px solid transparent;
    border-bottom: 86px solid var(--bauhaus-red);
    border-top: none;
    background: none;
    top: 60px;
    left: 80px;
    transform: rotate(-180deg) scale(0);
    animation: rotateIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards;
  }

  /* Custom borders for CSS triangle is complex, let's keep it clean */
  .triangle-red::after {
    content: '';
    position: absolute;
    left: -50px;
    top: 0;
    width: 0;
    height: 0;
    border-left: 50px solid transparent;
    border-right: 50px solid transparent;
    border-bottom: 86px solid transparent;
  }

  .line-black {
    width: 320px;
    height: 8px;
    background-color: var(--bauhaus-black);
    border: none;
    top: 40px;
    left: -40px;
    transform: rotate(-30deg) scaleX(0);
    transform-origin: left center;
    animation: lineGrow 0.6s cubic-bezier(0.19, 1, 0.22, 1) 1.1s forwards;
  }

  /* Branding */
  .branding {
    text-align: center;
    opacity: 0;
    transform: translateY(20px);
    animation: textReveal 0.6s ease-out 1.3s forwards;
  }

  .logo-text {
    font-size: 2.5rem;
    font-family: var(--font-display);
    font-weight: 800;
    text-transform: lowercase;
    letter-spacing: -0.04em;
    margin-bottom: 4px;
    color: var(--bauhaus-black);
  }

  .tagline-text {
    font-size: 0.9rem;
    font-family: var(--font-display);
    font-weight: 700;
    text-transform: lowercase;
    letter-spacing: 0.05em;
    color: #555;
  }

  /* Keyframes */
  @keyframes scaleUp {
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes slideIn {
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes rotateIn {
    to {
      transform: rotate(45deg) scale(1);
      opacity: 1;
    }
  }

  @keyframes lineGrow {
    to {
      transform: rotate(-30deg) scaleX(1);
      opacity: 1;
    }
  }

  @keyframes textReveal {
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
