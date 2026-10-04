FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --omit=dev --no-audit --no-fund; fi
COPY backend/ ./
COPY database ./database
EXPOSE 3000
CMD ["sh", "-c", "if [ -n \"$DB_PATH\" ] && [ -n \"$SQLITE_SEED_PATH\" ] && [ -f \"$SQLITE_SEED_PATH\" ] && [ ! -f \"$DB_PATH\" ]; then mkdir -p $(dirname \"$DB_PATH\") && cp \"$SQLITE_SEED_PATH\" \"$DB_PATH\"; fi; npm start"]
