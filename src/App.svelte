<script>
  let user = {
    firstname: 'Ada',
    lastname: 'Lovelace',
  };
</script>

<input bind:value={user.firstname} />
<input bind:value={user.lastname} />

{@debug user}

<h1>Hello {user.firstname}!</h1>

<p>
  If you want to pause execution, though, you can use the &lbrace;@debug
  ...&rbrace; tag with a comma-separated list of values you want to inspect:
</p>
