<script>
  import AudioPlayer from './AudioPlayer.svelte';
</script>

<p>
  In all the examples we've seen so far, the &lt;script&gt; block contains code
  that runs when each component instance is initialised. <br /> For the vast
  majority of components, that's all you'll ever need. <br /> Very occasionally,
  you'll need to run some code outside of an individual component instance.
  <br />
  For example, you can play all five of these audio players simultaneously; it
  would be better if playing one stopped all the others. <br /> We can do that
  by declaring a &lt;script context="module"&gt; block. <br /> Code contained
  inside it will run once, when the module first evaluates, rather than when a
  component is instantiated. <br />
</p>

<!-- https://musopen.org/music/9862-the-blue-danube-op-314/ -->
<AudioPlayer
  src="https://sveltejs.github.io/assets/music/strauss.mp3"
  title="The Blue Danube Waltz"
  composer="Johann Strauss"
  performer="European Archive"
/>

<!-- https://musopen.org/music/43775-the-planets-op-32/ -->
<AudioPlayer
  src="https://sveltejs.github.io/assets/music/holst.mp3"
  title="Mars, the Bringer of War"
  composer="Gustav Holst"
  performer="USAF Heritage of America Band"
/>

<!-- https://musopen.org/music/8010-3-gymnopedies/ -->
<AudioPlayer
  src="https://sveltejs.github.io/assets/music/satie.mp3"
  title="Gymnopédie no. 1"
  composer="Erik Satie"
  performer="Prodigal Procrastinator"
/>

<!-- https://musopen.org/music/2567-symphony-no-5-in-c-minor-op-67/ -->
<AudioPlayer
  src="https://sveltejs.github.io/assets/music/beethoven.mp3"
  title="Symphony no. 5 in Cm, Op. 67 - I. Allegro con brio"
  composer="Ludwig van Beethoven"
  performer="European Archive"
/>

<!-- https://musopen.org/music/43683-requiem-in-d-minor-k-626/ -->
<AudioPlayer
  src="https://sveltejs.github.io/assets/music/mozart.mp3"
  title="Requiem in D minor, K. 626 - III. Sequence - Lacrymosa"
  composer="Wolfgang Amadeus Mozart"
  performer="Markus Staab"
/>
