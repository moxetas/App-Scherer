# MiTurno

Prototipo de app de cuadrantes para conductores de autobús, en **9 idiomas**: alemán, español, polaco, rumano, inglés, árabe, francés, portugués y japonés. Se instala en el iPhone desde Safari, sin pasar por la App Store.

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
| Ajustes | Cambiar el idioma y poner tu nombre. La primera vez, la app se abre en el idioma del teléfono. |

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
| `i18n.js` | Lista de idiomas disponibles. |
| `lang/*.js` | **Todos los textos de la app, un archivo por idioma.** |
| `tools/check-translations.js` | Comprueba que ningún idioma se ha dejado textos (`node tools/check-translations.js`). |
| `data.js` | Datos de ejemplo: servicios, mensajes, vehículos… |
| `app.js` | Pantallas y navegación. |
| `sw.js` | Guarda la app en el teléfono para que abra sin cobertura. |
| `manifest.webmanifest`, `icons/` | Nombre e icono al instalarla. |
| `chatmatrik-es.html` | Guía alemán → español de los términos de la app oficial. |

Para probarla en un ordenador basta con servir la carpeta, por ejemplo con `python3 -m http.server`, y abrir `http://localhost:8000`.

## Para el equipo de desarrollo

La idea que demuestra este prototipo es que la app oficial podría ofrecer **varios idiomas** con un selector en los ajustes.

- Todos los textos están separados del código, un archivo por idioma en `lang/`, con una clave por texto (`'absence.type': 'Tipo de ausencia'`). Es el mismo sistema que usan Flutter (archivos `.arb`), Android (`strings.xml`) o iOS (`Localizable.strings`), así que las traducciones se pueden pasar a cualquiera de esos formatos.
- **Árabe**: la pantalla entera se da la vuelta (de derecha a izquierda): menú, flechas, tablas y calendario. Las horas usan cifras latinas para que coincidan con los horarios.
- **Plurales**: cada idioma usa sus propias reglas («1 dzień / 2 dni» en polaco, «يومان» para dos días en árabe) mediante `Intl.PluralRules`.
- Fechas, meses y euros se formatean según el idioma con `Intl` (por ejemplo «2026年11月» en japonés).
- Añadir un idioma: copiar `lang/es.js`, traducirlo, añadir su código en `i18n.js` y cargarlo en `index.html` y `sw.js`. `tools/check-translations.js` avisa de cualquier texto que falte.
- El portugués es de Portugal y el inglés, británico.
- `data.js` es donde se conectaría la API real del sistema de planificación.
