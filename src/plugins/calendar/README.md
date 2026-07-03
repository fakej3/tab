# Calendar Plugin

View-only month grid, today highlighted. No account/event sync — that's a
deliberate MVP boundary, not an oversight.

## Roadmap hooks

Event sources (Google Calendar, ICS subscriptions) can be layered in by
having `controller.ts` fetch events into a `Map<dateKey, Event[]>` and having
`view.ts` render a dot/count per day — the grid layout already has room in
`.ws-calendar__day` for that.
