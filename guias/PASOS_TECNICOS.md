# Registro Técnico de Implementación: Dashboard de Servidores

Este documento detalla el proceso técnico, las decisiones de arquitectura y las soluciones a problemas complejos implementadas durante el desarrollo del dashboard.

## 1. Arquitectura del Sistema
El sistema se diseñó con una arquitectura cliente-servidor clásica:
*   **Backend (Node.js/Express):** Actúa como intermediario entre la interfaz web y el sistema operativo anfitrión (Windows) y las máquinas virtuales (Linux).
*   **Frontend (HTML/JS/CSS):** Interfaz ligera que consulta el estado del backend mediante polling (recargas y llamadas fetch).
*   **Virtualización (VirtualBox):** Proveedor de infraestructura para los servidores simulados.

## 2. Implementación del Backend (`server.js`)

### Integración con VirtualBox
Para controlar las VMs, no utilizamos librerías de terceros (que suelen estar desactualizadas), sino que optamos por ejecutar directamente el CLI de VirtualBox (`VBoxManage`) usando `child_process.exec` nativo de Node.js.

*   **Comando de Estado:** `VBoxManage showvminfo "<nombre>" --machinereadable` para obtener el estado exacto (`running`, `poweredoff`).
*   **Comando de Inicio:** `VBoxManage startvm "<nombre>" --type headless` para iniciar sin interfaz gráfica.
*   **Comando de Parada:** Cambiamos de `acpipowerbutton` (suave) a `controlvm "<nombre>" poweroff` (forzado) para garantizar la respuesta inmediata de la UI.

### Conectividad SSH
Utilizamos la librería `node-ssh` para establecer conexiones remotas a las VMs.
*   **Reto:** Ejecutar comandos de terminal dentro de la VM desde el navegador.
*   **Solución:** Endpoint `POST /api/execute` que recibe un comando, conecta por SSH, ejecuta y devuelve `stdout`.

## 3. Desafíos Técnicos y Soluciones (Troubleshooting)

Esta fue la fase más crítica del proyecto. A continuación se documentan los obstáculos encontrados y cómo se resolvieron:

### A. Ubicación de `VBoxManage.exe`
*   **Problema:** El comando `VBoxManage` no se reconocía porque no estaba en el PATH del sistema Windows del usuario.
*   **Solución Técnica:** Implementamos una búsqueda dinámica en `runVBox`. Si el comando falla, el sistema busca automáticamente en la variable de entorno `VBOX_MSI_INSTALL_PATH` (ruta de instalación de VirtualBox) para encontrar el ejecutable.

### B. Formato de Claves SSH (`Unsupported key format`)
*   **Problema:** `node-ssh` (y la librería subyacente `ssh2`) no soportan el formato moderno de claves privadas de OpenSSH (que empieza con `-----BEGIN OPENSSH PRIVATE KEY-----`).
*   **Solución Técnica:** Se requirió generar claves en el formato "PEM" clásico (`-----BEGIN RSA PRIVATE KEY-----`).
    *   Comando usado: `ssh-keygen -m PEM -t rsa -b 2048`.

### C. Lectura de Clave Privada en Node.js
*   **Problema:** Error persistente `Cannot parse privateKey: Unsupported key format` incluso con claves PEM correctas.
*   **Causa:** En la configuración de `ssh.connect`, pasábamos `privateKey: server.privateKeyPath`. La librería interpretaba la **ruta del archivo** (string "C:\...") como si fuera el **contenido de la clave**.
*   **Solución de Código:**
    ```javascript
    // Incorrecto
    privateKey: server.privateKeyPath
    
    // Correcto (Solución aplicada)
    privateKey: fs.readFileSync(server.privateKeyPath, 'utf8')
    ```
    Esto fuerza a Node.js a leer el contenido del archivo de texto antes de pasarlo a la librería SSH.

## 4. Frontend y Experiencia de Usuario

*   **Estado en Tiempo Real:** Se implementó lógica para mapear los estados de VBox (`running`/`poweredoff`) a clases CSS (`on`/`off`) que cambian el color de los indicadores visuales.
*   **Feedback Asíncrono:** Para la ejecución de comandos SSH, usamos `fetch` asíncrono que espera la respuesta del servidor y actualiza el DOM del `<pre id="output">` sin recargar la página completa.

## 5. Scripts de Utilidad
Para facilitar el debugging, creamos herramientas auxiliares:
*   `debug_ssh.js`: Script aislado para probar la conexión SSH fuera del servidor web.
*   `generate_key.js`: Script para generar claves SSH válidas programáticamente si el usuario tenía problemas con los comandos de terminal.

---
**Estado Final:** El sistema es funcional, robusto ante rutas de instalación variables y capaz de gestionar conexiones seguras con claves privadas correctamente formateadas.
