# syntax=docker/dockerfile:1
# Tầng 1: build bundle tĩnh bằng Vite. Tầng 2: nginx phục vụ file tĩnh và chuyển /api tới API Gateway.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost/ >/dev/null || exit 1
