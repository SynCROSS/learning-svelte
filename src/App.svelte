<script>
  const layers = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  let y;
</script>

<svelte:window bind:scrollY={y} />

<a class="parallax-container" href="https://www.firewatchgame.com">
  {#each layers as layer}
    <img
      style="transform: translate(0,{(-y * layer) / (layers.length - 1)}px)"
      src="https://www.firewatchgame.com/images/parallax/parallax{layer}.png"
      alt="parallax layer {layer}"
    />
  {/each}
</a>

<div class="text">
  <span style="opacity: {1 - Math.max(0, y / 40)}"> scroll down </span>

  <div class="foreground">
    You have scrolled {y} pixels
  </div>

  <div class="foreground">
    The list of properties you can bind to is as follows:

    <ul>
      <li>innerWidth</li>
      <li>innerHeight</li>
      <li>outerWidth</li>
      <li>outerHeight</li>
      <li>scrollX</li>
      <li>scrollY</li>
      <li>online — an alias for window.navigator.onLine</li>
    </ul>
    All except scrollX and scrollY are readonly.
  </div>
</div>

<style>
  .parallax-container {
    position: fixed;
    width: 2400px;
    height: 712px;
    left: 50%;
    transform: translate(-50%, 0);
  }

  .parallax-container img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    will-change: transform;
  }

  .parallax-container img:last-child::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgb(45, 10, 13);
  }

  .text {
    position: relative;
    width: 100%;
    height: 300vh;
    color: rgb(220, 113, 43);
    text-align: center;
    padding: 4em 0.5em 0.5em 0.5em;
    box-sizing: border-box;
    pointer-events: none;
  }

  span {
    display: block;
    font-size: 1em;
    text-transform: uppercase;
    will-change: transform, opacity;
  }

  .foreground {
    position: absolute;
    top: 711px;
    left: 0;
    width: 100%;
    height: calc(100% - 712px);
    background-color: rgb(32, 0, 1);
    color: white;
    padding: 50vh 0 0 0;
  }

  ul {
    list-style: none;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: rgb(253, 174, 51);
  }
</style>
