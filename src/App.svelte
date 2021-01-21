<script>
  import Hoverable from './Hoverable.svelte';
</script>

<Hoverable let:hovering={active}>
  <div class:active>
    {#if active}
      <p>I am being hovered upon.</p>
    {:else}
      <p>Hover over me!</p>
    {/if}
  </div>
</Hoverable>

<p>
  Named slots can also have props; use the let directive on an element with a
  slot="..." attribute, instead of on the component itself.
</p>

<style>
  div {
    padding: 1em;
    margin: 0 0 1em 0;
    background-color: #eee;
  }

  .active {
    background-color: #dc143c;
    color: white;
  }
</style>
