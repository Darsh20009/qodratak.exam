# Notification route SAST notes

The active notification routes validate every request-derived value before it can
be used in a MongoDB filter:

- MongoDB document identifiers must be 24-character hexadecimal scalar strings.
- Session and target user identifiers use the same scalar allowlist.
- Push endpoints must be bounded non-empty strings.
- Push subscription objects are rebuilt from the allowlisted `endpoint`,
  `keys.p256dh`, and `keys.auth` fields instead of storing the client object.
- Notification types and broadcast targets use fixed allowlists, and boolean
  fields must be actual booleans.
- The client-used `/api/push/subscribe` and `/api/push/unsubscribe` routes require
  an authenticated session and scope endpoint filters to that validated user.

## Remaining false positives

The SAST rule `javascript.express.mongodb.express-mongo-nosqli` is
path-insensitive and still reports these safe operations in the active
`src/notificationRoutes.ts` file:

- Saving a push subscription: `parsePushSubscription` rebuilds the client value
  from three bounded scalar strings before the endpoint filter and update.
- Removing a push subscription: the endpoint filter receives the result of
  `parseBoundedText`, and the user identifier comes from the validated session.
- Marking one notification as read: the `_id` filter receives the result of
  `parseObjectIdString`, and the user identifier comes from the validated server
  session.
- Deleting one user's notification: both filter identifiers are validated
  scalar strings.
- Sending a push notification: the endpoint and keys are read from a stored
  `PushSubscription` document; they are not used as a MongoDB query.
- Removing an expired push subscription: the endpoint is read from the stored
  subscription returned by MongoDB, not from the current request.
- Admin deletion of a notification: the identifier receives the result of
  `parseObjectIdString` before `findByIdAndDelete`.

The scan also reports the old `.migration-backup/server/notificationRoutes.ts`.
That directory is not imported by the API artifact and is intentionally excluded
from the runtime remediation scope. The corresponding active implementation is
`artifacts/api-server/src/notificationRoutes.ts`.