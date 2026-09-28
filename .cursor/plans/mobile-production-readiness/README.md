# Mobile production readiness (increment folders)

**Overall context, gaps, and progress:** [../MOBILE_PRODUCTION_READINESS.md](../MOBILE_PRODUCTION_READINESS.md)

**Shared rules:** [_shared/global-rules.md](_shared/global-rules.md)

Each increment is a folder with three files:

| Folder | `plan.md` | `rules.md` | `tests.md` |
| --- | --- | --- | --- |
| [01-trip-plan-api](01-trip-plan-api/) | Trip plan wizard and day segments | Web builder parity, stop rules | D-01 through D-01h |
| [01b-hotel-booking-flow](01b-hotel-booking-flow/) | Hotel search S1–S13 (done 2026-09-28) | Our theme and existing hotel APIs; no cancel/refund | D-01b* |
| [02-cancel-refund](02-cancel-refund/) | Hotel + package cancel (done 2026-09-28) | Eligibility + endpoints; list/detail chrome | D-02-ui*, D-02* passed |
| [03-package-payment](03-package-payment/) | Payment types only; no catalog buy | `ServiceType` + `bookingId` | D-03, D-03b |
| [03b-dashboard](03b-dashboard/) | Traveler dashboard home (done 2026-09-28) | Profile, wallet card, notification inbox, rows, recent booking | D-03c* passed |
| [04-activity-booking](04-activity-booking/) | Activity vertical | Book + pay + QR | D-04* |
| [05-guides](05-guides/) | Guide vertical | Request → accept → pay | D-05* |
| [06-transport](06-transport/) | Bus + rental | No flight/train | D-06* |
| [07-trip-checkout](07-trip-checkout/) | Personal plan checkout | `TRIP_PACKAGE` | D-07* |
| [08-wallet-search-inbox](08-wallet-search-inbox/) | Cross-cutting features | Search, wallet, etc. | D-08* |
| [09-home-hero](09-home-hero/) | Homepage photo and booking launcher | Overlap tiles on a landscape photo; no dead slots | D-09* |

Work one increment at a time: **Functional** → agent checks in `tests.md` → **UI** → device cases in `tests.md`.
