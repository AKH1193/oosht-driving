# Oosht Driving

An Anirudh Production (ARK Creations).

A Bengaluru driving game played on real streets. Pick a scooter, motorbike, auto-rickshaw, hatchback or SUV, and drive the roads around your GPS location, loaded from OpenStreetMap. Potholes, speed breakers, water logging, stray cows and city traffic are placed on the actual roads, and the phone vibrates for each one. The sky follows the real sun position for the place you drive, so you get dawn, noon, evening and night.

## Get the app

Download the latest APK: https://github.com/AKH1193/oosht-driving/releases/latest/download/oosht-driving.apk

Every push to `main` builds a new APK through GitHub Actions and publishes it as the latest release.

## Where things live

- `web/game.html` is the whole game (the page source). Edit this file.
- `tools/build_page.py` wraps it into `app/src/main/assets/www/index.html` during the build.
- `app/src/main/java/.../MainActivity.kt` is the Android shell: full-screen landscape WebView, GPS prompt, and vibration with strength control.

## Credits

Map data © OpenStreetMap contributors, available under the Open Database License.
