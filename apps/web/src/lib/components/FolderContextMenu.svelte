<script lang="ts">
  let { x, y, onaddrequest, onrename, ondelete, onclose } = $props<{
    x: number;
    y: number;
    onaddrequest: () => void;
    onrename: () => void;
    ondelete: () => void;
    onclose: () => void;
  }>();

  let element = $state<HTMLDivElement | null>(null);
  let posX = $state(0);
  let posY = $state(0);

  $effect(() => {
    posX = x;
    posY = y;
    if (element) {
      const rect = element.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      if (x + rect.width > winWidth) posX = winWidth - rect.width - 8;
      if (y + rect.height > winHeight) posY = winHeight - rect.height - 8;
    }
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={handleKeydown} onclick={onclose} oncontextmenu={onclose} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={element}
  class="context-menu"
  role="menu"
  tabindex="-1"
  style="top: {posY}px; left: {posX}px;"
  onclick={(e) => e.stopPropagation()}
  oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
>
  <button
    type="button"
    class="menu-item"
    onclick={() => { onaddrequest(); onclose(); }}
  >
    <span class="label">add request</span>
  </button>
  <button
    type="button"
    class="menu-item"
    onclick={() => { onrename(); onclose(); }}
  >
    <span class="label">rename folder</span>
    <span class="shortcut">f2</span>
  </button>
  <button
    type="button"
    class="menu-item item-delete"
    onclick={() => { ondelete(); onclose(); }}
  >
    <span class="label text-delete">delete folder</span>
    <span class="shortcut text-delete">del</span>
  </button>
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 1000;
    background-color: var(--bauhaus-white);
    border: 2px solid var(--bauhaus-black);
    width: 180px;
    display: flex;
    flex-direction: column;
  }

  .menu-item {
    background: none;
    border: none;
    border-bottom: 1px solid var(--bauhaus-black);
    padding: 8px 12px;
    text-align: left;
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-transform: lowercase;
    transition: background-color 0.1s ease;
  }

  .menu-item:last-child {
    border-bottom: none;
  }

  .menu-item:hover {
    background-color: var(--bauhaus-yellow);
    color: var(--bauhaus-black);
  }

  .menu-item.item-delete:hover {
    background-color: var(--bauhaus-red);
    color: var(--bauhaus-white);
  }

  .label {
    flex: 1;
  }

  .shortcut {
    color: #8A8A85;
    font-size: 0.75rem;
    font-weight: 400;
  }

  .menu-item.item-delete:hover .text-delete {
    color: var(--bauhaus-white);
  }
</style>
