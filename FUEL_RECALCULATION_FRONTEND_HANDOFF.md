# Frontend handoff: Targeted fuel recalculation

Backend branch: `idle-fuel-and-fuel-settings` (Driver_Management_Backend). Same `Response<T>` envelope
(`{ statusCode, message, errors, data }`, camelCase) and `authFetch` as everywhere else.

## What it does
After fuel allocation (`POST /gas/allocate/{periodId}`, run from `src/components/reports/ReportsPage.tsx`),
operators sometimes change a few vehicles' consumption or tank size. Tank levels are always recomputed from
the current settings, so a changed vehicle can now **overflow** its tank on a fill day (consumption lowered)
or go into **deficit** (consumption raised).

**Recalculate fuel** redoes the automatic allocations of only those vehicles, with their current settings:
- Other vehicles' allocations are **never touched**.
- A recalculated vehicle only gets liters a purchase still has free (its own released fuel plus anything that
  was already unallocated). Fuel that no longer fits **stays unallocated** and is reported.
- Manual allocations of a recalculated vehicle are kept.
- Vehicles: the ones the user picks, or — if none are picked — every vehicle whose daily tank level goes over
  capacity or below zero.

## 1. UI — next to "Run Fuel Allocation" in `ReportsPage.tsx`
A **"Recalculate fuel"** action per period that opens a modal:
1. Optional vehicle multi-select (fuel vehicles). Hint: "Leave empty to fix every vehicle that no longer fits".
2. **Preview** button → GET preview, show the result table (below). With no vehicles picked, the preview is
   also the answer to "which vehicles broke after my edits?" — open the modal with an automatic preview.
3. **Apply** button → POST with the same selection, show the result, refresh fuel data.
Disable when the period's fuel is finalized.

## 2. Endpoints (permission: Gas.Manage)
**Preview (dry run, nothing saved):**
```
GET {API_BASE_URL}/gas/allocate/{periodId}/recalculate/preview?vehicleIds=3&vehicleIds=7
GET {API_BASE_URL}/gas/allocate/{periodId}/recalculate/preview            (auto: out-of-bounds vehicles)
```
**Apply:**
```
POST {API_BASE_URL}/gas/allocate/{periodId}/recalculate
Content-Type: application/json

{ "vehicleIds": [3, 7] }          // [] or no body = auto
```

**Response (both):**
```json
{
  "statusCode": 200,
  "message": "Recalculated 1 vehicle(s): 120.00L released, 95.50L reallocated, 24.50L left unallocated.",
  "data": {
    "reportPeriodId": 12,
    "saved": true,
    "litersReleased": 120.0,
    "litersReallocated": 95.5,
    "litersLeftUnallocated": 24.5,
    "warnings": ["24.50L of 2026-10-05 АИ-92 purchase (24.50L) not allocated: all compatible tanks full"],
    "vehicles": [
      {
        "vehicleId": 3,
        "plateNumber": "01A123BC",
        "selectedBecause": "Overflow",
        "litersBefore": 120.0,
        "litersAfter": 95.5,
        "costBefore": 1440000,
        "costAfter": 1146000,
        "endingLevelBefore": 52.3,
        "endingLevelAfter": 27.8,
        "violationsBefore": [{ "date": "2026-10-05T00:00:00Z", "kind": "Overflow", "level": 58.1 }],
        "violationsAfter": []
      }
    ]
  }
}
```
- `selectedBecause`: `"Picked" | "Overflow" | "Deficit"`. Violation `kind`: `"Overflow" | "Deficit"`; `level` is the tank level that day.
- `litersLeftUnallocated` is the period total of purchased liters no vehicle holds after the run.
- Nothing to do → 200 with `message: "No vehicles need recalculation."` and empty `vehicles` — show that as a success state.

**Table per vehicle:** Plate, Why (badge), Liters before → after, Cost before → after, Ending level before → after,
Problems before (dates) → after (green check if empty). Show `warnings` under the table.

**Errors** (`result.message`, or `result.errors` for 400 on bad ids / 500):
| Status | message |
|---|---|
| 404 | `Period not found` |
| 400 | `Fuel is finalized for this period. Revert fuel finalization first.` |
| 400 | `No fuel allocations found for this period. Run fuel allocation first.` |
| 400 | `errors[0]`: `Vehicle(s) not part of fuel allocation in this period: 5, 9` |

## Notes
- Recalculated allocations have notes starting with `Recalculated:`; existing fuel status, balance and
  export endpoints show the new numbers with no changes needed.
- The full "Run Fuel Allocation" is unchanged and still reshuffles everything.
