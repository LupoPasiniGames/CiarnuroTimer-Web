const cacheName='ciarnurortpwa-v11';
const appFiles=[
    'index.html',
    'ciarnurort.js',
    'style.css',
    'favicon.ico',
    'favicon.png',
    'pwaicon.png',
    'sw.js',
    'fonts/opensans-bold.woff',
    'fonts/opensans-regular.woff',
    'fonts/veramono-timer-regular.woff',
    'fonts/xolonium-regular.woff',
    'pics/logo.png',
    'pics/addPlayer.png',
    'pics/addTeam.png',
    'pics/edit.png',
    'pics/remove.png',
    'pics/team.png',
    'pics/races/ivosiani.png',
    'pics/races/krentoriani.png',
    'pics/races/pravosianiGuerrieri.png',
    'pics/races/pravosianiGuidespirituali.png',
    'pics/races/quark.png',
    'pics/races/sauniArcaici.png',
    'pics/races/sauniEletti.png',
    'pics/races/umani.png',
    'pics/races/veriSyviar.png',
    'pics/backgrounds/combat.jpg',
    'pics/backgrounds/endGame.jpg',
    'pics/backgrounds/endRound.jpg',
    'pics/backgrounds/game1.jpg',
    'pics/backgrounds/game2.jpg',
    'pics/backgrounds/game3.jpg',
    'pics/backgrounds/game4.jpg',
    'pics/backgrounds/game5.jpg',
    'pics/backgrounds/game6.jpg',
    'pics/backgrounds/game7.jpg',
    'pics/backgrounds/gameOptions.jpg',
    'pics/backgrounds/ghostTime.jpg',
    'pics/backgrounds/previousGames.jpg',
    'pics/backgrounds/welcome.jpg',
    'sfx/combat.opus',
    'sfx/combatEnd.opus',
    'sfx/endGame.opus',
    'sfx/gameStarted.opus',
    'sfx/ghostTime.opus',
    'sfx/ghostTimeEnd.opus',
    'sfx/nextPlayer.opus',
    'sfx/nextRound.opus'
];

self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  const filesUpdate = cache => {
      const stack = [];
      appFiles.forEach(file => stack.push(
          cache.add(file).catch(_=>console.error(`can't load ${file} to cache`))
      ));
      return Promise.all(stack);
  };
  e.waitUntil(caches.open(cacheName).then(filesUpdate));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) {
        return r;
      }
      const response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })()
  );
});

self.addEventListener('activate', (e) => {
  console.log("[Service Worker] Activated");
});
