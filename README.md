# Wise City

An Anirudh Production (ARK Creations).

A Bengaluru life game in 3D, played on the real streets around your GPS location. Drive, walk, eat, work out, fight and run from the police. Roads, buildings, shops, parks and lakes come from OpenStreetMap (vector tiles from OpenFreeMap, cached on the phone for offline revisits).

## Vehicles

Ten two-wheelers, an auto-rickshaw, three everyday cars, four luxury and sports cars (Veloce V12 supercar, Zephyr GT, Regent Imperial saloon, Monarch LX SUV), a city bus and a lorry. Pick one in the showroom, or step out and take any vehicle off the street.

At Kempegowda International Airport (pick it on the area list) airliners land and take off on the real runways. Walk up to a parked plane and pull the pilot out, or board an empty one, then fly it: GO and BRAKE set the throttle, the joystick banks and climbs, take off above about 230 km/h, and land on a runway and stop before getting out.

## On the road

Potholes, speed breakers and water logging you feel through vibration; traffic signals with countdowns; pedestrians of every age, street vendors and kids at play; cows, dogs and cats. A black cat crossing your path asks you to stop for five seconds (the apshakun bonus). Shop names and rooftop hoardings are fixed to the buildings.

The city has real sunlight shadows (Balanced and Ultra graphics), rain spells with wet roads and thunder, electric poles and wires, garbage heaps and twin bins, BMTC buses in four liveries that stop at bus shelters, lorries with "Horn OK Please" tailgates, tractors with trolleys, cars and bikes parked along the kerb, and parking lots. An elevated metro runs over the main road (the real Namma Metro alignment where the map has it), with stations, trains and a smart card you top up to ride.

## The city

Weather and daylight follow the real world: it rains when it is raining at that spot (live from Open-Meteo, with a seasonal fallback offline), and day and night follow your phone's clock. Koramangala, MG Road and Indiranagar are posh: glass towers, planters and bollard lights instead of garbage heaps, more luxury cars, richer people and higher menu prices.

Every house and building has a door or gate, and you can walk in: family homes, apartment lobbies, offices, shops, gyms, restaurants and cafes with tables, bars with music and a dance floor, malls with stores and a food court, and police stations. Restaurants, darshinis, cafes, chaat stalls and bars serve local food with a menu and prices (idli vada, masala dosa, bisi bele bath, donne biryani, ragi mudde, filter coffee and more); you sit at a table and eat.

People talk as you pass (in Kannada when the phone has a Kannada voice, otherwise in Kanglish): men, women, kids, elders and vendors. Pickpockets work the crowds, people argue and come to blows, drivers get out for road rage, and some carry guns and will shoot back. Catch or knock down a thief (red marker) for a ₹10,000 police reward.

## On foot

- Tap EXIT to get out of any vehicle; walk back to it and tap Get in. Walk up to a car, auto or bike in traffic and tap Take car to steal it.
- Walking or running earns ₹5 (sweat coins) every 10 seconds.
- Hail an auto or cab, wait at a bus stop for a BMTC bus, or wave for a free lift: the driver keeps to the road and the left lane, stops at signals, for traffic and for people, and you climb on, ride and get off at the end.
- Metro: walk to a station staircase, buy a smart card, top it up and ride to another station.
- Work: Work lists the nearest jobs. Load or unload a lorry by carrying sacks between the lorry and the godown (₹20 a sack plus a bonus), wash a parked car by scrubbing all four sides, or deliver a parcel. Gym workouts are a rhythm game.
- Hotels and darshinis, cafes, juice and healthy food stalls restore health and stamina. Bars make you tipsy (do not drive). Gyms raise your stamina and punching strength.
- Green plus holograms on the footpath restore health; you also find cash, armour and ammo lying around.
- Fight with fists and kicks, a cricket bat or a knife, or buy a pistol and SMG at an arms dealer. People flee, cars wreck, street props go flying.
- Search anyone you knock out: cash, a mobile phone (sell it at any shop), vehicle keys (the key icon on the map shows the parked vehicle), a gun, or his shirt and trousers, leaving him in his baniyan and undies.
- Pickpocket people from behind, rob them at gunpoint, or rob a shop till and search a home's almirah.
- Armour: light vest (50), body armour (100), riot gear (150) and a Kevlar suit (200) at the arms dealer.

## Police and the court

The police only react when someone sees it: a patrolling Hoysala, a constable at a junction, or a nearby police station. Patrols show on the map as a blue P (flashing red when they chase you), police stations as a yellow P on navy. Crimes build heat and a five-star wanted level: more Hoysalas join the chase as the stars rise, a police helicopter circles from four stars and fires at five. When you are on foot, constables get out with lathis; at three stars they shoot. Hit back and you knock them down, and they cannot cuff you while you are fighting. If they catch you, you are busted: weapons confiscated, e-challans issued, and you are released from the police station with jurisdiction over that spot. Fines are paid only at the District Magistrate Court; five unpaid challans, or hitting a pedestrian, and your licence is seized until you pay. Lose all your health and you wake up in hospital with a bill.

## Get the app

Download the latest APK: https://github.com/AKH1193/oosht-driving/releases/latest/download/wise-city.apk

Every push to `main` builds a new APK through GitHub Actions and publishes it as the latest release.

## Controls

- The joystick on the left steers; on foot, push it the way you want to walk and all the way to run. GO accelerates; BRAKE stops and holds. Tap BRAKE twice quickly while stopped to reverse.
- HORN scares animals off the road; on foot it becomes RUN.
- On foot: HIT / FIRE attacks, the weapon chip under your wallet switches weapons, and the yellow button does whatever is nearby (Get in, Take car, Eat & drink, Work out, Buy weapons).
- Keyboard: arrows or WASD, F to attack, X to jump, E to get in or out, Q to switch weapons, C for camera.
- The camera button cycles chase, cockpit and top views.
- Settings let you change button opacity, size and shape, HUD and map opacity and map size.
- Pause, then Quit & start over wipes your money and progress so you start fresh on a new map.

## Where things live

- `src/` holds the game: `head.html` (screens and HUD) and numbered JavaScript parts (engine, models, map, world, actors, game, life on foot, combat and venues).
- `tools/build.py` assembles `src/` into `web/game.html` and `app/src/main/assets/www/index.html`.
- `app/src/main/assets/www/sounds/` takes optional real engine and horn recordings; see the README there.
- `app/src/main/java/.../MainActivity.kt` is the Android shell: full-screen landscape WebView, GPS prompt, and vibration with strength control.

## Credits

Map data © OpenStreetMap contributors, available under the Open Database License. Vector tiles by OpenFreeMap.
