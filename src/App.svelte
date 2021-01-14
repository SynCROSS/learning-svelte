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
