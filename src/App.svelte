<script>
  import { onInterval } from './utils';
  // import { onDestroy } from 'svelte';

  let seconds = 0;
  onInterval(() => (seconds += 1), 1000);
  // const interval = setInterval(() => seconds += 1, 1000);

  // onDestroy(() => clearInterval(interval));
</script>

<p>
  The page has been open for
  {seconds}
  {seconds === 1 ? 'second' : 'seconds'}
</p>
