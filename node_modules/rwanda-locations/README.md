# rwanda-locations

> A lightweight npm package to query Rwanda's administrative hierarchy: Provinces → Districts → Sectors → Cells → Villages.

[![npm version](https://img.shields.io/npm/v/rwanda-locations.svg)](https://www.npmjs.com/package/rwanda-locations)
[![license](https://img.shields.io/npm/l/rwanda-locations.svg)](LICENSE)
[![downloads](https://img.shields.io/npm/dm/rwanda-locations.svg)](https://www.npmjs.com/package/rwanda-locations)

---

## Installation

```bash
npm install rwanda-locations
```

---

## Usage

### CommonJS
```js
const { getProvinces, getDistricts, getSectors, getCells, getVillages } = require('rwanda-locations');
```

### ES Modules / TypeScript
```ts
import { getProvinces, getDistricts, getSectors, getCells, getVillages } from 'rwanda-locations';
```

---

## API Reference

### `getProvinces()`
Returns all provinces in Rwanda.

```ts
getProvinces();
// ["City Of Kigali", "Eastern Province", "Northern Province", "Southern Province", "Western Province"]
```

---

### `getDistricts(province)`
Returns all districts in a given province.

| Parameter  | Type     | Description          |
|------------|----------|----------------------|
| `province` | `string` | Name of the province |

```ts
getDistricts("City Of Kigali");
// ["Nyarugenge", "Gasabo", "Kicukiro"]
```

---

### `getSectors(province, district)`
Returns all sectors in a given district.

| Parameter  | Type     | Description          |
|------------|----------|----------------------|
| `province` | `string` | Name of the province |
| `district` | `string` | Name of the district |

```ts
getSectors("City Of Kigali", "Nyarugenge");
// ["Gitega", "Kanyinya", "Kigali", ...]
```

---

### `getCells(province, district, sector)`
Returns all cells in a given sector.

| Parameter  | Type     | Description          |
|------------|----------|----------------------|
| `province` | `string` | Name of the province |
| `district` | `string` | Name of the district |
| `sector`   | `string` | Name of the sector   |

```ts
getCells("City Of Kigali", "Nyarugenge", "Gitega");
// ["Akabahizi", "Akabeza", ...]
```

---

### `getVillages(province, district, sector, cell)`
Returns all villages in a given cell.

| Parameter  | Type     | Description          |
|------------|----------|----------------------|
| `province` | `string` | Name of the province |
| `district` | `string` | Name of the district |
| `sector`   | `string` | Name of the sector   |
| `cell`     | `string` | Name of the cell     |

```ts
getVillages("City Of Kigali", "Nyarugenge", "Gitega", "Akabahizi");
// ["Gihanga", "Iterambere", "Izuba", "Nyaburanga", ...]
```

---

## Notes

- All parameters are **case-insensitive** — `"kigali"` and `"Kigali"` both work.
- Functions **throw an error** if a name is not found, so handle it gracefully:

```ts
try {
  const districts = getDistricts("Unknown Province");
} catch (err) {
  console.error(err.message); // Province "Unknown Province" not found
}
```

---

## Full Example

```ts
import { getProvinces, getDistricts, getSectors, getCells, getVillages } from 'rwanda-locations';

const provinces = getProvinces();
// ["City Of Kigali", "Eastern Province", ...]

const districts = getDistricts("City Of Kigali");
// ["Nyarugenge", "Gasabo", "Kicukiro"]

const sectors = getSectors("City Of Kigali", "Nyarugenge");
// ["Gitega", ...]

const cells = getCells("City Of Kigali", "Nyarugenge", "Gitega");
// ["Akabahizi", ...]

const villages = getVillages("City Of Kigali", "Nyarugenge", "Gitega", "Akabahizi");
// ["Gihanga", "Iterambere", "Izuba", ...]
```

---

## Contributing

Contributions are welcome! If you find missing or incorrect data, or want to suggest new features, follow these steps:

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/anaclet922/rwanda-locations.git
   cd rwanda-locations
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b fix/missing-village-name
   ```
5. **Make your changes:**
   - Data fixes → edit `src/data/locations.json`
   - New functions → edit `src/index.ts` and add TypeScript types in `src/types.ts`
6. **Build** to verify nothing is broken:
   ```bash
   npm run build
   ```
7. **Commit and push:**
   ```bash
   git commit -m "fix: add missing villages in Gasabo district"
   git push origin fix/missing-village-name
   ```
8. Open a **Pull Request** on GitHub with a clear description of what you changed and why.

### Guidelines
- Keep data accurate and verifiable against official Rwanda administrative records.
- Keep new function signatures consistent with the existing pattern.
- If adding a new function, document it in the **API Reference** section of this README.

---

## Changelog

### v1.2.0
- Compressed locations.json from 1.95MB to 364KB (~81% size reduction)

### v1.1.0
- Improved TypeScript types

### v1.0.0
- Initial release with `getProvinces`, `getDistricts`, `getSectors`, `getCells`, `getVillages`

---

## License

MIT © [Anaclet Ahishakiye](https://github.com/anaclet922)

---

## Author

Built and maintained by **Anaclet Ahishakiye**.  
Found a bug or have a suggestion? [Open an issue](https://github.com/anaclet922/rwanda-locations/issues).
