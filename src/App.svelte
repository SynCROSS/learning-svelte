<script>
  import { fade } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';

  let visible = true;

  function spin(node, { duration }) {
    return {
      duration,
      css: t => {
        const eased = elasticOut(t);

        return `
					transform: scale(${eased}) rotate(${eased * 1080}deg);
					color: hsl(
						${~~(t * 360)},
						${Math.min(100, 1000 - 1000 * t)}%,
						${Math.min(50, 500 - 500 * t)}%
          );`;
      },
    };
  }
</script>

<label>
  <input type="checkbox" bind:checked={visible} />
  visible
</label>

{#if visible}
  <div class="centered" in:spin={{ duration: 8000 }} out:fade>
    <span>transitions!</span>
  </div>
{/if}
<br />
The function takes two arguments — the node to which the transition is applied,
<br />
and any parameters that were passed in — and returns a transition object which can
have the following properties:

<ul>
  <li>delay — milliseconds before the transition begins</li>
  <li>duration — length of the transition in milliseconds</li>
  <li>easing — a p =&gt; t easing function (see the chapter on )</li>
  <li>css — a (t, u) =&gt; css function, where u === 1 - t</li>
  <li>
    tick — a (t, u) =&gt; &lbrace;...&rbrace; function that has some effect on
    the node
  </li>
</ul>
The t value is 0 at the beginning of an intro or the end of an outro, and 1 at the
end of an intro or beginning of an outro.<br />Most of the time you should
return the css property and not the tick property, as CSS animations run off the
main thread to prevent jank where possible.<br />
Svelte 'simulates' the transition and constructs a CSS animation, then lets it run.

<style>
  .centered {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  span {
    position: absolute;
    transform: translate(-50%, -50%);
    font-size: 4em;
  }
</style>
