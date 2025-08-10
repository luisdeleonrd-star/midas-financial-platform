# Midas - Plataforma de Gestión Financiera para Condominios

Monorepo con arquitectura de microservicios (Node.js + Express + TypeScript), PostgreSQL, Redis, y frontends en React/React Native.

## Requisitos
- Node.js >= 18
- npm >= 9
- Docker + Docker Compose

## Comandos
- `npm install` instala dependencias de todos los paquetes
- `npm run docker:up` levanta Postgres, Redis, MinIO y servicios básicos
- `npm run dev` inicia el API Gateway en desarrollo
- `npm run build` compila todos los paquetes

## Estructura
- `services/*`: microservicios (auth, registry, finance, billing, messaging, reporting, api-gateway)
- `apps/*`: frontends (web-admin, staff-portal, mobile-resident)
- `packages/*`: librerías compartidas (types, utils, auth)

## Documentación API
Cada servicio expone `/docs` con Swagger UI.