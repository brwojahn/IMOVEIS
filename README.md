# CasaNova — Property Management API

An internal real estate management system for property listings, renters, rental contracts, and follow-up tasks. The frontend uses plain HTML, CSS, and JavaScript, with a red-and-white dashboard theme.

## Project folders

- `frontend/` — HTML, CSS, and browser JavaScript.
- `backend/` — Express server, routes, async controllers, MySQL pool, and backend middleware.
- `middleware/` — request validation shared by the backend routes.
- `database/` — the authoritative MySQL schema and fictional demonstration records.

## Database setup

Run these scripts in order in MySQL:

1. `database/01_estrutura.sql` creates the `imobiliaria` database and its tables.
2. `database/02_inserts.sql` inserts fictional properties, renters, rental contracts, and tasks. If you already created the database from an older schema, run `database/03_preco_venda_opcional.sql` once to align the property table with the simplified form, including optional sale price and postal code.

Set the MySQL connection values in `backend/.env`. The database name should be `imobiliaria`, matching the SQL scripts. Copy `backend/.env.example` to `backend/.env` if you need to recreate the local configuration.

## Start the API

From the `backend/` directory:

```powershell
npm install
npm start
```

The server checks the MySQL connection before listening. Open <http://localhost:3000> for the frontend and <http://localhost:3000/api/health> to check the API.

## Property filters

`GET /api/properties` lists all property records with current renter details and outstanding task counts. It supports free-text search with `q`, a `property_type` filter, and an optional `filter` category:

| Filter | Query | Meaning |
| --- | --- | --- |
| For Sale | `?filter=for-sale` | Active properties where `is_for_sale` is true |
| Renting | `?filter=renting` | Properties with a current active rental contract |
| Sold | `?filter=sold` | Properties with status `Sold` |
| Inactive | `?filter=inactive` | Properties with status `Inactive` |

For example, `GET /api/properties?q=Campinas&filter=renting` searches current rentals in Campinas. For Sale and Renting filters can include the same property. A rental listing’s current occupancy comes from its contract rather than a mutually exclusive property status.

The dashboard has a CRUD operation selector. **GET · Buscar** searches and loads cards, **GET by ID** loads one property, **POST** creates a property using the basic details form, and **DELETE** removes a property when its foreign-key history permits it. Clicking a card opens a detail modal; use **Editar imóvel** there to update it with PUT.

## API routes

All responses use JSON. POST and PUT requests use JSON request bodies. IDs in path parameters must be positive integers.

| Resource | Create | Read list / by ID | Update | Delete |
| --- | --- | --- | --- | --- |
| Properties | `POST /api/properties` | `GET /api/properties`, `GET /api/properties/:id` | `PUT /api/properties/:id` | `DELETE /api/properties/:id` |
| Renters | `POST /api/renters` | `GET /api/renters`, `GET /api/renters/:id` | `PUT /api/renters/:id` | `DELETE /api/renters/:id` |
| Rental contracts | `POST /api/rental-contracts` | `GET /api/rental-contracts`, `GET /api/rental-contracts/:id` | `PUT /api/rental-contracts/:id` | `DELETE /api/rental-contracts/:id` |
| Property tasks | `POST /api/tasks` | `GET /api/tasks`, `GET /api/tasks/:id` | `PUT /api/tasks/:id` | `DELETE /api/tasks/:id` |

Rental contract lists accept `property_id` and `renter_id` query filters. Task lists accept `property_id` and `status` filters.

## Main table fields

- `properties`: title, address, city, state, postal code, property type, sale listing flag and price, bedrooms, bathrooms, area, lifecycle status, and description.
- `renters`: name and contact information.
- `rental_contracts`: property and renter foreign keys, start and end dates, monthly rent, contract status, and notes. The controller returns the calculated occupancy status and remaining months/days.
- `property_tasks`: property foreign key, task title and description, priority, due date, and task status.

The foreign keys protect renter and contract history. Deleting a property with rental contracts or a renter with contract history returns HTTP 409. Property tasks are removed automatically with their property.

## Request body examples

Create or update a property:

```json
{
  "title": "Casa Jardim",
  "address": "Rua das Acacias, 128",
  "city": "Campinas",
  "state": "SP",
  "postal_code": "13025-110",
  "property_type": "House",
  "is_for_sale": true,
  "sale_price": 780000,
  "bedrooms": 3,
  "bathrooms": 2,
  "area_sqm": 168,
  "status": "Active",
  "description": "Casa com jardim e duas vagas."
}
```

Create a rental contract:

```json
{
  "property_id": 1,
  "renter_id": 1,
  "start_date": "2026-01-01",
  "end_date": "2027-01-01",
  "monthly_rent": 3900,
  "status": "Active",
  "notes": "Anunciado para venda durante a locacao."
}
```

Create a property task:

```json
{
  "property_id": 1,
  "title": "Revisar torneira da cozinha",
  "description": "Renter informou um pequeno vazamento.",
  "priority": "Medium",
  "due_date": "2026-11-01",
  "status": "Open"
}
```

## Presentation data flow

1. A frontend action sends a request to an API route.
2. `backend/server.js` routes the request to the matching router.
3. Request middleware validates POST and PUT bodies.
4. An async controller uses `pool.query` from `backend/database/conexao.js` to read or change MySQL records.
5. The controller returns JSON and an HTTP status to the frontend.
