# Instrucciones de Uso y Configuración

Este documento detalla paso a paso cómo configurar y ejecutar el Dashboard de Control de Servidores.

## 1. Configuración de Máquinas Virtuales (VirtualBox)

Sigue la guía detallada en `guia_vms.md` para crear las máquinas virtuales.
**Puntos clave:**
*   Nombres de VM: `server1`, `server2`, `server3`.
*   Red: **Adaptador Puente (Bridged)** para que tengan IPs en tu red local.
*   Usuario: `usuario` (si usas otro, actualiza `server.js`).
*   SSH: Debe estar instalado (`sudo apt install openssh-server`).

### Configuración de Claves SSH
El dashboard se conecta automáticamente sin contraseña.
1.  Genera claves en Windows (Powershell): `ssh-keygen -t rsa` (enter a todo).
2.  Copia la clave pública a cada VM:
    ```powershell
    type $env:USERPROFILE\.ssh\id_rsa.pub | ssh usuario@IP_DE_LA_VM "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
    ```

## 2. Configuración del Proyecto

### Requisitos
*   [Node.js](https://nodejs.org/) instalado.
*   **VirtualBox** instalado y agregado al PATH (generalmente `C:\Program Files\Oracle\VirtualBox` debe estar en las Variables de Entorno del sistema para que el comando `VBoxManage` funcione).

### Instalación de Dependencias
Abre una terminal en la carpeta `dashboard` y ejecuta:
```bash
npm install
```

### Configuración de Servidores
Abre `dashboard/server.js` y busca la sección de configuración:
```javascript
const servers = [
    { id: '1', name: 'server1', ip: '192.168.1.101', user: 'usuario', privateKeyPath: 'C:\\Users\\razon\\.ssh\\id_rsa' },
    ...
];
```
*   **IPs**: Actualiza las IPs con las que tienen tus VMs actualmente (usa `ip addr` en cada VM para verlas).
*   **User**: Cambia `usuario` por tu usuario de Linux.
*   **PrivateKeyPath**: Asegúrate de que la ruta a tu clave privada es correcta.

## 3. Ejecución

1.  Inicia el servidor Node.js:
    ```bash
    npm start
    ```
2.  Deberías ver: `Server running at http://localhost:3000`
3.  Abre tu navegador en [http://localhost:3000](http://localhost:3000).

## 4. Uso del Dashboard

*   **Estado**: Verás si los servidores están **RUNNING** (verde) o **STOPPED** (rojo).
*   **Start/Stop**:
    *   **Start**: Inicia la VM en modo "headless" (sin ventana).
    *   **Stop**: Envía una señal ACPI de apagado (como pulsar el botón).
*   **Comandos**: Escribe un comando (ej: `uptime`, `ls -la`, `ifconfig`) y pulsa **Run** para verlo en tiempo real.
*   **CPU**: Pulsa **Get CPU Load** para ver el uso actual del procesador.

## Solución de Problemas

*   **Error: VBoxManage not found**: Agrega la carpeta de VirtualBox a tu PATH de Windows.
*   **Error: Connection failed**:
    *   Verifica que la IP es correcta.
    *   Verifica que puedes entrar por SSH manualmente (`ssh usuario@IP`).
    *   Verifica la ruta de la `privateKeyPath`.
*   **El servidor no arranca**: Verifica el nombre de la VM en VirtualBox vs `server.js`.
