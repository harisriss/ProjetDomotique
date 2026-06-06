# Nom de l'exécutable
TARGET = mqtt_logger

# Compilateur
CXX = g++

# OPTIONS DE COMPILATION
# On passe de -std=c++11 à -std=c++17
CXXFLAGS = -Wall -Wextra -std=c++17 -O2

# BIBLIOTHÈQUES
# On lie les bibliothèques Paho MQTT C++ (paho-mqttpp3) et C (paho-mqtt3as)
LDFLAGS = -lpaho-mqttpp3 -lpaho-mqtt3as -lpthread

# DOSSIERS
SRCDIR = src
OBJDIR = obj

# DÉTECTION DES FICHIERS
SOURCES = $(wildcard $(SRCDIR)/*.cpp)
OBJECTS = $(SOURCES:$(SRCDIR)/%.cpp=$(OBJDIR)/%.o)

# --- RÈGLES ---

all: $(TARGET)

$(TARGET): $(OBJECTS)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LDFLAGS)

$(OBJDIR)/%.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -rf $(OBJDIR) $(TARGET)

.PHONY: all clean
