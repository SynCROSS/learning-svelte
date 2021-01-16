<script>
  import { name, greeting } from './stores.js';
</script>

<h1>{$greeting}</h1>
<input bind:value={$name} />
<div class="button_wrap">
  <button on:click={() => name.set($name + '!')}>
    Add exclamation mark!
  </button>
</div>
