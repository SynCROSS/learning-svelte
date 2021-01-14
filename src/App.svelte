<script>
  let count = 0;
  let clicked = '';
  function handleClick() {
    ++count;

    if (count === 1) {
      clicked = 'once';
    } else if (count === 2) {
      clicked = 'twice';
    } else {
      clicked = count + 'times';
    }

    alert('clicked ' + clicked);
  }
</script>

<button on:click|once={handleClick}
  >Don't touch this code and Click me more than Twice if you can</button
>
<p>The full list of modifiers:</p>
<ul>
  <li>
    preventDefault — calls event.preventDefault() before running the handler.
    Useful for client-side form handling, for example.
  </li>
  <li>
    stopPropagation — calls event.stopPropagation(), preventing the event
    reaching the next element
  </li>
  <li>
    passive — improves scrolling performance on touch/wheel events (Svelte will
    add it automatically where it's safe to do so)
  </li>
  <li>nonpassive — explicitly set passive: false</li>
  <li>
    capture — fires the handler during the capture phase instead of the bubbling
    phase ()
  </li>
  <li>once — remove the handler after the first time it runs</li>
  <li>self — only trigger handler if event.target is the element itself</li>
</ul>
You can chain modifiers together, e.g. on:click|once|capture=&lbrace;...&rbrace;
