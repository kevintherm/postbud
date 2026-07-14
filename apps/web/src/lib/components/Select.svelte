<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    value: string;
    options: Option[] | string[];
    label?: string;
    disabled?: boolean;
    class?: string;
  }

  let {
    value = $bindable(),
    options,
    label,
    disabled = false,
    class: customClass = ''
  }: Props = $props();

  let normalizedOptions = $derived(
    options.map(opt => typeof opt === 'string' ? { value: opt, label: opt } : opt)
  );

  const id = 'select-' + Math.random().toString(36).substring(2, 9);
</script>

<div class="select-wrapper {customClass}">
  {#if label}
    <label for={id} class="select-label">{label}</label>
  {/if}

  <div class="select-container">
    <select {id} bind:value {disabled} class="bauhaus-select">
      {#each normalizedOptions as opt}
        <option value={opt.value}>{opt.label.toLowerCase()}</option>
      {/each}
    </select>
    <div class="select-arrow">▼</div>
  </div>
</div>

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .select-label {
    margin-bottom: 4px;
    display: block;
  }

  .select-container {
    position: relative;
    width: 100%;
  }

  .bauhaus-select {
    width: 100%;
    border: 2px solid var(--bauhaus-black);
    padding: 8px 32px 8px 12px;
    background-color: var(--bauhaus-white);
    color: var(--bauhaus-black);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.9rem;
    text-transform: lowercase;
    appearance: none;
    outline: none;
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .bauhaus-select:focus {
    background-color: var(--bauhaus-grid-bg);
    border-color: var(--bauhaus-blue);
  }

  .bauhaus-select:disabled {
    background-color: #E2E2DF;
    color: #8A8A85;
    cursor: not-allowed;
  }

  .select-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.65rem;
    pointer-events: none;
    color: var(--bauhaus-black);
  }

  option {
    font-family: var(--font-display);
    font-weight: 700;
    background-color: var(--bauhaus-white);
    color: var(--bauhaus-black);
  }
</style>
