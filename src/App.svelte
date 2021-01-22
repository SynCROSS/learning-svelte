<script>
  import Todo from './Todo.svelte';

  let todos = [
    { id: 1, done: false, text: 'wash the car' },
    { id: 2, done: false, text: 'take the dog for a walk' },
    { id: 3, done: false, text: 'mow the lawn' },
  ];

  function toggle(toggled) {
    todos = todos.map(todo => {
      if (todo === toggled) {
        // return a new object
        return {
          id: todo.id,
          text: todo.text,
          done: !todo.done,
        };
      }

      // return the same object
      return todo;
    });
  }
</script>

<h2>Todos</h2>
{#each todos as todo}
  <Todo {todo} on:click={() => toggle(todo)} />
{/each}

<p>
  Lastly, &lt;svelte:options&gt; allows you to specify compiler options. We'll
  use the immutable option as an example. In this app, the &lt;Todo&gt;
  component flashes whenever it receives new data. Clicking on one of the items
  toggles its done state by creating an updated todos array. This causes the
  other &lt;Todo&gt; items to flash, even though they don't end up making any
  changes to the DOM. We can optimise this by telling the &lt;Todo&gt; component
  to expect immutable data. This means that we're promising never to mutate the
  todo prop, but will instead create new todo objects whenever things change.
</p>

The options that can be set here are:
<ul>
  <li>
    immutable=&lbrace;true&rbrace; — you never use mutable data, so the compiler
    can do simple referential equality checks to determine if values have
    changed
  </li>
  <li>
    immutable=&lbrace;false&rbrace; — the default. Svelte will be more
    conservative about whether or not mutable objects have changed
  </li>
  <li>
    accessors=&lbrace;true&rbrace; — adds getters and setters for the
    component's props
  </li>
  <li>accessors=&lbrace;false&rbrace; — the default</li>
  <li>
    namespace="..." — the namespace where this component will be used, most
    commonly "svg"
  </li>
  <li>
    tag="..." — the name to use when compiling this component as a custom
    element
  </li>
</ul>
