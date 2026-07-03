# Infrastructure

![Ordina Cresce](./oc_logo.svg)

## Overview

Ordina Cresce runs on a zero-cost (where possible) internal stack. The goal is a centralized internal portal where staff log in once and access all tools from one place.

## Tools

| Layer | Tool | Cost |
|-------|------|------|
| Email, calendar, drive, passwords | Proton Business (Mail Essentials) | ~$6.99/user/month |
| CRM | Twenty (self-hosted, open-source) | $0 |
| Internal portal | Next.js hosted on Vercel | $0 |
| Authentication | Clerk | $0 (up to 10,000 users) |
| Database | Supabase or Railway PostgreSQL | $0 |

## Internal Portal

The portal is a Next.js web app hosted on Vercel. Staff log in once via Clerk (email + password sent to Proton inbox). After login, the portal shows links and tools based on the user's role.

### Access by role

| Role | Access |
|------|--------|
| Admin | Everything |
| Staff | CRM, internal SOPs, operations tools |

### Authentication flow

1. Staff opens the portal URL.
2. Logs in with company email and password (Proton inbox receives any magic links or verification emails).
3. Clerk confirms identity and returns a session.
4. Portal shows the dashboard for that user's role.

## CRM — Twenty

Twenty is an open-source CRM. We self-host it at no cost. It manages contacts, clients, and opportunities.

Twenty supports SAML 2.0 SSO and OAuth 2.0. Future integration with the portal can use Twenty's OAuth server so staff do not need a separate CRM login.

Self-hosting options: Railway, Render, or any VPS with Docker.

## Email — Proton Business

All company email runs on `@ordinacresce.com` via Proton Mail.

Proton SMTP is configured in Clerk so that system emails (invites, password resets) send from a company address, not a third-party domain.

Proton also provides:

- Proton Calendar — team scheduling
- Proton Drive — file storage and document sharing
- Proton Pass — shared password manager
- Proton VPN — secure remote access
- Proton Meet — video calls

## Architecture Diagram

```
Staff → [Clerk login] → [Internal portal / Vercel]
                              ↓               ↓
                         [Twenty CRM]    [Other tools]
                        (self-hosted)    (Proton, etc.)
```

## Status

Pre-launch. Stack selected. Portal not yet built.

Next step: scaffold Next.js portal with Clerk authentication.
