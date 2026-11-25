"use strict";
importScripts("Assets/Script/OfflineFiles.js");
const offlineFiles = self.offlineFiles || { version: "development", files: [] };
const cacheName = "cyber-epistemology-" + offlineFiles.version;
self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(offlineFiles.files)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.filter(name => name.startsWith("cyber-epistemology-") && name !== cacheName).map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
const fetchAndStore = async request => {
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
};
const handlePageRequest = async request => {
  try {
    return await fetchAndStore(request);
  } catch (error) {
    const cachedPage = await caches.match(request, { ignoreSearch: true });
    return cachedPage || caches.match("index.html");
  }
};
const handleAssetRequest = async request => {
  const cachedAsset = await caches.match(request, { ignoreSearch: true });
  return cachedAsset || fetchAndStore(request);
};
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? handlePageRequest(request) : handleAssetRequest(request));
});
