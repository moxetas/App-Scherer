# MiTurno

Prototipo de app de cuadrantes para conductores de autobús, en **español y alemán**. Se instala en el iPhone desde Safari, sin pasar por la App Store.

Es un proyecto independiente: no usa el nombre, el logotipo ni los datos de ninguna empresa. Todo lo que muestra son **datos de ejemplo inventados**.

## Qué hace

| Apartado | Qué permite |
| --- | --- |
| Cuadrante | Ver los servicios y días libres de las próximas cinco semanas, agrupados por semana. |
| Calendario | Ver el mes entero con colores: servicio, libre y vacaciones. Al tocar un día se ve su detalle. |
| Ausencias | Pedir vacaciones, un día libre o compensación de horas, y ver las solicitudes enviadas. |
| Bolsa de servicios | Pedir servicios que ceden los compañeros. |
| Partes de actividad | Ver el parte mensual con horas retribuidas, dietas y resumen para la nómina. |
| Parte de daños | Elegir un vehículo por matrícula y avisar de un daño, con foto. |
| Mensajes y tablón | Avisos personales y avisos para toda la plantilla. |
| Ajustes | Cambiar el idioma (español / alemán) y poner tu nombre. |

Lo que escribes (solicitudes, partes, tu nombre) se guarda solo en tu teléfono.

## Instalarla en el iPhone

La app se publica con GitHub Pages. Solo hay que activarlo una vez:

1. En GitHub, abre el repositorio y ve a **Settings → Pages**.
2. En **Build and deployment → Source**, elige **Deploy from a branch**.
3. En **Branch**, elige la rama donde está la app y la carpeta **/ (root)**. Pulsa **Save**.
4. Al cabo de uno o dos minutos, la app estará en `https://moxetas.github.io/App-Scherer/`.

Después, en el iPhone:

1. Abre esa dirección en **Safari**.
2. Toca el botón **Compartir** (el cuadrado con la flecha hacia arriba).
3. Elige **Añadir a pantalla de inicio** y toca **Añadir**.

Cada vez que se suben cambios a la rama, la app se actualiza sola la próxima vez que la abres con conexión.

## Cómo está hecha

Es una web normal (HTML, CSS y JavaScript) sin librerías ni servidor:

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura de la app. |
| `styles.css` | Diseño, con modo claro y oscuro. |
| `i18n.js` | **Todos los textos de la app en español y alemán.** |
| `data.js` | Datos de ejemplo: servicios, mensajes, vehículos… |
| `app.js` | Pantallas y navegación. |
| `sw.js` | Guarda la app en el teléfono para que abra sin cobertura. |
| `manifest.webmanifest`, `icons/` | Nombre e icono al instalarla. |
| `chatmatrik-es.html` | Guía alemán → español de los términos de la app oficial. |

Para probarla en un ordenador basta con servir la carpeta, por ejemplo con `python3 -m http.server`, y abrir `http://localhost:8000`.

## Para el equipo de desarrollo

La idea que demuestra este prototipo es que la app oficial podría ofrecer **varios idiomas** con un selector en los ajustes.

- Todos los textos están separados del código en `i18n.js`, con una clave por texto (`'absence.type': 'Tipo de ausencia'`). Es el mismo sistema que usan Flutter (archivos `.arb`), Android (`strings.xml`) o iOS (`Localizable.strings`), así que las traducciones se pueden pasar a cualquiera de esos formatos.
- Añadir un idioma nuevo (polaco, rumano, turco…) consiste en copiar el bloque `es` de `i18n.js` y traducir los valores.
- Fechas, meses y números se formatean según el idioma con `Intl`, sin traducirlos a mano.
- `data.js` es donde se conectaría la API real del sistema de planificación.

## Cuentas del mes

En la carpeta [`cuentas/`](cuentas/) está **Cuentas del mes**, una app instalable para llevar las cuentas del mes (qué entra, qué sale y a dónde va cada euro). Cada persona que abre el enlace ve solo sus propios datos, que se guardan en su teléfono. Tiene su propio [README](cuentas/README.md).

Se publica con GitHub Actions en `https://moxetas.github.io/App-Scherer/cuentas/`. Para eso, en **Settings → Pages → Build and deployment → Source** hay que elegir **GitHub Actions** (en lugar de *Deploy from a branch*). El flujo publica MiTurno en la raíz igual que ahora y añade la app de cuentas en `/cuentas/`.
