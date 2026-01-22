# 📘 Technical Walkthrough: Dashboard de Control de Servidores

Este documento detalla la arquitectura, tecnologías y APIs utilizadas para construir la aplicación de monitorización y control de servidores.

## 🏗️ Arquitectura del Sistema

La aplicación sigue una arquitectura **Cliente-Servidor** con comunicación en tiempo real.

*   **Frontend**: Interfaz Web (SPA - Single Page Application) que gestiona la UI, temas y conexión socket.
*   **Backend**: Servidor Node.js que actúa como puente (Bridge).
*   **Target Infrastructure**: Máquinas Virtuales (VirtualBox) accesibles vía SSH y comandos VBoxManage.

### Diagrama de Flujo
```mermaid
graph TD
    User[Navegador Web] <-->|HTTP REST| Express[Servidor Express/Node]
    User <-->|WebSockets (Socket.io)| Express
    
    Express -->|VBoxManage (CLI)| VirtualBox[VM Controller]
    Express <-->|SSH Protocol| LinuxVM[Linux Server]
    Express <-->|SSH Protocol| WinVM[Windows Server]
    
    VirtualBox --> LinuxVM
    VirtualBox --> WinVM
```

---

## 🛠️ Stack Tecnológico

### Backend (Node.js)
*   **Express.js**: Framework web para servir la app y las APIs REST.
*   **Socket.io**: Motor de WebSockets para el streaming bidireccional de la terminal en tiempo real.
*   **Node-SSH**: Librería cliente SSH para ejecutar comandos y abrir shells interactivas desde el servidor.
*   **Child Process (Nativo)**: Para ejecutar comandos del sistema local (VBoxManage).

### Frontend (Web)
*   **HTML5 / CSS3**: Estructura y diseño. Uso de **CSS Variables** para el sistema de temas (Theming).
*   **JavaScript (Vanilla)**: Lógica de cliente sin frameworks pesados.
*   **Xterm.js**: Componente de terminal web (el mismo que usa VS Code) para renderizar la consola SSH en el navegador.
    *   *xterm-addon-fit*: Plugin para ajustar el tamaño de la terminal al contenedor.
*   **Canvas API**: Utilizada para las animaciones de fondo de alto rendimiento (Matrix Rain, Tron Grid).

---

## 🔌 API Reference - REST Endpoints

Endpoints HTTP utilizados para operaciones de control y estado "estáticas".

| Método | Endpoint | Descripción | Body Req | Respuesta |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/servers` | Devuelve la lista de servidores y su estado (VBox). | - | JSON Array `[{id, name, status, ip...}]` |
| `POST` | `/api/servers/start` | Inicia una VM apagada. | `{id: "1"}` | `200 OK` |
| `POST` | `/api/servers/stop` | Apaga forzosamente una VM (Poweroff). | `{id: "1"}` | `200 OK` |
| `POST` | `/api/stats/cpu` | Obtiene el uso de CPU actual vía SSH. | `{id: "1"}` | `{"cpu": 15.5}` |
| `POST` | `/api/stats/os` | Obtiene info del SO y Kernel vía SSH. | `{id: "1"}` | `{"os": "Ubuntu...", "kernel": "5.15..."}` |

---

## ⚡ WebSocket Events (Socket.io)

Protocolo de eventos para la terminal interactiva.

### Conexión
1.  **Frontend** emite `start_ssh_session` con el `serverId`.
2.  **Backend** inicia conexión SSH, abre una shell, y crea un "pipe" de datos.

### Eventos
*   `term_input`: (Cliente -> Servidor) Envía cada tecla pulsada en xterm al backend SSH.
*   `term_data:${serverId}`: (Servidor -> Cliente) Envía el stream de texto crudo (stdout/stderr) del SSH al navegador para que xterm lo pinte.

---

## 🎨 Sistema de Temas (Theming)

El sistema de personalización visual se basa en dos pilares:

1.  **CSS Variables (`:root` vs `body.theme-X`)**:
    *   Cambiamos dinámicamente la clase del `body`.
    *   Variables como `--text-main`, `--bg-color` se redefinen automáticamente.
    
2.  **Motor de Animaciones (`animations.js`)**:
    *   Clase estática `Animations` que gestiona un `<canvas>` en el background.
    *   **Matrix**: Lluvia de caracteres (bucle de dibujado canvas).
    *   **Mr. Robot**: Glitch effect aleatorio (CSS + Canvas noise).
    *   **Tron**: Renderizado de líneas de perspectiva en movimiento (Canvas).

## 🔒 Seguridad y Acceso
*   **SSH Key-Based Auth**: El backend utiliza una clave privada RSA local (`id_rsa`) para autenticarse contra todos los servidores gestionados, evitando almacenar contraseñas.
*   **Gestión de Windows**: El sistema está preparado para soportar Windows Server mediante OpenSSH server, unificando la administración bajo el mismo protocolo estándar.
