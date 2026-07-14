<script lang="ts">
  interface Props {
    value: string;
    type?: 'text' | 'textarea' | 'number' | 'password';
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    class?: string;
    rows?: number;
    onchange?: (e: Event) => void;
  }

  let {
    value = $bindable(),
    type = 'text',
    placeholder = '',
    label,
    disabled = false,
    class: customClass = '',
    rows = 3,
    onchange
  }: Props = $props();

  const id = 'input-' + Math.random().toString(36).substring(2, 9);
</script>

<div class="input-wrapper {customClass}">
  {#if label}
    <label for={id} class="input-label">{label}</label>
  {/if}

  {#if type === 'textarea'}
    <textarea
      {id}
      bind:value
      {placeholder}
      {disabled}
      {rows}
      class="bauhaus-input font-body"
      onchange={onchange}
    ></textarea>
  {:else}
    <input
      {id}
      {type}
      bind:value
      {placeholder}
      {disabled}
      class="bauhaus-input font-body"
      onchange={onchange}
    />
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .input-label {
    margin-bottom: 4px;
    display: block;
  }

  .bauhaus-input {
    width: 100%;
    border: 2px solid var(--bauhaus-black);
    padding: 8px 12px;
    background-color: var(--bauhaus-white);
    color: var(--bauhaus-black);
    font-size: 0.95rem;
    outline: none;
    transition: background-color 0.1s ease;
  }

  .bauhaus-input:focus {
    background-color: var(--bauhaus-grid-bg);
    border-color: var(--bauhaus-blue);
  }

  .bauhaus-input:disabled {
    background-color: #E2E2DF;
    color: #8A8A85;
    cursor: not-allowed;
  }

  textarea.bauhaus-input {
    resize: vertical;
    font-family: inherit;
  }

  .font-body {
    font-family: var(--font-body);
  }
</style>
