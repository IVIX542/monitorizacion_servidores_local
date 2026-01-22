# Comandos de Prueba para el Dashboard

Esta lista contiene comandos útiles que puedes ejecutar desde el panel de control del Dashboard para verificar la conectividad y el estado de tus servidores Linux.

| Comando | Descripción | Respuesta Esperada (Ejemplo) |
| :--- | :--- | :--- |
| `hostname` | Muestra el nombre del servidor. | `server1` |
| `whoami` | Muestra el usuario actual ejecutando el comando. | `usuario` (o el usuario configurado en server.js) |
| `uptime` | Muestra cuánto tiempo lleva encendido el servidor. | `14:32:01 up 2 days, 4:10, 1 user, load average: 0.00...` |
| `ls -la` | Lista archivos en el directorio actual (home). | Lista de archivos con permisos, fechas, etc. |
| `pwd` | Muestra la ruta del directorio actual. | `/home/usuario` |
| `free -m` | Muestra la memoria RAM usada/libre en MB. | `Mem: 2048 512 1024 ...` |
| `df -h` | Muestra el espacio en disco disponible. | `Filesystem Size Used Avail Use% Mounted on...` |
| `cat /etc/os-release` | Muestra información de la distribución Linux. | `PRETTY_NAME="Ubuntu 22.04 LTS"...` |
| `ps aux | head -n 5` | Muestra los primeros 5 procesos activos. | Lista de procesos (PID, CPU%, MEM%, COMMAND) |
| `date` | Muestra la fecha y hora del servidor. | `Wed Jan 22 14:35:00 UTC 2026` |
| `ip addr` | Muestra las direcciones IP y configuración de red. | Bloque de texto con interfaces (eth0, lo) y sus IPs (`inet 192.168...`) |
| `top -b -n 1 | head -n 5` | Muestra un "snapshot" del uso de CPU/RAM. | Resumen de tareas, CPU y memoria similar al administrador de tareas. |

## Pruebas de Error (Para verificar manejo de errores)

*   `comando_invalido`: Debería devolver un error en `stderr` tipo `command not found`.
*   `cat /root/archivo_secreto`: Si no usas root, debería devolver error de permiso denegado.
