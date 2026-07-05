# Authentication

## Entry point

`ordina.one` shows a single login form. No other content on the page.

The form collects email and password. On success, the user is redirected to `app.ordina.one`.

## Provider

Authentication is handled by Clerk.

System emails (magic links, password resets, invites) are sent via Proton SMTP from a company `@ordinacresce.com` address.

## Login flow

1. User opens `ordina.one`.
2. Enters email and password.
3. Clerk verifies credentials.
4. On success: redirect to `app.ordina.one/dashboard`.
5. On failure: error message on the same page.

## Roles and access

Roles are not a fixed hierarchy. Each user is granted access to specific tools. A user with access to Notion does not automatically have access to the CRM.

Access is configured per user by an admin in Clerk.

### Available tools

| Tool | Description |
|------|-------------|
| Notion | Internal wiki, SOPs, documentation |
| CRM | Twenty — contacts, clients, opportunities |

More tools may be added over time. Each new tool requires a corresponding access flag per user.

### Admin

Admin users can:

- Access all tools regardless of individual flags
- Manage users (invite, remove, update access) via Clerk dashboard

Admin access is not exposed in the app UI. User management happens directly in Clerk.

## Session

Sessions are managed by Clerk. No custom session logic.

Session expiry follows Clerk defaults. Users are redirected to `ordina.one` on session expiry.
