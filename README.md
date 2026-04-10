# 🎬 MultiStream Pro — Transmisión Profesional

Sistema robusto de orquestación para transmisiones en vivo simultáneas en **YouTube**, **Facebook**, **Instagram** y **Restream**, optimizado para baja latencia y alta estabilidad.

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
- **Node.js**: Versión 18 o superior.
- **Git**: Para clonar y gestionar versiones.
- **OBS Studio**: Con el plugin `obs-websocket` (incluido por defecto en versiones recientes de OBS).

### 2. Instalación
Clona el repositorio y entra en la carpeta del proyecto:
```bash
git clone [URL_DEL_REPOSITORIO]
cd multistream-pro
```

Instala las dependencias necesarias:
```bash
npm install
```

### 3. Configuración Inicial
1. Copia el archivo de ejemplo para crear tu archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Abre el archivo `.env` y rellena las llaves necesarias (ver la [Guía de Configuración](#-guía-de-configuración-llaves-maestras) más abajo).

### 4. Ejecución
Para iniciar el sistema en modo desarrollo:
```bash
npm run dev
```

Para iniciar el sistema en producción:
```bash
npm start
```

El Dashboard estará disponible en: **`http://localhost:3000`**

---

## 🛠️ Scripts Disponibles

- `npm start`: Inicia la aplicación en modo producción.
- `npm run dev`: Inicia la aplicación con recarga automática para desarrollo.
- `npm run precheck`: Ejecuta un diagnóstico de salud del sistema, hardware y conexión OBS.
- `npm run dashboard`: Inicia el servidor con el flag de dashboard activado.

---

## 🔑 Guía de Configuración (Llaves Maestras)

> [!IMPORTANT]
> **Privacidad 🔒:** Este repositorio es y debe mantenerse privado. No compartas nunca tu archivo `.env` ni hagas público este repositorio en el futuro.

### Paso 1: Conectar OBS Studio
El sistema necesita conectarse a tu OBS para controlar las escenas y sacar el video.
1. Abre **OBS Studio**.
2. Ve a **Herramientas > Configuración del servidor WebSocket**.
3. Marca **"Habilitar servidor WebSocket"** (Puerto por defecto `4455`).
4. Habilita la autenticación y establece una contraseña.
5. **En tu `.env`:**
   ```env
   OBS_HOST=localhost
   OBS_PORT=4455
   OBS_PASSWORD=tu_contraseña
   ```

### Paso 2: Restream (El motor Multistream)
1. Ve a [Restream Developers](https://developers.restream.io/).
2. Crea una aplicación con Redirect URI: `http://localhost:3000/auth/restream/callback`
3. Copia el `Client ID` y `Client Secret`.
4. **En tu `.env`:**
   ```env
   RESTREAM_CLIENT_ID=...
   RESTREAM_CLIENT_SECRET=...
   ```

### Paso 3: YouTube Live API (Google Cloud)
1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilita **YouTube Data API v3**.
3. Configura el consentimiento de OAuth y crea credenciales de "ID de cliente de OAuth".
4. Redirect URI: `http://localhost:3000/auth/youtube/callback`
5. **En tu `.env`:**
   ```env
   YOUTUBE_CLIENT_ID=...
   YOUTUBE_CLIENT_SECRET=...
   ```

### Paso 4: Facebook Live (Meta Developers)
1. Crea una aplicación en [Meta for Developers](https://developers.facebook.com/).
2. Añade el producto **Facebook Login**.
3. Redirect URI: `http://localhost:3000/auth/facebook/callback`
4. Copia el `App ID` y `App Secret`.
5. **En tu `.env`:**
   ```env
   FACEBOOK_APP_ID=...
   FACEBOOK_APP_SECRET=...
   ```

---

## 🏁 Paso Final: Autenticar
Una vez configurado el `.env`, inicia el servidor y ve a la pestaña **Plataformas** en el Dashboard. Haz clic en los botones de autenticación para vincular permanentemente tus cuentas de red social.

¡Ya estás listo para salir al aire! 🎉
