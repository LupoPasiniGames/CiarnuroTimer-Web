const cacheName='ciarnurortpwa-v12';
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
    'sfx/nextRound.opus',
    'pics/lowspec/logo.webp',
    'pics/lowspec/combat.webp',
    'pics/lowspec/endGame.webp',
    'pics/lowspec/endRound.webp',
    'pics/lowspec/game1.webp',
    'pics/lowspec/game2.webp',
    'pics/lowspec/game3.webp',
    'pics/lowspec/game4.webp',
    'pics/lowspec/game5.webp',
    'pics/lowspec/game6.webp',
    'pics/lowspec/game7.webp',
    'pics/lowspec/gameOptions.webp',
    'pics/lowspec/ghostTime.webp',
    'pics/lowspec/previousGames.webp',
    'pics/lowspec/welcome.webp',
    'pics/midspec/logo.webp',
    'pics/midspec/combat.webp',
    'pics/midspec/endGame.webp',
    'pics/midspec/endRound.webp',
    'pics/midspec/game1.webp',
    'pics/midspec/game2.webp',
    'pics/midspec/game3.webp',
    'pics/midspec/game4.webp',
    'pics/midspec/game5.webp',
    'pics/midspec/game6.webp',
    'pics/midspec/game7.webp',
    'pics/midspec/gameOptions.webp',
    'pics/midspec/ghostTime.webp',
    'pics/midspec/previousGames.webp',
    'pics/midspec/welcome.webp',
    'pics/ultraspec/logo.webp',
    'pics/ultraspec/combat.webp',
    'pics/ultraspec/endGame.webp',
    'pics/ultraspec/endRound.webp',
    'pics/ultraspec/game1.webp',
    'pics/ultraspec/game2.webp',
    'pics/ultraspec/game3.webp',
    'pics/ultraspec/game4.webp',
    'pics/ultraspec/game5.webp',
    'pics/ultraspec/game6.webp',
    'pics/ultraspec/game7.webp',
    'pics/ultraspec/gameOptions.webp',
    'pics/ultraspec/ghostTime.webp',
    'pics/ultraspec/previousGames.webp',
    'pics/ultraspec/welcome.webp',
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
