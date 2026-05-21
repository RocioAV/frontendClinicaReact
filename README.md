# Front Clinica

Frontend en React + Vite listo para desplegar en Vercel.

## Variables de entorno

Configura en Vercel las siguientes variables, usando como referencia [.env.example](.env.example):

- `VITE_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Despliegue en Vercel

1. Sube este frontend a un repositorio.
2. Importa el proyecto en Vercel.
3. Define las variables de entorno.
4. Usa `npm run build` como build command.
5. El output se publica desde `dist`.

La configuración de SPA está resuelta en [vercel.json](vercel.json), así que las rutas de React funcionan al refrescar o entrar directo a una URL.
