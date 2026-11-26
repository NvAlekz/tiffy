# Tiffy

<p align="center">
  <img src="docs/logo.png" alt="Tiffy Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Ventana flotante de notas rápidas e imágenes en tiempo real para dos personas.<br>Invisible al compartir pantalla en Windows 10/11.</strong>
</p>

<p align="center">
  <a href="#-características"><strong>Características</strong></a> •
  <a href="#-tech-stack"><strong>Tech Stack</strong></a> •
  <a href="#-arquitectura"><strong>Arquitectura</strong></a> •
  <a href="#-instalación-y-uso"><strong>Instalación</strong></a> •
  <a href="#-atajos-de-teclado"><strong>Atajos</strong></a> •
  <a href="#-seguridad-y-privacidad"><strong>Privacidad</strong></a> •
  <a href="#-build-y-distribución"><strong>Build</strong></a>
</p>

---

## ✨ Características

| Feature | Descripción |
|---------|-------------|
| **🪟 Ventana flotante** | Frameless, siempre visible (`Always on Top`), fuera de barra de tareas y `Alt+Tab` |
| **🛡️ Invisible a capturas** | `WDA_EXCLUDEFROMCAPTURE` — no aparece en Zoom, Teams, Discord, OBS, Game Bar |
| **⚡ Tiempo real** | Firebase Realtime Database — latencia < 100 ms típica |
| **🖼️ Imágenes comprimidas** | WebP adaptativo en canvas (máx 650 KB base64), drag & drop + paste (Ctrl+V) |
| **🔐 Salas privadas** | Código de sala + alias, persistencia en `localStorage`, auto-reconexión |
| **👻 Modo fantasma** | Clics atraviesan la ventana (`setIgnoreMouseEvents(forward: true)`) con banner visual |
| **🎚️ Opacidad adaptable** | Ciclo 100% → 75% → 45% → 20% |
| **🌙 Dark glass UI** | Tailwind CSS v4, glassmorphism, animaciones sutiles, responsive (280–360 px) |
| **🔒 Arquitectura segura** | `contextIsolation`, `sandbox`, `nodeIntegration: false`, CSP en producción, preload mínimo |

---

## 🛠 Tech Stack

| Capa | Tecnología |
|------|------------|
| **Desktop** | Electron 45 (latest stable) |
| **Frontend** | React 19 + Vite 8 |
| **Estilos** | Tailwind CSS 4 (JIT) |
| **Icons** | Lucide React |
| **Backend** | Firebase Realtime Database (SDK modular v13) |
| **Build** | electron-builder (NSIS, x64) |
| **Lint/Format** | ESLint + Prettier (config incluido) |

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROCESS: MAIN                            │
│  electron/main.js                                               │
│  ├─ BrowserWindow (360×520, frameless, transparent, toolbar)   │
│  ├─ setContentProtection(true)  ← WDA_EXCLUDEFROMCAPTURE        │
│  ├─ setAlwaysOnTop(true, 'screen-saver')                        │
│  ├─ Global Shortcuts (Ctrl+Shift+H/J/O)                         │
│  ├─ IPC Handlers (ghost, opacity, hide, copy, quit)             │
│  └─ contextBridge → preload.js                                  │
└─────────────────────────────────────────────────────────────────┘
                              │ IPC (contextBridge)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PROCESS: RENDERER                          │
│  src/                                                           │
│  ├─ App.jsx          → Session routing (Setup / Join / Chat)   │
│  ├─ components/      → JoinScreen, ChatScreen, TitleBar, etc.  │
│  ├─ hooks/           → useDesktopBridge, useRoomMessages       │
│  ├─ lib/             → firebase, messages, images, storage     │
│  └─ styles.css       → Tailwind + custom animations            │
└─────────────────────────────────────────────────────────────────┘
                              │ Firebase SDK (modular)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE REALTIME DATABASE                   │
│  rooms/{roomCode}/messages                                      │
│  ├─ .read = true, .write = true                                 │
│  ├─ .indexOn = ["createdAt"]                                    │
│  └─ .validate = strict schema (alias, senderId, type, etc.)    │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de datos

```
Usuario A                          Usuario B
   │                                 │
   ├─ Escribe nota / pega imagen    │
   │                                 │
   ▼                                 ▼
Compresión WebP (canvas)      ◄──►  Firebase RTDB
   │                                 │
   ├─ push({type, text/image,      │
   │     alias, senderId,           │  onValue(rooms/{code}/messages)
   │     createdAt: serverTime})    │       │
   │                                 │       ▼
   │                                 │  Render MessageList
   │                                 │  (rise animation)
   │                                 │
   └────────────── Real-time ────────┘
```

---

## 🚀 Instalación y uso

### Prerrequisitos

- **Windows 10 2004+** / **Windows 11** (para `WDA_EXCLUDEFROMCAPTURE`)
- **Node.js 22.12+** (LTS recomendado)
- Cuenta **Firebase** (plan Spark gratuito basta)

---

### 1. Clonar y dependencias

```powershell
git clone https://github.com/TU_USUARIO/tiffy.git
cd tiffy
npm install
```

> `npm install` ejecuta `postinstall: install-electron` automáticamente.

---

### 2. Configurar Firebase

1. **Crear proyecto** en [Firebase Console](https://console.firebase.google.com/)
2. **Build → Realtime Database** → **Crear base de datos**
   - Ubicación: `us-central1` (o la más cercana)
   - Modo: **Modo de prueba** (cambiarás las reglas después)
3. **⚙️ Configuración del proyecto → Tus apps** → **Web (`</>`)**
   - Nombre: `Tiffy Desktop`
   - Copiar `firebaseConfig`
4. **Publicar reglas** (pestaña **Reglas**):

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "rooms": {
      "$room": {
        "messages": {
          ".read": true,
          ".write": true,
          ".indexOn": ["createdAt"],
          "$message": {
            ".validate": "newData.hasChildren(['alias','senderId','type','createdAt']) && newData.child('alias').isString() && newData.child('alias').val().length > 0 && newData.child('alias').val().length <= 24 && newData.child('senderId').isString() && newData.child('senderId').val().length > 0 && newData.child('senderId').val().length <= 64 && newData.child('createdAt').isNumber() && ((newData.child('type').val() === 'text' && newData.child('text').isString() && newData.child('text').val().length <= 4000) || (newData.child('type').val() === 'image' && newData.child('image/dataUrl').isString() && newData.child('image/dataUrl').val().length <= 1500000 && newData.child('image/width').isNumber() && newData.child('image/height').isNumber()))"
          }
        }
      }
    }
  }
}
```

> ⚠️ **Importante**: Sin estas reglas, la app mostrará `permission_denied`.

---

### 3. Variables de entorno

```powershell
Copy-Item .env.example .env.local
```

Edita `.env.local` con **tus 5 valores** de Firebase:

```dotenv
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

> **Nunca comitees `.env.local`** — está en `.gitignore`.

---

### 4. Desarrollo (Hot Reload)

```powershell
npm run dev
```

- Vite en `http://127.0.0.1:5173/`
- Electron carga esa URL con `VITE_DEV_SERVER_URL`
- Cambios en `src/` → recarga instantánea

---

### 5. Producción

```powershell
# Compilar renderer
npm run build

# Ejecutar build de producción
npm run start

# Generar instalador NSIS (release/Tiffy-1.0.0-setup.exe)
npm run dist:win
```

---

## ⌨️ Atajos de teclado (Globales)

| Atajo | Acción |
|-------|--------|
| `Ctrl + Shift + H` | **Ocultar / Mostrar** (`showInactive` — no roba foco) |
| `Ctrl + Shift + J` | **Modo fantasma** — clics atraviesan + banner "Clics atravesando" |
| `Ctrl + Shift + O` | **Ciclo opacidad** — 100% → 75% → 45% → 20% |

> Se registran al arrancar y se desregistran en `will-quit`.

### Dentro de la app

| Tecla | Acción |
|-------|--------|
| `Enter` | Enviar mensaje |
| `Shift + Enter` | Salto de línea |
| `Ctrl + V` | Pegar imagen del portapapeles |
| Drag & Drop | Soltar archivo de imagen sobre la ventana |

---

## 🔒 Seguridad y privacidad

| Capa | Medida |
|------|--------|
| **Captura de pantalla** | `BrowserWindow.setContentProtection(true)` → `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` en Windows 10 2004+. Bloquea capturas por software (Zoom, Teams, Discord, OBS, Game Bar, PrintScreen). **No bloquea** cámaras externas ni miradas físicas. |
| **Barra de tareas / Alt+Tab** | `skipTaskbar: true`, `type: 'toolbar'` |
| **Siempre arriba** | `setAlwaysOnTop(true, 'screen-saver')` — por encima de ventanas normales y juegos en ventana sin bordes |
| **Aislamiento Electron** | `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `devTools: false` (prod), navegación externa bloqueada |
| **CSP (Producción)** | Inyectada por Vite solo en build: `default-src 'self'; script-src 'self'; connect-src Firebase endpoints; frame-ancestors 'none'` |
| **Datos en tránsito** | HTTPS/TLS 1.3 (Firebase) |
| **Datos en reposo** | Firebase Realtime Database (cifrado en reposo por Google). **No hay cifrado extremo a extremo** — no compartas secretos. |
| **Reglas Firebase** | Validación estricta por mensaje (tipo, longitud, campos requeridos). Acceso solo a `rooms/{room}/messages`. |

> ⚠️ **Limitaciones**: Una cámara apuntando a la pantalla **sí ve** la ventana. La protección es contra *software* de captura, no contra ojos físicos.

---

## 📦 Build y distribución

### Scripts disponibles

```json
{
  "dev": "concurrently vite + electron (hot reload)",
  "build": "vite build (renderer → dist/)",
  "start": "npm run build && electron . (prod)",
  "dist:win": "npm run build && electron-builder --win (NSIS x64)",
  "preview": "vite preview (static serve dist/)"
}
```

### Salida `dist:win`

```
release/
├── Tiffy-1.0.0-setup.exe        # Instalador NSIS (~140 MB)
├── Tiffy-1.0.0-setup.exe.blockmap
├── builder-debug.yml
└── win-unpacked/                # App portable
    ├── Tiffy.exe                # Ejecutable directo
    └── ... (runtimes Electron)
```

### Instalador NSIS (config en `package.json`)

- `oneClick: false` → asistente clásico
- `perMachine: false` → usuario actual (no admin)
- `allowToChangeInstallationDirectory: true`
- `createDesktopShortcut: true`
- `artifactName: Tiffy-${version}-setup.${ext}`

### Firma de código (opcional, para evitar SmartScreen)

```powershell
# Variables de entorno para electron-builder
$env:CSC_LINK = "ruta/a/certificado.p12"
$env:CSC_KEY_PASSWORD = "password-del-cert"
npm run dist:win
```

> Requiere certificado **EV Code Signing** (DigiCert, Sectigo, etc.) para reputación inmediata.

---

## 📁 Estructura del proyecto

```
tiffy/
├── electron/
│   ├── main.js        # Ventana, shortcuts, IPC, content protection
│   └── preload.js     # contextBridge API (window.tiffy)
├── src/
│   ├── App.jsx        # Routing: Setup → Join → Chat
│   ├── components/    # UI: JoinScreen, ChatScreen, TitleBar, Composer,
│   │                  # MessageList, Lightbox, ConfirmDialog, Toast,
│   │                  # GhostBanner, Logo, SetupScreen
│   ├── hooks/         # useDesktopBridge, useRoomMessages
│   ├── lib/           # firebase, messages, images, storage, constants, utils
│   └── styles.css     # Tailwind + animations + scrollbars
├── database.rules.json    # Reglas Firebase (publicar en Console)
├── firebase.json          # Config Firebase CLI (opcional)
├── vite.config.mjs        # Vite + React + Tailwind + CSP plugin
├── package.json           # Scripts, deps, electron-builder config
├── .env.example           # Template de variables
├── .gitignore
└── README.md
```

---

## 🧪 Testing rápido

```powershell
# 1. Abre dos instancias (dev o build)
npm run dev
# En otra terminal/pestaña:
npm run dev

# 2. Usa mismo código de sala, alias distintos
# 3. Escribe, pega imágenes (Ctrl+V), arrastra archivos
# 4. Prueba atajos: H (hide), J (ghost), O (opacity)
# 5. Verifica en OBS/Zoom: ventana NO aparece en captura
```

---

## 🤝 Contribuir

1. Fork → rama `feature/nueva-cosa`
2. `npm run lint` (si configuras ESLint)
3. Commit convencional: `feat: add image compression quality slider`
4. PR → revisión → merge

### Ideas para contribuir

- [ ] Cifrado extremo a extremo (Web Crypto API + clave derivada de sala)
- [ ] Soporte macOS/Linux (ajustar `type`, `contentProtection`)
- [ ] Notificaciones push (Firebase Cloud Messaging + Service Worker)
- [ ] Temas de color personalizables
- [ ] Historial de salas recientes
- [ ] Tests E2E (Playwright + Electron)

---

## 📄 Licencia

MIT License — ver [LICENSE](LICENSE) (añadir si deseas).

---

## 🙏 Créditos

- **Electron** — Framework desktop
- **React** + **Vite** — Frontend moderno
- **Tailwind CSS** — Utility-first styling
- **Firebase** — Backend realtime sin servidor
- **Lucide** — Iconos limpios
- **Comunidad open source** — Issues, PRs, feedback

---

<p align="center">
  <strong>Hecho con ❤️ para dos personas que quieren su espacio privado.</strong>
</p>

<p align="center">
  <a href="https://github.com/TU_USUARIO/tiffy/issues">Reportar bug</a> •
  <a href="https://github.com/TU_USUARIO/tiffy/discussions">Preguntar</a> •
  <a href="https://github.com/TU_USUARIO/tiffy/pulls">Contribuir</a>
</p>