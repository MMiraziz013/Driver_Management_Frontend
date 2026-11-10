# Frontend handoff: idle fuel and fuel settings

The backend now calculates trip fuel as driving fuel plus idle fuel, and the
distance-fallback speed (previously a hard-coded 15 km/h) is an editable setting.
This document lists what the web interface needs so users can configure and see it.

Backend state: built and unit-tested, not yet committed or deployed. Two database
migrations (`AddFuelSettings`, `AddIdleFuelConsumption`) apply automatically on
backend startup. All new fields are additive, so the current frontend keeps working
against the new backend.

## Background: how fuel is calculated now

```
trip fuel  = distanceKm × fuelConsumptionPer100Km / 100
           + idleHours × idleFuelConsumptionPerHour
idleHours  = (garage-in − garage-out) − routed driving time, never below 0
```

- `idleFuelConsumptionPerHour` is a per-vehicle rate in litres per hour. It defaults
  to 0, which means "no idle fuel" — nothing changes for a vehicle until it is set.
- The routed driving time comes from Mapbox when the trip distance is calculated.
  A trip has no idle hours (`idleHours = 0`, `drivingDurationHours = null`) when:
  - it was uploaded before this change and has not been recalculated,
  - its distance was estimated from duration (Mapbox returned nothing, or a Custom
    Itinerary where the duration estimate is larger),
  - its distance was edited by hand.

## Work items

### 1. Trips tab: show idle hours (required)

`GET /trips?...` and `GET /trips/{id}` now return two extra fields per trip.

| Field | Type | Meaning |
|---|---|---|
| `drivingDurationHours` | `number \| null` | Routed driving time in hours; `null` when the distance is not a routed one |
| `idleHours` | `number` | Idle hours, rounded to 2 decimals; `0` when `drivingDurationHours` is `null` |

Changes:

- `src/services/tripService.ts`: add both fields to `TripDto`.
- `src/components/trips/TripsPage.tsx`: add an "Idle" column next to "Distance"
  (table header is around line 251, the distance cell around line 293). Suggested
  rendering: `2.5 h` when `drivingDurationHours !== null`, and `—` when it is `null`,
  so "no data" is distinguishable from "zero idle time".
- Keep the row fresh after edits. Idle hours change when:
  - **Distance is recalculated.** `POST /trips/{id}/recalculate-distance` still returns
    only the new distance, and `handleRecalculateDistance` patches just `distanceKm`
    in local state. After a successful recalculation, re-fetch that trip
    (`GET /trips/{id}`) or the list, so `idleHours` updates too.
  - **Garage times or distance are edited** in `EditTripModal`. Re-fetch after save
    if the page does not already.
- `EditTripModal` always sends `distanceKm` on save. That is fine: the backend only
  clears the driving time when the value actually differs from the stored one. Do
  not round or reformat the distance before sending, or an untouched trip will look
  "manually edited" and lose its idle hours.

### 2. Cars: idle rate field (required)

`idleFuelConsumptionPerHour` (litres per hour) is now part of the vehicle.

| Endpoint | Field | Notes |
|---|---|---|
| `GET /vehicles` | `idleFuelConsumptionPerHour: number` | Always present, `0` when unset |
| `POST /vehicles` | `idleFuelConsumptionPerHour: number` | Not nullable — send `0` when the input is empty |
| `PUT /vehicles` | `idleFuelConsumptionPerHour: number \| null` | `null` or omitted keeps the current value; `0` is accepted and disables idle fuel; negative values are ignored |

Changes:

- `src/components/cars/AddCarModal.tsx` and `EditCarModal.tsx`: add an
  "Idle consumption (L/h)" number input next to "Consumption (L/100km)"
  (`step="0.1"`, `min="0"`, placeholder e.g. `1.2`). Add the field to the local
  `Vehicle` interface and to the request body.
- Mind the existing `value ? parseFloat(value) : null` pattern in `EditCarModal`:
  an empty input sends `null`, which keeps the old rate. That is the intended
  "leave unchanged" behaviour; to clear the rate the user types `0`.
- `src/components/cars/CarsPage.tsx`: add the field to the `Car` interface and show
  it in the "Consumption" block of the expanded card (around line 362), e.g.
  "Idle: 1.2 L/h", or "N/A" when 0.

Typical values to use as hints: about 0.8–1.5 L/h for a sedan, 2–3 L/h for a minibus.

### 3. Fuel settings: fallback speed (required)

New endpoints, same response envelope as the other settings endpoints
(`{ statusCode, data, errors, ... }`).

```
GET /fuel-settings
→ data: { id: number, durationFallbackSpeedKmh: number, updatedAt: string }

PUT /fuel-settings
body: { durationFallbackSpeedKmh: number }
→ data: same shape as GET
```

- `durationFallbackSpeedKmh` is the assumed average speed used to estimate a trip's
  distance from its duration when routing gives nothing (and as a minimum for Custom
  Itinerary trips). Default 15.
- Validation: must be greater than 0 and at most 150. Otherwise the API returns 400
  with a message in `errors`.
- Permissions: `GET` requires `Permissions.Gas.View`, `PUT` requires
  `Permissions.Gas.Manage`. Hide or disable the edit control for users without
  the manage permission, and handle 403.
- A change applies only to distances calculated afterwards. Existing trips keep
  their stored distance until recalculated or re-uploaded — worth a one-line hint
  under the input.

Where to put it: `SettingsPage.tsx` currently contains only placeholder cards, and
`BonusSettingsPage.tsx` is the one real settings screen. Either add a "Fuel" card to
`BonusSettingsPage` or create a small `FuelSettingsPage` with its own sidebar entry
(`Sidebar.tsx` `Page` union plus the switch in `src/app/page.tsx`). A
`src/services/fuelService.ts` modelled on `bonusService.ts` fits the existing pattern.

### 4. Fuel status views (optional)

The per-vehicle fuel status DTO (used by the fuel allocation/status responses) has
two new fields:

| Field | Type | Meaning |
|---|---|---|
| `idleConsumptionPerHour` | `number` | The vehicle's idle rate |
| `totalIdleHours` | `number` | Sum of idle hours over the vehicle's trips in the period |

`fuelConsumed` in those responses already includes idle fuel. If
`FuelAllocationModal.tsx` should show the idle figures, add them to its local
vehicle interface and table; otherwise no change is needed.

Note while there: `FuelAllocationModal.tsx` calls `/fuel/status`, `/fuel/allocate`
and `/fuel/export`, while `ReportsPage.tsx` uses `/gas/...`. The backend controller
is routed at `api/gas`. This was not changed by this work, but check that the
`/fuel/...` calls actually resolve.

## No frontend work needed

- **Export files.** The fuel Excel export (`/gas/export/{periodId}`) and the detailed
  CSV export (`/gas/export-detailed/{periodId}`) now include "Idle Rate (L/h)" and
  "Idle Hours" columns. They are generated server-side; download handling is unchanged.
- **Waybill export.** Unchanged layout. Its fuel-consumed figures now include idle
  fuel, shown only as the final total.
- **Gas fuel-config endpoints.** `UpdateVehicleFuelConfigRequest` accepts an optional
  `idleFuelConsumptionPerHour`; omitting it keeps the current value.

## Suggested test pass

1. Set an idle rate on one car, reload the cars page, confirm it persists; set it to
   `0` and confirm it clears.
2. Open the trips tab for a period uploaded after the backend deploy: routed trips
   show idle hours, trips with estimated or manual distance show `—`.
3. Recalculate a trip's distance and confirm the idle column updates without a
   manual page reload.
4. Change the fallback speed, then try `0` and `200` and confirm the validation
   error is shown.
5. Log in as a user without the gas-manage permission and confirm the setting is
   read-only.
