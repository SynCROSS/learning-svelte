<script>
  import Inner from './Inner.svelte';

  // import { createEventDispatcher } from 'svelte';

  // const dispatch = createEventDispatcher();

  // const forward = event => {
  //   dispatch('message', event.detail);
  // };
</script>

<!-- <Inner on:message={forward} /> -->
<Inner on:message />
