# Tests — desk QR scan (app)

API cases: [ExpressJS-choloBD-backend/.cursor/plans/desk-qr-scan/tests.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/desk-qr-scan/tests.md).

Use a hotel `SERVICE_ADMIN` and a bus `SERVICE_ADMIN`, each with one paid booking and one unpaid booking. An employee of the same property is the second phone. A traveler login is the negative case.

## Result

- Scan a paid hotel booking. The first lines are a valid verdict, the guest name, and the room. The confirmation code is present and is not the title. Status is words. The hotel’s own phone is not on the card.
- Scan an unpaid hotel booking. The verdict says unpaid. Checkout and no-show still behave as they do now.
- Scan a paid bus ticket. The first lines are a valid verdict, the passenger name, the seat, and the departure time. Every passenger on the ticket is named. There is no boarded button.
- Scan the same bus ticket again. The result says it was scanned earlier and shows that time.
- English and Bengali both render the new labels.

## History on the scanner page

- After a successful hotel scan, return to the camera. That scan is the first recent row: time, guest, room.
- Kill the app and open the hotel scanner again. The row is still there.
- Open the hotel scanner as a second employee of the same hotel. The same row is there.
- Open the bus scanner as that hotel admin. The hotel row is not there.
- A bus scan shows on the bus scanner recent list and not on the hotel scanner.
- Tap a recent row. The result opens from the log. The camera does not need the traveler’s code again.
- A traveler account has no scanner and no recent list.

## Failures

- An expired or wrong-property code stays on the camera with the API message. It does not add a recent row.
