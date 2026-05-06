#include <iostream>
#include <fstream>
#include <string>
#include <chrono>
#include <iomanip>
#include <ctime>
#include "mqtt/async_client.h"

// --- CONFIGURATION ---
const std::string SERVER_ADDRESS{"tcp://localhost:1883"};
const std::string CLIENT_ID{"shutter_logger_cpp"};
const std::string TOPIC{"volets/#"};
const std::string LOG_FILE_NAME{"volets_history.log"};

/**
 * Enregistre l'événement dans un fichier texte avec horodatage
 */
void log_to_file(const std::string &topic, const std::string &payload)
{
    std::ofstream log_file(LOG_FILE_NAME, std::ios_base::app);

    if (log_file.is_open())
    {
        auto now = std::chrono::system_clock::now();
        std::time_t now_c = std::chrono::system_clock::to_time_t(now);

        // Format : 2026-03-31 01:25:00 | [topic] -> message
        log_file << std::put_time(std::localtime(&now_c), "%Y-%m-%d %H:%M:%S")
                 << " | [" << topic << "] -> " << payload << std::endl;

        log_file.close();
    }
    else
    {
        std::cerr << "Erreur : Impossible d'écrire dans " << LOG_FILE_NAME << std::endl;
    }
}

int main(int argc, char *argv[])
{
    // Création du client MQTT
    mqtt::async_client client(SERVER_ADDRESS, CLIENT_ID);

    auto connOpts = mqtt::connect_options_builder()
                        .clean_session(false) // Pour ne pas perdre de messages en cas de micro-coupure
                        .automatic_reconnect(true)
                        .finalize();

    try
    {
        std::cout << "Tentative de connexion au broker : " << SERVER_ADDRESS << "..." << std::endl;

        // Connexion
        client.connect(connOpts)->wait();

        // FIX : Activation impérative du consommateur avant de lire les messages
        client.start_consuming();

        std::cout << "Connecté avec succès !" << std::endl;
        std::cout << "Écoute du topic : " << TOPIC << std::endl;

        // Abonnement
        client.subscribe(TOPIC, 1)->wait();

        while (true)
        {
            // Récupération du message (bloquant)
            auto msg = client.consume_message();

            if (msg)
            {
                std::string t = msg->get_topic();
                std::string p = msg->to_string();

                // Affichage en temps réel dans la console
                std::cout << "[LOG] " << t << " : " << p << std::endl;

                // Écriture physique sur le disque
                log_to_file(t, p);
            }
        }
    }
    catch (const mqtt::exception &exc)
    {
        std::cerr << "\nErreur MQTT : " << exc.what() << std::endl;
        return 1;
    }
    catch (const std::exception &e)
    {
        std::cerr << "\nErreur Système : " << e.what() << std::endl;
        return 1;
    }

    return 0;
}