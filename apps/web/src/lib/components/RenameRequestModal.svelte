<script lang="ts">
  import { onMount } from 'svelte';
  import Input from './Input.svelte';
  import Button from './Button.svelte';

  let { initialName, onsave, onclose, title = 'rename' } = $props<{
    initialName: string;
    onsave: (name: string) => void;
    onclose: () => void;
    title?: string;
  }>();

  let newName = $state('');
  let inputElement = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

  onMount(() => {
    newName = initialName;
    if (inputElement) {
      inputElement.focus();
      (inputElement as HTMLInputElement).select?.();
    }
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onclose();
  }

  function handleSave(e: SubmitEvent | MouseEvent) {
    if (e) e.preventDefault();
    if (newName.trim()) {
      onsave(newName.trim());
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onclose}>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <form
    class="modal-card bauhaus-card"
    onsubmit={handleSave}
    onclick={(e) => e.stopPropagation()}
  >
    <div class="modal-header-accent"></div>

    <div class="modal-body">
      <h3 class="modal-title">{title}</h3>

      <div class="field-wrapper">
        <Input
          label="name"
          type="text"
          bind:value={newName}
          placeholder="e.g. get profiles"
          bind:element={inputElement}
        />
      </div>
    </div>

    <div class="modal-footer">
      <Button variant="outline" onclick={onclose}>cancel</Button>
      <Button type="submit" variant="primary" disabled={!newName.trim()}>save</Button>
    </div>
  </form>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(17, 17, 17, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .modal-card {
    width: 100%;
    max-width: 400px;
    background-color: var(--bauhaus-white);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 2px solid var(--bauhaus-black);
  }

  .modal-header-accent {
    height: 8px;
    background-color: var(--bauhaus-blue);
    border-bottom: 2px solid var(--bauhaus-black);
  }

  .modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.2rem;
    text-transform: lowercase;
    margin: 0;
    color: var(--bauhaus-black);
  }

  .field-wrapper {
    width: 100%;
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 2px solid var(--bauhaus-black);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background-color: var(--bauhaus-grid-bg);
  }
</style>
