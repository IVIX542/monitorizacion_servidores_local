# Guía de Configuración de Máquinas Virtuales (VMs)

Esta guía te ayudará a preparar el entorno necesario para que el **Dashboard de Control de Servidores** funcione correctamente con servidores reales.

## 1. Requisitos Previos

*   **VirtualBox**: Descarga e instala VirtualBox desde [virtualbox.org](https://www.virtualbox.org/).
*   **Imagen ISO**: Recomendamos **Ubuntu Server** (versión LTS) por ser estándar y facil de usar, o **Alpine Linux** si tienes poca RAM.
    *   [Descargar Ubuntu Server](https://ubuntu.com/download/server)

## 2. Creación de las VMs

Necesitaremos crear 3 máquinas virtuales. Para facilitar la integración con el código, sugerimos nombrarlas:
*   `server1`
*   `server2`
*   `server3`

### Pasos para cada VM:
1.  Abre VirtualBox y haz clic en **"Nueva"**.
2.  **Nombre**: `server1` (luego `server2`, `server3`).
3.  **ISO**: Selecciona la imagen de Ubuntu Server que descargaste.
4.  **Recursos**:
    *   **RAM**: 1024 MB (o 2048 MB si tienes suficiente).
    *   **CPU**: 1 vCPU.
5.  **Disco Duro**: 10-20 GB es suficiente.
6.  Termina el asistente y **NO LA INICIES AÚN**.

## 3. Configuración de Red

Para que tu PC (donde correrá el Dashboard) pueda comunicarse con las VMs via SSH, la configuración de red es crítica.

1.  Selecciona la VM y haz clic en **Configuración** -> **Red**.
2.  **Adaptador 1**:
    *   Conectado a: **Adaptador Puente (Bridged Adapter)**.
    *   *Nota*: Esto hará que la VM tenga una IP dentro de tu red local (como si fuera otro PC conectado a tu Router).
    *   *Alternativa*: Si prefieres una red aislada solo entre tu PC y las VMs, usa **Adaptador Solo-Anfitrión (Host-Only Adapter)**.

## 4. Instalación del Sistema Operativo

1.  Inicia la VM.
2.  Sigue los pasos de instalación de Ubuntu.
3.  **Importante**: Durante la instalación, marca la casilla **"Install OpenSSH server"**. Esto es fundamental.
4.  Crea un usuario (ej: `admin` o `usuario`) y contraseña.

## 5. Configuración de SSH (Sin contraseña)

El Dashboard necesita ejecutar comandos automáticamente sin pedir contraseña cada vez. Usaremos claves SSH.

### En tu Windows (Host):
1.  Abre PowerShell o CMD.
2.  Genera un par de claves si no tienes una:
    ```powershell
    ssh-keygen -t rsa -b 4096
    ```
    (Presiona Enter para todas las preguntas).
3.  Esto creará `id_rsa` y `id_rsa.pub` en `C:\Users\TU_USUARIO\.ssh\`.

### En las VMs (Linux):
Necesitamos copiar tu clave pública (`id_rsa.pub`) al archivo `authorized_keys` de cada VM.

1.  Inicia sesión en la VM.
2.  Averigua su IP con el comando: `ip addr` (busca algo como `192.168.1.X`).
3.  Desde tu Windows (PowerShell), copia la clave:
    ```powershell
    type $env:USERPROFILE\.ssh\id_rsa.pub | ssh usuario@192.168.1.XX "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
    ```
    *(Reemplaza `usuario` por tu usuario de la VM y `192.168.1.XX` por la IP de la VM)*.
4.  **Prueba**: Intenta entrar desde PowerShell: `ssh usuario@IP_DE_LA_VM`. Debería entrar sin pedir contraseña.

## 6. Comprobación Final

Asegúrate de que el comando `VBoxManage` funciona en tu terminal de Windows.
1.  Abre PowerShell.
2.  Escribe: `VBoxManage list vms`
3.  Deberías ver una lista con `server1`, `server2`, etc.

**¡Listo!** Ahora vuelve al chat para que continuemos con el desarrollo de la aplicación.
