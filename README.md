# Wise City

An Anirudh Production (ARK Creations).

A Bengaluru life game in 3D, played on the real streets around your GPS location. Drive, walk, eat, work out, fight and run from the police. Roads, buildings, shops, parks and lakes come from OpenStreetMap (vector tiles from OpenFreeMap, cached on the phone for offline revisits).

## Vehicles

Ten two-wheelers, an auto-rickshaw, three everyday cars, four luxury and sports cars (Veloce V12 supercar, Zephyr GT, Regent Imperial saloon, Monarch LX SUV), a city bus and a lorry. Pick one in the showroom, or step out and take any vehicle off the street.

## On the road

Potholes, speed breakers and water logging you feel through vibration; traffic signals with countdowns; pedestrians of every age, street vendors and kids at play; cows, dogs and cats. A black cat crossing your path asks you to stop for five seconds (the apshakun bonus). Shop names and rooftop hoardings are fixed to the buildings.

## On foot

- Tap EXIT to get out of any vehicle; walk back to it and tap Get in. Walk up to a car, auto or bike in traffic and tap Take car to steal it.
- Walking or running earns ₹5 (sweat coins) every 10 seconds.
- Hail an auto or cab, or wave for a free lift: the driver obeys signals, you climb on, ride as a passenger and get off at the end.
- Hotels and darshinis, cafes, juice and healthy food stalls restore health and stamina. Bars make you tipsy (do not drive). Gyms raise your stamina and punching strength.
- Green plus holograms on the footpath restore health; you also find cash, armour and ammo lying around.
- Fight with fists and kicks, a cricket bat or a knife, or buy a pistol and SMG at an arms dealer. People flee, cars wreck, street props go flying.

## Police and the court

Crimes raise a five-star wanted level. Hoysala cars chase you; when you are on foot, constables get out and run after you, and at three stars they shoot. If they catch you, you are busted: weapons confiscated and e-challans issued. Fines are paid only at the District Magistrate Court; five unpaid challans, or hitting a pedestrian, and your licence is seized until you pay. Lose all your health and you wake up in hospital with a bill.

## Get the app

Download the latest APK: https://github.com/AKH1193/oosht-driving/releases/latest/download/wise-city.apk

Every push to `main` builds a new APK through GitHub Actions and publishes it as the latest release.

## Controls

- Left and right pads steer; GO accelerates (walks on foot); BRAKE stops and holds. Tap BRAKE twice quickly while stopped to reverse.
- HORN scares animals off the road; on foot it becomes RUN.
- On foot: HIT / FIRE attacks, JUMP jumps, the weapon chip under your wallet switches weapons, and the yellow button does whatever is nearby (Get in, Take car, Eat & drink, Work out, Buy weapons).
- Keyboard: arrows or WASD, F to attack, X to jump, E to get in or out, Q to switch weapons, C for camera.
- The camera button cycles chase, cockpit and top views.

## Where things live

- `src/` holds the game: `head.html` (screens and HUD) and numbered JavaScript parts (engine, models, map, world, actors, game, life on foot, combat and venues).
- `tools/build.py` assembles `src/` into `web/game.html` and `app/src/main/assets/www/index.html`.
- `app/src/main/assets/www/sounds/` takes optional real engine and horn recordings; see the README there.
- `app/src/main/java/.../MainActivity.kt` is the Android shell: full-screen landscape WebView, GPS prompt, and vibration with strength control.

## Credits

Map data © OpenStreetMap contributors, available under the Open Database License. Vector tiles by OpenFreeMap.
