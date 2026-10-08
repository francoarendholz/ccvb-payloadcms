#!/bin/bash
# Legt je eine Datenbank mit eigenem Benutzer für den Lab-Stack und die lokale Entwicklung an.
set -euo pipefail

create_db() {
  local name="$1" password="$2"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-SQL
    CREATE USER ${name} WITH PASSWORD '${password}';
    CREATE DATABASE ${name} OWNER ${name};
SQL
}

create_db ccvb_lab "$CCVB_LAB_DB_PASSWORD"
create_db ccvb_dev "$CCVB_DEV_DB_PASSWORD"
