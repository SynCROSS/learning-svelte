<script>
  import Map from './Map.svelte';
  import MapMarker from './MapMarker.svelte';
</script>

<p>
  Contexts and stores seem similar. They differ in that stores are available to
  any part of an app, while a context is only available to a component and its
  descendants. This can be helpful if you want to use several instances of a
  component without the state of one interfering with the state of the others.
</p>

<Map lat={35} lon={-84} zoom={3.5}>
  <MapMarker lat={37.8225} lon={-122.0024} label="Svelte Body Shaping" />
  <MapMarker
    lat={33.8981}
    lon={-118.4169}
    label="Svelte Barbershop & Essentials"
  />
  <MapMarker lat={29.723} lon={-95.4189} label="Svelte Waxing Studio" />
  <MapMarker
    lat={28.3378}
    lon={-81.3966}
    label="Svelte 30 Nutritional Consultants"
  />
  <MapMarker lat={40.6483} lon={-74.0237} label="Svelte Brands LLC" />
  <MapMarker lat={40.6986} lon={-74.41} label="Svelte Medical Systems" />
</Map>
