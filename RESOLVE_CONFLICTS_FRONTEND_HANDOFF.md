# Frontend handoff: Resolve Conflicts + Vehicle Type Fallbacks

Backend branch: `idle-fuel-and-fuel-settings` (Driver_Management_Backend). All endpoints use the standard
`Response<T>` envelope (`{ statusCode, message, errors, data }`, camelCase) and need the usual auth (`authFetch`).

## What it does
After assignment, some trips are conflicts ("No vehicles available" / "No qualified drivers available").
**Resolve Conflicts** retries only those trips on their configured **fallback vehicle types**, in priority order
(e.g. SUV → Standard Sedan → Hyundai Sonata → Hyundai Tucson; Minivan → Minibus → Luxury Minibus;
Luxury Minibus → Minibus). When a fallback works, the trip's vehicle type is changed to it and it gets a
driver + vehicle. Assignments that were already fine are **not touched**. Field Trip conflicts are skipped
(they need the imported driver/plate fixed by hand). Running it again is safe.

---

## 1. "Resolve Conflicts" button — `src/components/reports/ReportsPage.tsx`

**Where:** next to the existing "Run Assignment" action for each period.
**Show/enable when:** assignments have been run for the period and the period is not finalized
(reuse `isPeriodFinalized(period)`). Best shown when the period has conflicts (`HasConflicts` status).

**Call:**
```
POST {API_BASE_URL}/reports/resolve-conflicts/{periodId}
```
No body. Follow the `handleRunAssignment` pattern: `setProcessingId(periodId)`,
`setProcessingAction("resolve")`, spinner on the button, then `fetchPeriods()` on success.

**Success (200):**
```json
{
  "statusCode": 200,
  "message": "Resolved 7 of 10 conflicts (2 remaining, 1 skipped).",
  "data": {
    "totalConflicts": 10,
    "resolved": 7,
    "remaining": 2,
    "skipped": 1,
    "items": [
      {
        "tripId": 812,
        "confNumber": "A-10293",
        "pickUpDate": "2026-10-03T00:00:00Z",
        "originalVehicleType": "SUV",
        "newVehicleType": "Hyundai Sonata",
        "driverName": "Ivan Petrov",
        "vehiclePlate": "01A123BC",
        "status": "Resolved",
        "reason": null
      },
      {
        "tripId": 820,
        "confNumber": "A-10301",
        "pickUpDate": "2026-10-04T00:00:00Z",
        "originalVehicleType": "Minivan",
        "newVehicleType": null,
        "driverName": null,
        "vehiclePlate": null,
        "status": "Unresolved",
        "reason": "No vehicle or qualified driver available in fallback types (Minibus, Luxury Minibus)"
      },
      {
        "tripId": 833,
        "status": "Skipped",
        "originalVehicleType": "Sedan",
        "reason": "Field trip - fix the imported driver/vehicle manually"
      }
    ]
  }
}
```
`status` is one of `"Resolved" | "Unresolved" | "Skipped"`. Other possible `reason`:
`"No fallback vehicle types configured for <type>"`.

**Show the result** in a modal (not just `alert`): the summary line (`message`) plus a table of `items` —
Conf #, Date, Original type → New type, Driver, Vehicle, Status badge (green/red/grey), Reason.
Ideally include a link/hint to the vehicle-type settings when the reason is "No fallback vehicle types configured".

**Errors** (read `result.message`):
| Status | message |
|---|---|
| 404 | `Period not found.` |
| 400 | `Cannot resolve conflicts on a finalized period. Revert finalization first.` |
| 400 | `No assignments found for this period. Run assignment first.` |
| 500 | details in `errors[]` |

```ts
type ResolveConflictsItem = {
  tripId: number;
  confNumber?: string | null;
  pickUpDate: string;
  originalVehicleType: string;
  newVehicleType?: string | null;
  driverName?: string | null;
  vehiclePlate?: string | null;
  status: 'Resolved' | 'Unresolved' | 'Skipped';
  reason?: string | null;
};
type ResolveConflictsResult = {
  totalConflicts: number;
  resolved: number;
  remaining: number;
  skipped: number;
  items: ResolveConflictsItem[];
};
```

---

## 2. Fallback editor in vehicle type settings — `src/services/vehicleTypeService.ts` + vehicle types page

Each vehicle type has an **ordered** list of fallback types. Add to the vehicle type edit screen
(or a "Fallbacks" button per row) a sortable list: pick types from the existing vehicle types list,
reorder (up/down or drag), remove, Save.

**Read:**
```
GET {API_BASE_URL}/vehicle-types/{id}/fallbacks          (permission: VehicleTypes.View)
```
```json
{ "statusCode": 200, "data": [
  { "vehicleTypeId": 1, "name": "Standard Sedan", "priority": 1 },
  { "vehicleTypeId": 3, "name": "Hyundai Sonata", "priority": 2 }
] }
```

**Replace (whole list, order = priority):**
```
PUT {API_BASE_URL}/vehicle-types/{id}/fallbacks          (permission: VehicleTypes.Manage)
Content-Type: application/json

{ "fallbackVehicleTypeIds": [1, 3, 4] }
```
Returns the saved list (same shape as GET). Send `[]` to clear.
400 errors (`errors[]`): self-reference, duplicates, unknown ids. 404 if the vehicle type doesn't exist.
Don't offer the type itself in its own picker.

---

## Notes
- After resolving, trips' `vehicleTypeName` in `GET /api/trips?periodId=` reflects the new type; the original
  is still in `importedVehicleType`. Resolved assignment `notes` read `Resolved: vehicle type SUV → Hyundai Sonata`.
- The export (`/reports/export/{periodId}`) and journeys reflect resolved trips; no changes needed there.
