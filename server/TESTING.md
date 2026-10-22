# Manual test checklist

1. Start MongoDB, run `npm run seed` from `server`, then start server and client.
2. Sign in as customer. Join Document Verification.
3. Open a private/incognito window and sign in as staff.
4. On staff dashboard, select Document Verification and click Call next token.
5. Return to customer dashboard. The token should update live to "Your turn".
6. In staff dashboard, mark the token served.
7. Sign in as admin and verify the daily totals update after refreshing.
8. Register a second customer and confirm they receive the next token number.
9. Try joining the same service twice with the same customer; the API should reject the duplicate active token.
10. Pause a service as staff, then confirm customers cannot join until it is resumed.

## Helpful API smoke test
`GET http://localhost:5000/api/health` should return:
```json
{"status":"ok","app":"QueueLess API"}
```
