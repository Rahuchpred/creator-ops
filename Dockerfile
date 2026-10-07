FROM node:22-slim
WORKDIR /app
RUN npm install -g bun@1.3.13

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

ENV NODE_ENV=production DATA_DIR=/data PORT=8080
EXPOSE 8080
CMD ["sh", "scripts/start.sh"]
