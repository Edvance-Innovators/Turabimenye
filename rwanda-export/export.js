const { getProvinces, getDistricts, getSectors, getCells } = require('rwanda-locations');
const fs = require('fs');

const all = new Set();

// All provinces, districts, sectors, cells
getProvinces().forEach(p => {
  all.add(p);
  getDistricts(p).forEach(d => {
    all.add(d);
    getSectors(p, d).forEach(s => {
      all.add(s);
      getCells(p, d, s).forEach(c => all.add(c));
    });
  });
});

fs.writeFileSync(
  'data/places.json',
  JSON.stringify([...all].sort(), null, 2),
  'utf8'
);

console.log(`Wrote ${all.size} unique places.`);