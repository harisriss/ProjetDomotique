#!/bin/bash
REQUEST_TOPIC="maison/volet/logs/get"
RESPONSE_TOPIC="maison/volet/logs/history"
LOG_FILE="$HOME/shutter_events.log"

mosquitto_sub -h localhost -t "$REQUEST_TOPIC" | while read -r line
do
    if [ -f "$LOG_FILE" ]; then
        cat "$LOG_FILE" | mosquitto_pub -h localhost -t "$RESPONSE_TOPIC" -s
    fi
done
