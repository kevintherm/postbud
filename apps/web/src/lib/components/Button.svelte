<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    onclick?: (event: MouseEvent) => void;
    variant?: 'primary' | 'yellow' | 'blue' | 'red' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    children?: Snippet;
  }

  let {
    onclick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    class: customClass = '',
    children
  }: Props = $props();
</script>

<button
  {type}
  {disabled}
  onclick={onclick}
  class="bauhaus-btn {variant} {size} {customClass}"
>
  {@render children?.()}
</button>

<style>
  .bauhaus-btn {
    font-family: var(--font-display);
    font-weight: 700;
    text-transform: lowercase;
    border: 2px solid var(--bauhaus-black);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.05s ease, color 0.05s ease;
    user-select: none;
    outline: none;
  }

  .bauhaus-btn:focus-visible {
    outline: 2px solid var(--bauhaus-blue);
    outline-offset: 2px;
  }

  .bauhaus-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background-color: #E2E2DF !important;
    color: #8A8A85 !important;
  }

  /* Sizes */
  .sm {
    padding: 4px 8px;
    font-size: 0.8rem;
  }

  .md {
    padding: 8px 16px;
    font-size: 0.95rem;
  }

  .lg {
    padding: 12px 24px;
    font-size: 1.1rem;
  }

  /* Variants */
  .primary {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white);
  }
  .primary:hover:not(:disabled) {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }
  .primary:active:not(:disabled) {
    background-color: var(--bauhaus-red);
  }

  .yellow {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }
  .yellow:hover:not(:disabled) {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white);
  }
  .yellow:active:not(:disabled) {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }

  .blue {
    background-color: var(--bauhaus-blue);
    color: var(--bauhaus-white);
  }
  .blue:hover:not(:disabled) {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white);
  }
  .blue:active:not(:disabled) {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }

  .red {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }
  .red:hover:not(:disabled) {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white);
  }
  .red:active:not(:disabled) {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .outline {
    background-color: var(--bauhaus-white);
    color: var(--bauhaus-black);
  }
  .outline:hover:not(:disabled) {
    background-color: var(--bauhaus-black);
    color: var(--bauhaus-white);
  }
  .outline:active:not(:disabled) {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }
</style>
