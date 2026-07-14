<script lang="ts">
  import { onMount } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { json } from '@codemirror/lang-json';

  interface Props {
    value: string;
    disabled?: boolean;
    class?: string;
  }

  let {
    value = $bindable(),
    disabled = false,
    class: customClass = ''
  }: Props = $props();

  let editorElement = $state<HTMLDivElement | null>(null);
  let view: EditorView | null = null;
  let isUpdatingFromEditor = false;

  onMount(() => {
    if (!editorElement) return;

    view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && view) {
            isUpdatingFromEditor = true;
            value = view.state.doc.toString();
            isUpdatingFromEditor = false;
          }
        }),
        EditorView.editable.of(!disabled)
      ],
      parent: editorElement
    });

    return () => {
      if (view) {
        view.destroy();
      }
    };
  });

  // Sync external changes (like switching requests in history/collection) back to CodeMirror doc
  $effect(() => {
    if (view && !isUpdatingFromEditor) {
      const currentValue = view.state.doc.toString();
      if (value !== currentValue) {
        view.dispatch({
          changes: { from: 0, to: currentValue.length, insert: value || '' }
        });
      }
    }
  });
</script>

<div bind:this={editorElement} class="bauhaus-json-editor {customClass}"></div>

<style>
  .bauhaus-json-editor {
    width: 100%;
    border: 2px solid var(--bauhaus-black);
    background-color: var(--bauhaus-white);
    font-size: 0.9rem;
    outline: none;
    text-align: left;
  }

  /* Style CodeMirror inner elements to match the Bauhaus look */
  :global(.cm-editor) {
    height: 280px;
    font-family: monospace;
  }

  :global(.cm-scroller) {
    overflow: auto;
  }

  :global(.cm-gutters) {
    background-color: var(--bauhaus-grid-bg) !important;
    border-right: 2px solid var(--bauhaus-black) !important;
    color: var(--bauhaus-black) !important;
    font-family: var(--font-display) !important;
    font-weight: 700;
  }

  :global(.cm-gutterElement) {
    font-size: 0.75rem;
    font-family: var(--font-display);
  }

  :global(.cm-content) {
    caret-color: var(--bauhaus-black);
    padding: 8px 0;
  }

  :global(.cm-line) {
    padding-left: 8px !important;
  }

  :global(.cm-focused) {
    outline: none !important;
  }
</style>
