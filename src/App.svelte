<script>
  let todos = [];

  function add() {
    todos.reverse();
    todos = todos.concat({ done: false, text: '' });
    todos.reverse();
  }

  function clear() {
    todos = todos.filter(t => !t.done);
  }
  const selectAllTrue = () => {
    const checkboxes = document.querySelectorAll("input[type='checkbox']");

    if (todos.length === 0) {
      return false;
    }
    for (const todo of todos) {
      todo.done = !todo.done;
      for (const checkbox of checkboxes) {
        checkbox.checked = todo.done;
      }
    }
  };

  $: remaining = todos.filter(t => !t.done).length;
</script>

<h1>Todos</h1>

<button on:click={selectAllTrue}>Select All</button>

{#each todos as todo}
  <div class:done={todo.done}>
    <input type="checkbox" bind:checked={todo.done} />

    <input placeholder="What needs to be done?" bind:value={todo.text} />
  </div>
{/each}

<p>{remaining} remaining</p>

<button on:click={add}> Add new </button>

<button on:click={clear}> Clear completed </button>

<style>
  .done {
    opacity: 0.4;
  }
</style>
