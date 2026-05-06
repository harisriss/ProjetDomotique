# Infrastructure IoT Domotique : Contrôle de Volets Roulants

## 1. Vision et Objectifs Stratégiques

Ce projet vise à concevoir un écosystème domotique **Open-Source** et **Cloud-Independent**.

- **Souveraineté Digitale** : Hébergement local intégral (zéro donnée sortante).
- **Performance** : Latence ultra-faible (<100ms) via communication binaire MQTT.
- **Interopérabilité** : Architecture basée sur des standards industriels.

---

## 2. Analyse de la Couche Hardware & Firmware (ESP32)

### 2.1 Environnement de Développement : PlatformIO

Le choix de **PlatformIO** (C++) garantit une gestion rigoureuse des dépendances (`lib_deps`) et une compilation optimisée pour l'architecture Xtensa de l'ESP32.

### 2.2 Sécurité et Logique métier (Interlocking)

- **Software Interlock** : Protection physique des moteurs tubulaires. Le firmware interdit l'activation simultanée des relais de montée et de descente. Un "Dead-time" est imposé entre chaque inversion de sens.
- **Boucle Non-Bloquante** : Utilisation exclusive de `millis()` pour les temporisations de course. Cela permet à l'ESP32 de rester "à l'écoute" d'un ordre d'arrêt d'urgence via MQTT même pendant un mouvement.
- **Gestion NVS (Non-Volatile Storage)** : Utilisation de `Preferences.h` pour stocker le nom de la pièce et la dernière position connue, assurant une reprise d'état après coupure de courant.
- **Portail Captif** : Intégration de `WiFiManager` pour une configuration dynamique (SSID, Password, Nom de pièce).

---

## 3. Architecture Réseau & Brokerage (MQTT)

### 3.1 Le Broker : Eclipse Mosquitto

- **Port 1883 (TCP)** : Flux brut pour l'ESP32 et le Logger C++.
- **Port 9001 (WebSockets)** : Tunnel indispensable pour permettre à l'application Web (React) de communiquer directement avec le broker.

### 3.2 Protocole de Communication

- **QoS 1 (At least once)** : Garantie de réception des commandes critiques.
- **Retained Messages** : Utilisé pour les topics `/etat` et `/position`, permettant aux nouveaux clients de connaître l'état actuel immédiatement.
- **LWT (Last Will and Testament)** : Mécanisme permettant au broker de publier automatiquement un statut `HORS LIGNE` si l'ESP32 perd la connexion.

---

## 4. Développement Applicatif

### 4.1 Interface React (Vite.js & Mantine UI)

- **Composants Riches** : Utilisation de **Mantine UI** pour une interface utilisateur réactive et accessible (Modals, Sliders de position, Notifications).
- **State Management** : Intégration des hooks de Mantine pour gérer les thèmes (Dark/Light mode) et les retours d'état MQTT en temps réel.
- **TypeScript** : Sécurisation des interactions via TypeScript pour prévenir les erreurs de payload sur les topics MQTT.

### 4.2 Logger de Données (C++ Natif)

Un service autonome écrit en C++ tourne sur le Raspberry Pi. Il utilise la bibliothèque `libmosquitto` pour s'abonner au topic racine `maison/#` et consigner chaque événement dans `volets_history.log`.

---

## 5. Pipeline DevOps et Maintenance

### 5.1 Gestion des Secrets

- Isolation des identifiants dans `include/secrets.h`.
- Protection via `.gitignore` pour empêcher toute fuite de credentials.

### 5.2 Diagnostics et Maintenance

| Commande                               | Utilité                                            |
| :------------------------------------- | :------------------------------------------------- |
| `mosquitto_sub -h localhost -t "#" -v` | Monitoring temps réel des flux MQTT                |
| `pio run -t erase`                     | Remise à zéro totale de la mémoire NVS de l'ESP32  |
| `sudo systemctl restart mosquitto`     | Redémarrage du broker après modification de config |

---

## 6. Synthèse des Compétences

Ce projet valide une expertise **Full-Stack IoT** :

1. **Système** : Administration Linux & Configuration de services.
2. **Embarqué** : Programmation C++ bas niveau et gestion de mémoire.
3. **Web** : React (Mantine), WebSockets, Real-time UI.
4. **Ingénierie** : Sécurisation logicielle (Interlock) et architecture découplée.
