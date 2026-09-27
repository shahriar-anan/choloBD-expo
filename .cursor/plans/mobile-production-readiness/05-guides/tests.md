# Tests — increment 05 (guides)

## Agent checks

```bash
npx tsc --noEmit
```

## Device cases

Guide operator may accept via web/API for pay-after-accept flows.

### D-05 Request a guide

- Expected: `POST /api/bookings/guides` → `PENDING`. No pay button. Contact hidden.

### D-05b Pay after accept, then cancel

- Pay uses `GUIDE_SERVICE` when `ACCEPTED`.
- Paid cancel >24h before start: refund per eligibility.
- Unpaid `PENDING` cancel: no refund.
- Cancel via `PATCH .../status` with `action: "cancel"`.
