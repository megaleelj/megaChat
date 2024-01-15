var deferredPrompt;
const publicVapidKey = 'BOUzCkvBRMgAdKK6xgnoFqbn5qX1wS_aPvzZpjStPGmglfP5io3NC8L7GAssPkMuePxOvyKB_wQYqTs5ZijwEY0';


if ('serviceWorker' in navigator) {
    send().catch(error => console.error(error));
}

async function send() {
    try {
        console.log('Registering Service Worker...');
        const register = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        console.log('Service Worker Registered...');

        // Ensure that the service worker is activated before subscribing to push
        if (register.active) {
            console.log('Registering Push...');
            const subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            console.log('Push Registered...');

            console.log('Sending Push...');
            await fetch('/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Push Sent...');
        } else {
            console.error('Service Worker not activated.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

window.addEventListener('beforeinstallprompt', function (event) {
    console.log('beforeinstallprompt fired');
    event.preventDefault();
    deferredPrompt = event;
    return false;
});

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
