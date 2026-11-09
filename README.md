# Oosht Driving

An Anirudh Production (ARK Creations).

A Bengaluru driving game in 3D, played on the real streets around your GPS location. Pick from ten two-wheelers, an auto-rickshaw or three cars, and drive in chase, cockpit or top view. Roads, buildings, shops, parks and lakes come from OpenStreetMap (vector tiles from OpenFreeMap, cached on the phone for offline revisits).

On the road: potholes, speed breakers and water logging you feel through vibration; traffic signals with countdowns; pedestrians of every age, street vendors and kids at play; cows, dogs and cats. A black cat crossing your path asks you to stop for five seconds (the apshakun bonus). Jump a signal or drive rashly and a Hoysala chases you. Each time it catches you, you get an e-challan, and fines are paid only at the District Magistrate Court. Five unpaid challans, or hitting a pedestrian, and your licence is seized: you go on foot until you pay. On foot you earn ₹5 (sweat coins) for every 10 seconds you keep walking or running, and you can hail an auto or a cab, wave for a free lift, ask passers-by for money, or take odd jobs (parcel delivery, unloading a lorry, washing a car). Repair damage at mechanic sheds and refuel at bunks. The sky follows the real sun for the place you drive.

## Get the app

Download the latest APK: https://github.com/AKH1193/oosht-driving/releases/latest/download/oosht-driving.apk

Every push to `main` builds a new APK through GitHub Actions and publishes it as the latest release.

## Controls

- Left and right pads steer; GO accelerates; BRAKE stops and holds. Tap BRAKE twice quickly while stopped to reverse.
- HORN scares animals off the road.
- On foot, GO walks, the side pads turn, and HORN becomes RUN (uses stamina). The buttons at the bottom hail an auto or cab, ask for a lift, ask for money or find work. The red beam marks the court.
- The camera button cycles chase, cockpit and top views.

## Where things live

- `src/` holds the game: `head.html` (screens and HUD) and numbered JavaScript parts (engine, models, map, world, actors, game).
- `tools/build.py` assembles `src/` into `web/game.html` and `app/src/main/assets/www/index.html`.
- `app/src/main/assets/www/sounds/` takes optional real engine and horn recordings; see the README there.
- `app/src/main/java/.../MainActivity.kt` is the Android shell: full-screen landscape WebView, GPS prompt, and vibration with strength control.

## Credits

Map data © OpenStreetMap contributors, available under the Open Database License. Vector tiles by OpenFreeMap.
