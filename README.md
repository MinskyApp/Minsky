# 🎬 MultiStream Pro — Guía de Configuración
> **Privacidad 🔒:** Este repositorio es y debe mantenerse privado. No compartas nunca tu archivo `.env` ni hagas público este repositorio en el futuro, ya que contiene automatismos para tus cuentas de redes sociales.

Bienvenido a tu sistema personalizado para transmisión en vivo conectado a **OBS Studio**, **Restream**, **YouTube**, **Facebook** e **Instagram**. Para que todo funcione simplemente necesitas rellenar unas "Llaves Maestras" en tu archivo `.env`.

Aquí tienes el **paso a paso definitivo** para obtenerlas gratis y lograr conectarlo todo.

---

## 🛠️ Paso 1: Conectar OBS Studio (Transmisión y Renderizado)
El sistema necesita conectarse a tu OBS para controlar las escenas y sacar el video.
1. Abre tu **OBS Studio**.
2. En el menú superior, ve a **Herramientas > Configuración del servidor WebSocket**.
3. Marca **"Habilitar servidor WebSocket"**.
4. Deja el puerto en `4455`.
5. Asegúrate de marcar **"Habilitar autenticación"** y escribe una contraseña.
6. **En tu `.env`:**
   ```env
   OBS_HOST=localhost
   OBS_PORT=4455
   OBS_PASSWORD=la_contraseña_que_pusiste_en_obs
   ```

---

## 📡 Paso 2: Restream (El motor Multistream)
Usamos Restream para enviar tu señal a múltiples lados sin quemar tu computadora.
1. Ve a [Restream Developers](https://developers.restream.io/).
2. Inicia sesión con tu cuenta de Restream.
3. Haz clic en **Create Application**.
4. Ponle de nombre "MultiStream Pro Juan" y en **Redirect URI** pon exactamente esto:
   `http://localhost:3000/auth/restream/callback`
5. Al crearla te dará un `Client ID` y un `Client Secret`. Cópialos.
6. **En tu `.env`:**
   ```env
   RESTREAM_CLIENT_ID=pega_tu_client_id_aqui
   RESTREAM_CLIENT_SECRET=pega_tu_client_secret_aqui
   ```

---

## 🔴 Paso 3: YouTube Live API (Google Cloud)
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Inicia sesión con tu cuenta de Google y dale al botón de arriba a la izquierda para **Crear Proyecto** ("MultiStream").
3. Ve a **"API y Servicios"** > **"Biblioteca"**. Busca **YouTube Data API v3** y dale a "Habilitar".
4. Ve a **"Pantalla de consentimiento de OAuth"** (ponlo en "Externo", rellena los nombres obligatorios, ignora los logos y guarda hasta el final).
5. Ve a **"Credenciales"** > **Crear credenciales** > Elije **"ID de cliente de OAuth"**.
6. Selecciona "Aplicación Web". En "URI de redireccionamiento autorizados" debes añadir:  
   `http://localhost:3000/auth/youtube/callback`
7. Obtendrás un ID de Cliente y un Secreto de Cliente.
8. **En tu `.env`:**
   ```env
   YOUTUBE_CLIENT_ID=tu_id
   YOUTUBE_CLIENT_SECRET=tu_secreto
   ```

---

## 🔵 Paso 4: Facebook Live (Meta Developers)
1. Ve a [Meta for Developers](https://developers.facebook.com/).
2. Haz clic en "Mis Apps" y luego "Crear aplicación".
3. Tipo de App: **Business** o "Ninguno".
4. Entra al dashboard de tu nueva app de Facebook. En el menú de la izquierda, busca **Facebook Login** (o Configurar Producto) y añádelo.
5. En la configuración de Facebook Login, pon "URI de redireccionamiento OAuth válidos":  
   `http://localhost:3000/auth/facebook/callback`
6. En la parte izquierda ve a "Configuración" > "Básica" para ver el **Identificador de la aplicación (App ID)** y la **Clave secreta (App Secret)**.
7. **En tu `.env`:**
   ```env
   FACEBOOK_APP_ID=tu_app_id
   FACEBOOK_APP_SECRET=tu_app_secret
   ```

---

## 🟣 Paso 5: Instagram Live
La API directa de Instagram es súper restrictiva (requiere verificación de empresa de Meta de 15 días). **La mejor forma, la más rápida y la que usan los profesionales, es la Vía Restream:**
1. Ve a tu cuenta de Restream en [restream.io](https://restream.io/).
2. Vincula directamente ahí tu Instagram usando la opción de "Añadir Canal".
3. En el sistema que construimos (MultiStream Pro), selecciona la opción **"Vía Restream"** y activa el switch de Instagram. Nuestro orquestador hará el resto. 
*(Por eso en el `.env` la parte de INSTAGRAM_ACCESS_TOKEN la puedes dejar vacía).*

---

## 🚀 PASO FINAL: ¡Encender y Autenticar!

Una vez hayas copiado esos IDs y Secrets en tu `.env`:

1. Inicia el servidor del sistema:
   ```bash
   node src/index.js
   # o usa: npm run dev
   ```
2. Entra al dashboard desde tu navegador: `http://localhost:3000` (o `3001` si cambiaste el puente).
3. Entra a la pestaña **Plataformas**.
4. Ahora que tu sistema tiene las llaves, haz clic en todos los botones que dicen **"Autenticar YouTube"**, **"Autenticar Facebook"** y **"Autenticar Restream"**.
5. Te abrirá ventanas emergentes de Google, Facebook y Restream preguntándote *"¿Permitir a MultiStream controlar los en vivo?"*. Dile "Aceptar a todo".
6. **¡MAGIA!** El sistema se validará y guardará automáticamente los Tokens de Larga Duración en tu archivo `.env`.
   
Ya no tendrás que volver a hacer esto nunca más. Podrás darle al botón gigante de **IR EN VIVO** cuando quieras. 🎉
