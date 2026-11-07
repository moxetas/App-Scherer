// Idiomas de la app. Cada idioma está en su propio archivo dentro de lang/.
// Para añadir uno: copia lang/es.js, cambia el código (por ejemplo «it»), traduce los valores,
// añade el código a LANGUAGES y carga el archivo en index.html y sw.js.
const LANGUAGES = ['de', 'es', 'pl', 'ro', 'en', 'ar', 'fr', 'pt', 'ja'];

// Idioma de reserva si el del teléfono no está en la lista
const FALLBACK_LANGUAGE = 'de';

const STRINGS = {};
