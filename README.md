cat << 'EOF' > README.md

# 🏗️ Système de Contrôle de Volets Roulants IoT

**Infrastructure Résidentielle Connectée, Souveraine et Temps Réel.**

Ce projet déploie une stack complète permettant le pilotage de moteurs tubulaires via une interface web moderne, un broker de messages local et des microcontrôleurs ESP32.

## 📂 Organisation des Dossiers (Raspberry Pi)

- **`/home/raspberrypi/services/`** : Cœur du système (Logger C++ et Script Responder).
- **`/home/raspberrypi/iot-project/`** : Interface web React.
- **`/home/raspberrypi/shutter_events.log`** : Journal historique de l'activité.

---

## 🚀 Guide de Lancement Rapide (Ordre des étapes)

### Étape 1 : Configuration du Broker (Raspberry Pi)

Le Raspberry Pi centralise les échanges. Il doit être configuré pour accepter les connexions Web (React).

1. **Installation** : `sudo apt install mosquitto mosquitto-clients`
2. **Configuration WebSockets** : Modifier `/etc/mosquitto/mosquitto.conf` pour inclure :
   ```text
   listener 1883
   allow_anonymous true
   listener 9001
   protocol websockets
   allow_anonymous true
   Redémarrage : sudo systemctl restart mosquitto
   ```

Étape 2 : Déploiement du Firmware (ESP32)
L'intelligence embarquée gère la sécurité moteur et la connectivité.

Secrets : Configurer include/secrets.h avec l'IP du Raspberry Pi.

Flashage : Utiliser PlatformIO dans VS Code.

Conseil : Faire un pio run -t erase avant le premier flash pour vider la mémoire NVS.

Provisionnement WiFi : Se connecter au point d'accès Wi-Fi de l'ESP32 avec un smartphone, configurer le réseau local et saisir le nom de la pièce en minuscules (ex: salon).

Étape 3 : Interface de Contrôle (React + Mantine)
Le tableau de bord permet le pilotage et le retour d'état visuel.

Installation : npm install

Lancement : npm run dev

Vérification : Le badge de statut doit passer au vert (Connecté) si l'ESP32 est en ligne.

### Étape 4 : Activation des Services de Monitoring

Pour assurer l'archivage et la communication des logs vers l'interface :

**Compilation du Logger** :

````bash
cd /home/raspberrypi/services
g++ logger.cpp -o mqtt_logger -lpaho-mqttpp3 -lpaho-mqtt3as
```shell
nohup /home/raspberrypi/services/mqtt_logger > /dev/null 2>&1 &
nohup /home/raspberrypi/services/log_responder.sh > /dev/null 2>&1 &
````

🛠️ Architecture du Système
🔵 Couche Embarquée : ESP32 (C++/PlatformIO)
Software Interlock : Algorithme interdisant l'activation simultanée des relais Montée/Descente pour protéger le bobinage moteur.

Non-blocking I/O : Gestion de la course via millis() pour garantir une réactivité constante aux ordres d'arrêt d'urgence.

Persistance État : Utilisation de Preferences.h pour mémoriser la position et le nom de la pièce après une coupure de courant.

🟢 Couche Réseau : MQTT (Mosquitto)
Standard Industriel : Communication via protocole Pub/Sub léger.

Double Tunnel : Port 1883 (TCP brut) pour le hardware et Port 9001 (WebSockets) pour le navigateur.

LWT (Last Will) : Notification automatique du broker si un volet tombe hors ligne.

🔴 Couche Applicative : React 18 & Mantine UI
Design System : Utilisation de Mantine UI pour une interface ergonomique, accessible et compatible Dark Mode.

Type Safety : Développement intégral sous TypeScript pour sécuriser les échanges de données MQTT.

Logger C++ : Service indépendant sur le Pi pour l'archivage des événements dans volets_history.log.

```markdown
- **Logger C++ & Bridge Bash** :
- Le binaire `mqtt_logger` assure l'écriture asynchrone des trames MQTT dans un fichier plat.
- Le script `log_responder.sh` agit comme un serveur stateless pour streamer l'historique vers React à la demande.
```

🔍 Diagnostic & Maintenance
Pour monitorer le trafic réseau en temps réel depuis le Raspberry Pi :

```shell
mosquitto_sub -h localhost -t "#" -v
```

```shell
# Pour réinitialiser l'historique des logs (Interface propre)
> /home/raspberrypi/shutter_events.log
```

Note importante : Les noms de pièces (topics) sont sensibles à la casse. Pour une compatibilité parfaite entre l'ESP32 et l'interface React, utilisez toujours des minuscules (ex: salon, cuisine).

📜 Licence
Projet sous licence MIT. Développé dans un objectif d'apprentissage et d'indépendance technologique.
EOF
