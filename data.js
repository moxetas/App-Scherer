// Datos de ejemplo. Todo es inventado: ni personas, ni vehículos, ni lugares reales.
// Los nombres de lugares y líneas se traducen en lang/*.js (place.* y route.*).
// Cuando haya una conexión con el sistema de la empresa, esto se sustituye por sus datos.

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

// Los textos de mensajes y avisos están en lang/*.js con las claves msg.<id>.* y post.<id>.*
const MESSAGES = [
  { id: 'm1', daysAgo: 0 },
  { id: 'm2', daysAgo: 2 },
  { id: 'm3', daysAgo: 5 },
];

const BOARD = [
  { id: 'b1', daysAgo: 1 },
  { id: 'b2', daysAgo: 4 },
  { id: 'b3', daysAgo: 9 },
];
