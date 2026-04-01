#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <Preferences.h>

// --- CONFIGURATION DES PINS ---
const int RELAY_UP = 26;
const int RELAY_DOWN = 27;

// --- PARAMÈTRES MQTT ---
const char *mqtt_server = "192.168.1.19";
char nom_piece[40] = "salon"; // Sera écrasé par la mémoire si déjà configuré

// --- TOPICS DYNAMIQUES ---
String topicCmd, topicEtat, topicPosFeedback, topicPosSet;

// --- VARIABLES D'ÉTAT ---
float positionActuelle = 0.0;
int positionCible = -1;
bool estEnMouvement = false;
String directionActuelle = "";
unsigned long mouvementStart = 0;
float positionStartMouvement = 0.0;

// --- TEMPS DE COURSE ---
const unsigned long TEMPS_MONTEE = 22000;
const unsigned long TEMPS_DESCENTE = 19000;

WiFiClient espClient;
PubSubClient client(espClient);
Preferences preferences;

// --- FONCTIONS UTILES ---

void setup_topics()
{
  String root = "maison/volet/" + String(nom_piece);
  topicCmd = root + "/commande";
  topicEtat = root + "/etat";
  topicPosFeedback = root + "/position";
  topicPosSet = root + "/set";
}

void sauvegarderDonnees()
{
  preferences.begin("volet", false);
  preferences.putFloat("pos", positionActuelle);
  preferences.putString("piece", nom_piece); // Sécurité : on sauve le nom de la pièce aussi
  preferences.end();
  Serial.printf("💾 Données sauvegardées (Pos: %.1f%%, Pièce: %s)\n", positionActuelle, nom_piece);
}

void couperMoteur(String raison)
{
  digitalWrite(RELAY_UP, LOW);
  digitalWrite(RELAY_DOWN, LOW);
  estEnMouvement = false;
  directionActuelle = "";
  positionCible = -1;

  sauvegarderDonnees();

  client.publish(topicEtat.c_str(), raison.c_str(), true);
  client.publish(topicPosFeedback.c_str(), String((int)positionActuelle).c_str(), true);
  Serial.println("🛑 Moteur arrêté : " + raison);
}

void callback(char *topic, byte *payload, unsigned int length)
{
  String message = "";
  for (int i = 0; i < length; i++)
    message += (char)payload[i];
  String t = String(topic);

  if (t == topicCmd)
  {
    if (message == "OUVRIR")
      positionCible = 0;
    else if (message == "FERMER")
      positionCible = 100;
    else if (message == "STOP")
    {
      couperMoteur("STOPPÉ");
      return;
    }
  }
  else if (t == topicPosSet)
  {
    positionCible = message.toInt();
  }

  if (positionCible != -1)
  {
    if (abs(positionCible - positionActuelle) < 1.0)
    {
      couperMoteur(positionActuelle >= 98 ? "FERMÉ" : (positionActuelle <= 2 ? "OUVERT" : "CIBLE ATTEINTE"));
      return;
    }

    if (positionCible > positionActuelle)
    {
      digitalWrite(RELAY_UP, LOW);
      delay(100);
      digitalWrite(RELAY_DOWN, HIGH);
      directionActuelle = "DOWN";
      client.publish(topicEtat.c_str(), "FERMETURE...", true);
    }
    else
    {
      digitalWrite(RELAY_DOWN, LOW);
      delay(100);
      digitalWrite(RELAY_UP, HIGH);
      directionActuelle = "UP";
      client.publish(topicEtat.c_str(), "OUVERTURE...", true);
    }
    estEnMouvement = true;
    mouvementStart = millis();
    positionStartMouvement = positionActuelle;
  }
}

// --- SETUP ---

void setup()
{
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- DÉMARRAGE DU VOLET UNIVERSEL ---");

  pinMode(RELAY_UP, OUTPUT);
  pinMode(RELAY_DOWN, OUTPUT);
  digitalWrite(RELAY_UP, LOW);
  digitalWrite(RELAY_DOWN, LOW);

  // 1. Récupération mémoire (Position ET Nom de la pièce)
  preferences.begin("volet", true);
  positionActuelle = preferences.getFloat("pos", 0.0);
  String savedPiece = preferences.getString("piece", "nouveau_volet");
  strcpy(nom_piece, savedPiece.c_str());
  preferences.end();

  Serial.printf("📍 État initial : %s à %.1f%%\n", nom_piece, positionActuelle);

  // 2. WiFiManager
  WiFiManager wm;

  // LIGNE DÉSACTIVÉE :wm.resetSettings(); // On ne reset plus au démarrage !

  WiFiManagerParameter custom_room_name("room", "Nom de la pièce (ex: salon)", nom_piece, 40);
  wm.addParameter(&custom_room_name);

  Serial.println("🌐 Connexion WiFi...");
  if (!wm.autoConnect("Config_Volet_ESP32"))
  {
    Serial.println("❌ Échec. Redémarrage...");
    delay(3000);
    ESP.restart();
  }

  // Mise à jour et sauvegarde du nom si changé via le portail
  strcpy(nom_piece, custom_room_name.getValue());
  sauvegarderDonnees();

  Serial.println("✅ WiFi Connecté !");
  Serial.print("🏠 Pièce assignée : ");
  Serial.println(nom_piece);

  setup_topics();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

// --- RECONNECT MQTT ---

void reconnect()
{
  while (!client.connected())
  {
    String clientId = "Volet_" + String(nom_piece);
    Serial.print("Connection MQTT: " + clientId + "...");
    if (client.connect(clientId.c_str(), topicEtat.c_str(), 1, true, "HORS LIGNE"))
    {
      Serial.println("OK");
      client.subscribe(topicCmd.c_str());
      client.subscribe(topicPosSet.c_str());
      client.publish(topicEtat.c_str(), "EN LIGNE", true);
      client.publish(topicPosFeedback.c_str(), String((int)positionActuelle).c_str(), true);
    }
    else
    {
      Serial.print("Erreur rc=");
      Serial.print(client.state());
      Serial.println(" - Nouvelle tentative dans 5s");
      delay(5000);
    }
  }
}

// --- LOOP PRINCIPAL ---

void loop()
{
  if (!client.connected())
    reconnect();
  client.loop();

  if (estEnMouvement)
  {
    unsigned long duree = millis() - mouvementStart;

    if (directionActuelle == "DOWN")
    {
      positionActuelle = positionStartMouvement + (((float)duree / (float)TEMPS_DESCENTE) * 100.0);
      if (positionActuelle >= (float)positionCible || positionActuelle >= 100.0)
      {
        positionActuelle = (positionCible >= 98 || positionCible == -1) ? 100.0 : (float)positionCible;
        couperMoteur("FERMÉ");
      }
    }
    else if (directionActuelle == "UP")
    {
      positionActuelle = positionStartMouvement - (((float)duree / (float)TEMPS_MONTEE) * 100.0);
      if (positionActuelle <= (float)positionCible || positionActuelle <= 0.0)
      {
        positionActuelle = (positionCible <= 2 || positionCible == -1) ? 0.0 : (float)positionCible;
        couperMoteur("OUVERT");
      }
    }

    static unsigned long lastUpdate = 0;
    if (millis() - lastUpdate > 400)
    {
      lastUpdate = millis();
      client.publish(topicPosFeedback.c_str(), String((int)positionActuelle).c_str(), true);
    }
  }
}