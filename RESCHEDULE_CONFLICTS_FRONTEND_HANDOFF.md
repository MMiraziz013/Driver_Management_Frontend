# Frontend handoff: Reschedule Conflicts

Backend branch: `idle-fuel-and-fuel-settings` (Driver_Management_Backend). Builds on Resolve Conflicts,
which is already in `src/components/reports/ReportsPage.tsx` — reuse that code.

## What it does
Some days have more trips than free drivers, so conflicts stay even after Resolve Conflicts.
**Reschedule Conflicts** moves each conflicting trip to the **closest day in the period**
(order: −1, +1, −2, +2, … out to the farthest day of the period), where a driver and vehicle are free. On each day it tries the trip's own
vehicle type first, then its fallback types. Garage-out/in times stay the same; only the date changes.
**Field Trips never move**, and trips that were already assigned are never touched. Running it again is safe.

Typical use: Run Assignment → Resolve → Reschedule (for what's left).

## 1. "Reschedule" button — `ReportsPage.tsx`
- Separate button next to the existing **Resolve** button, same visibility/disabled rules
  (not finalized; follow `handleResolveConflicts`, `processingAction = "reschedule"`).
- Call:
  ```
  POST {API_BASE_URL}/reports/reschedule-conflicts/{periodId}
  ```
  No body. On success show the result modal and `fetchPeriods()`.

## 2. Response — same shape as Resolve Conflicts, one extra field
Reuse `ResolveConflictsResult` / `ResolveConflictsItem` and the existing result modal. Add to the item type:
```ts
newPickUpDate?: string | null;   // set only for rescheduled trips
```
```json
{
  "statusCode": 200,
  "message": "Rescheduled 4 of 6 conflicts (1 remaining, 1 skipped). Re-run fuel allocation if it was already calculated for this period.",
  "data": {
    "totalConflicts": 6, "resolved": 4, "remaining": 1, "skipped": 1,
    "items": [
      {
        "tripId": 812, "confNumber": "A-10293",
        "pickUpDate": "2026-10-03T00:00:00Z",
        "newPickUpDate": "2026-10-04T00:00:00Z",
        "originalVehicleType": "SUV",
        "newVehicleType": null,
        "driverName": "Ivan Petrov", "vehiclePlate": "01A123BC",
        "status": "Resolved", "reason": null
      },
      {
        "tripId": 820, "pickUpDate": "2026-10-05T00:00:00Z", "originalVehicleType": "Minivan",
        "status": "Unresolved", "reason": "No driver/vehicle available on any day of the period"
      },
      {
        "tripId": 833, "pickUpDate": "2026-10-06T00:00:00Z", "originalVehicleType": "Sedan",
        "status": "Skipped", "reason": "Field trips keep their date"
      }
    ]
  }
}
```
- In the modal, when `newPickUpDate` is set show a **Date** column as `03.10 → 04.10`. `newVehicleType` is
  only set when the type also changed (show `SUV → Sedan` as today; otherwise just the original type).
- Title the modal "Reschedule Conflicts" (pass the title in, or keep a separate state like `resolveResult`).
- The `message` may contain a reminder to re-run fuel allocation — show it as-is.

Errors (read `result.message`, or `result.errors` for 500): 404 `Period not found.`;
400 `Cannot change assignments on a finalized period. Revert finalization first.`;
400 `No assignments found for this period. Run assignment first.`

## 3. Trips table — `src/components/trips/TripsPage.tsx`
`GET /api/trips?periodId=` now returns `originalPickUpDate` (null if the trip was never moved).
When it's set, show a small "moved from 03.10" hint/badge under the date (line ~282). Add
`originalPickUpDate?: string | null` to the trip type.

## Notes
- Moved trips' assignment `notes`: `Rescheduled: 03.10 → 04.10` (plus `; vehicle type SUV → Sedan` if changed).
- Export, waybill and journeys use the new date automatically; no changes needed there.
