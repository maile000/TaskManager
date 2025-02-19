# Basis-Image für Node.js
FROM node:18

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Restliche Dateien kopieren
COPY . .

# Standardbefehl
CMD ["node", "index.js"]
