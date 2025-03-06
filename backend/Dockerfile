# Wähle das Node-Image
FROM node:18

# Erstelle ein Arbeitsverzeichnis
WORKDIR /app

# Kopiere die package.json und installiere die Abhängigkeiten
COPY package*.json ./
RUN npm install

# Kopiere den Rest der Anwendung
COPY . .

# Exponiere den Port
EXPOSE 5000

# Starte den Server
CMD ["node", "server.js"]