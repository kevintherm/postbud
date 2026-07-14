# Gemini Developer Guide (`GEMINI.md`)

This guide is designed for **Gemini models** assisting in the development of the **Postbud** monorepo. It details how to optimize code generation, structure components, and respect the project's strict design and architectural rules.

---

## 1. Core Model Directives

When generating or modifying code for Postbud, follow these strict constraints:

### ⚡ Strict Line Limit (Max 500 Lines)
- Gemini must **never** output code files (HTML, Svelte, JS, PHP, or CSS) that exceed **500 lines**.
- If a proposed solution requires substantial logic, Gemini must proactively design a modular solution, splitting code into multiple files (e.g., extracting Svelte sub-components or PHP controller/handler classes).

### 🔍 Explicit, Readable Code
- Avoid implicit assumptions or highly condensed syntax.
- Write expressive, self-documenting code. Use clear variable names and typed parameters where possible (e.g., PHP 8.x type hinting, JSDoc in JavaScript).

### 🎨 Adherence to Bauhaus CSS
- Ensure all styled elements strictly conform to the CSS custom properties and guidelines in [DESIGN.md](file://DESIGN.md).

---

## 2. Svelte 5 & PWA Architecture

When generating Svelte 5 components:

1. **Use Runes**: Write Svelte 5 components using standard runes (`$state`, `$derived`, `$effect`, `$props`) instead of Svelte 4 legacy syntax (`let`, `$:`, `export let`).
2. **Keep Scripts Concise**: Separate heavy logic (like fetch requests or local DB interactions) into external JS files (e.g., `src/lib/db.js`, `src/lib/sync.js`) to keep Svelte components under the 500-line limit.
3. **PWA Local-First Store**:
   - Store requests and settings in `IndexedDB` (using a lightweight wrapper like `idb` or vanilla IndexedDB) or `localStorage`.
   - Implement a background sync queue that tracks unsynced mutations (creates, updates, deletes) and flushes them to the PHP backend.

### Example: Svelte 5 State structure
```svelte
<script>
  // Destructure props explicitly
  let { requestList = $bindable([]), activeRequest = $bindable(null) } = $props();

  // Explicit state definitions
  let isSyncing = $state(false);
  let syncStatus = $derived(isSyncing ? 'Syncing...' : 'Synced');
</script>

<div class="bauhaus-panel">
  <span class="status-label">{syncStatus.toLowerCase()}</span>
</div>
```

---

## 3. PHP Stout API Architecture

When generating PHP code for `apps/api`:

1. **Folder Structuring**: Code inside `src/` must follow the domain-based structuring under `App\{DomainXXX}\` (e.g., `App\Database\`, `App\OpenApi\`, `App\Auth\`):
   - `src/{DomainXXX}/Controllers/` for controllers and handlers.
   - `src/{DomainXXX}/Models/` for database models.
   - `src/{DomainXXX}/Views/` for views/presentation logic.
   - `src/{DomainXXX}/{Other}/` for other domain elements (services, repositories, providers, etc.).
2. **Routes & Handlers**: Define clean, explicit routes in `app.php`. If route handlers grow large, move the handler logic to separate Controller/Action classes inside `src/{DomainXXX}/Controllers/`.
3. **JSON Payloads**: Ensure all API responses return clean JSON with proper HTTP status codes.
4. **Database Rules**: Use Veloquent to build queries explicitly. Keep models small (placed in `src/{DomainXXX}/Models/`) and split complex business logic.

### Example: Route Definition
```php
$router->post('/api/sync', function (Request $request, Response $response) {
    $payload = $request->getParsedBody();
    
    // Explicit sync handling...
    
    return $response->withJson([
        'status' => 'success',
        'synced_at' => time()
    ]);
});
```

---

## 4. Prompting Templates for Gemini

When instructing Gemini in this repository, you can prefix your prompts with the following template to guarantee alignment:

```text
You are assisting in a Svelte 5 + PHP monorepo project named Postbud.
Refer to DESIGN.md for styling and AGENTS.md/GEMINI.md for architectural limits.
Strict Constraints:
1. No single file can exceed 500 lines. Split logic into small files.
2. Svelte 5 runes ($state, $derived, $props) must be used.
4. Ensure all code is explicit and readable.
```
