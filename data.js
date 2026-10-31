// Datos de ejemplo. Todo es inventado: ni personas, ni vehículos, ni lugares reales.
// Cuando haya una conexión con el sistema de la empresa, esto se sustituye por sus datos.

const PLACES = {
  north: { es: 'Cocheras Norte', de: 'Depot Nord' },
  central: { es: 'Estación Central', de: 'Hauptbahnhof' },
};

const ROUTES_INFO = {
  r01: { es: '01_Lu,Ma,Ju Colegio', de: '01_Mo,Di,Do Schule' },
  r03: { es: '03_Mi Colegio', de: '03_Mi Schule' },
  r05: { es: 'Línea 4', de: 'Linie 4' },
  r05sun: { es: 'Línea 4 · domingo', de: 'Linie 4 · Sonntag' },
};

const SERVICES = {
  s1028: { kind: 'service', id: '1028', route: 'r01', start: '06:58', end: '16:50', from: 'north', to: 'north' },
  s1028mi: { kind: 'service', id: '1028', route: 'r03', start: '06:58', end: '16:50', from: 'north', to: 'north' },
  s1032: { kind: 'service', id: '1032', route: 'r05', start: '06:55', end: '16:45', from: 'north', to: 'north' },
  s7702: { kind: 'service', id: '7702', route: 'r05sun', start: '07:10', end: '15:50', from: 'central', to: 'north' },
};

// Dietas por día de servicio, en euros
const DIET_PER_SERVICE = 12;

const OFFERS = [
  { id: 'o1', inDays: 2, service: '7704', start: '07:29', end: '13:34', from: 'Jonas K.' },
  { id: 'o2', inDays: 5, service: '1032', start: '06:55', end: '16:45', from: 'Marta R.' },
  { id: 'o3', inDays: 9, service: '7706', start: '07:51', end: '15:06', from: 'Ali D.' },
  { id: 'o4', inDays: 12, service: '1028', start: '06:58', end: '16:50', from: 'Sven P.' },
];

const VEHICLES = ['101', '102', '103', '104', '105', '106', '108', '110', '111', '112', '114', '120']
  .map((n) => ({ fleet: n, plate: 'DE-MO ' + n }));

const MESSAGES = [
  {
    id: 'm1', daysAgo: 0,
    from: { es: 'Planificación', de: 'Disposition' },
    title: { es: 'Vacaciones aprobadas', de: 'Urlaub genehmigt' },
    body: {
      es: 'Tus vacaciones del 21 al 23 de diciembre están aprobadas. ¡Que las disfrutes!',
      de: 'Dein Urlaub vom 21. bis 23. Dezember ist genehmigt. Schöne Tage!',
    },
  },
  {
    id: 'm2', daysAgo: 2,
    from: { es: 'Taller', de: 'Werkstatt' },
    title: { es: 'Coche 104 en el taller', de: 'Wagen 104 in der Werkstatt' },
    body: {
      es: 'El coche 104 está en el taller hasta el viernes. Si te toca, coge el 108.',
      de: 'Wagen 104 ist bis Freitag in der Werkstatt. Wenn du ihn eingeteilt hast, nimm Wagen 108.',
    },
  },
  {
    id: 'm3', daysAgo: 5,
    from: { es: 'Oficina', de: 'Büro' },
    title: { es: 'Descarga de la tarjeta de conductor', de: 'Fahrerkarte auslesen' },
    body: {
      es: 'Recuerda descargar la tarjeta de conductor antes de fin de mes.',
      de: 'Bitte lies deine Fahrerkarte vor Monatsende aus.',
    },
  },
];

const BOARD = [
  {
    id: 'b1', daysAgo: 1,
    title: { es: 'Desvío de la línea 4', de: 'Umleitung Linie 4' },
    body: {
      es: 'Desde el lunes, la línea 4 se desvía por la avenida del Parque por obras. Las paradas provisionales están señalizadas.',
      de: 'Ab Montag wird die Linie 4 wegen Bauarbeiten über die Parkallee umgeleitet. Die Ersatzhaltestellen sind ausgeschildert.',
    },
  },
  {
    id: 'b2', daysAgo: 4,
    title: { es: 'Horario de invierno', de: 'Winterfahrplan' },
    body: {
      es: 'El horario de invierno empieza el 13 de diciembre. Los cuadrantes nuevos saldrán en la app la semana anterior.',
      de: 'Der Winterfahrplan gilt ab 13. Dezember. Die neuen Dienstpläne erscheinen eine Woche vorher in der App.',
    },
  },
  {
    id: 'b3', daysAgo: 9,
    title: { es: 'Curso de primeros auxilios', de: 'Erste-Hilfe-Kurs' },
    body: {
      es: 'Quedan plazas para el curso del 20 de noviembre. Apúntate en la oficina.',
      de: 'Für den Kurs am 20. November gibt es noch freie Plätze. Anmeldung im Büro.',
    },
  },
];
