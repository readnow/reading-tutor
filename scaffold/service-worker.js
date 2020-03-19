importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.routing.registerRoute(
  /.mp3$/,
  new workbox.strategies.CacheFirst()
)
workbox.routing.registerRoute(
  () => true,
  // this will use the cache and try to get a new version only once page is refreshed
  new workbox.strategies.StaleWhileRevalidate()
);
