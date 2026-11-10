# Frontend handoff: per-trip "Recalculate fuel" button (Trips page)

Backend branch: `idle-fuel-and-fuel-settings` (Driver_Management_Backend). Builds on the targeted fuel
recalculation described in `FUEL_RECALCULATION_FRONTEND_HANDOFF.md` — read that first; the endpoints and
response are the same.

## What it does
Each trip row in `src/components/trips/TripsPage.tsx` gets a **Recalculate fuel** button. It recalculates
fuel for the **vehicle assigned to that trip**, using its current settings: that vehicle's automatic fuel
allocations for the whole period are redone; no other vehicle is touched.

Make this clear in the UI (tooltip / confirm text): *"Recalculates fuel for vehicle 01A123BC for the whole
period, not just this trip."*

Typical use: fix a trip's distance (existing calculator button) or a vehicle's consumption, then press
Recalculate fuel on one of its trips.

## 1. New fields on trips (backend change, already done)
`GET /api/trips?periodId=` and `GET /api/trips/{id}` now also return the trip's successful assignment:
```ts
assignedVehicleId?: number | null;
assignedVehiclePlate?: string | null;
assignedDriverId?: number | null;
assignedDriverName?: string | null;
```
All null when the trip has no assignment or is a conflict (also cash and Samarkand trips, which are never
assigned). Add them to the trip type in `src/services/tripService.ts`.

Optional but useful: the Driver / Vehicle columns currently show `importedDriverName` / `importedVehiclePlate`.
Consider showing the assigned values (with the imported ones as a tooltip), since that's the vehicle the fuel
button acts on.

## 2. Button
In the Actions cell, next to the existing "Recalculate distance" button (`Calculator` icon). Suggested icon:
`Fuel` from lucide-react.
- **Disabled** when `assignedVehicleId == null`, with tooltip "No vehicle assigned to this trip".
- Track a separate loading id (e.g. `recalculatingFuelId`) like `recalculatingId`, so the two buttons spin independently.

## 3. Flow — preview, then apply
1. Click → preview (nothing saved):
   ```
   GET {API_BASE_URL}/gas/allocate/{trip.reportPeriodId}/recalculate/preview?vehicleIds={trip.assignedVehicleId}
   ```
2. Show a small confirm modal with the one row in `data.vehicles`: plate, liters before → after, cost before →
   after, ending level before → after, problem days before → after (`violationsBefore` / `violationsAfter`),
   plus `data.warnings` and `message`.
3. **Apply** →
   ```
   POST {API_BASE_URL}/gas/allocate/{trip.reportPeriodId}/recalculate
   Content-Type: application/json

   { "vehicleIds": [trip.assignedVehicleId] }
   ```
   Then show `message` (e.g. toast). Trip rows don't change — no refetch of trips needed.

Add two functions to `src/services/` (fuel/gas service, same style as `recalculateTripDistance`):
`previewVehicleFuelRecalculation(periodId, vehicleId, token)` and `recalculateVehicleFuel(periodId, vehicleId, token)`,
both returning `data` (`FuelRecalculationResult`, type in the other handoff).

## 4. Errors (show `message`, or `errors[0]` when present)
| Status | When |
|---|---|
| 404 | `Period not found` |
| 400 | `Fuel is finalized for this period. Revert fuel finalization first.` |
| 400 | `No fuel allocations found for this period. Run fuel allocation first.` |
| 400 | `errors[0]`: `Vehicle(s) not part of fuel allocation in this period: 7` (e.g. electric or inactive vehicle) |

The trips page doesn't know if fuel is finalized; just show these errors as returned.
