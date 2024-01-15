var CACHE_STATIC = 'static-v';
var CACHE_DYNAMIC = 'dynamic-v';

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installing Service Worker ...', event);

    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(function (cache) {
                console.log('[Service Worker] Precaching App shell');
                return cache.addAll([
                    '/',
                    '/aps.js',
                    '/views/layouts/main-layout.pug',
                    '/js/home.js',
                    '/js/common.js',
                    '/js/promise.js',
                    '/js/fetch.js',
                    '/css/main.css',
                    '/views/mixins/mixins.pug',
                    'https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css',
                    {
                        integrity: 'sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T',
                        crossorigin: 'anonymous'
                    },
                    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css'
                ]);
            })
            .then(function () {
                console.log('[Service Worker] App shell precached successfully');
            })
            .catch(function (error) {
                console.error('[Service Worker] Error precaching app shell:', error);
            })
    );
});




self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(key) {
                if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});
 

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                        .then(function(res) {
                            return caches.open(CACHE_DYNAMIC)
                                .then(function(cache) {
                                    cache.put(event.request.url, res.clone());
                                    return res;
                                });
                        });
                }
            })
    );
});

self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push Recieved...');
    self.registration.showNotification(data.title, {
        body:'Notified by Megachat',
        icon:'/image/icons/app-icon-96x96.png'
    });
})