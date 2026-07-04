# Infrastructure

![Ordina Cresce](./oc_logo.svg)

## Overview

Ordina Cresce runs on a low-cost internal stack. The goal is a centralized internal portal where staff log in once and access all tools from one place.

## Tools

| Layer | Tool | Cost |
|-------|------|------|
| Email, calendar, drive, passwords | Proton Business (Mail Essentials) | ~$6.99/user/month |
| CRM | Twenty (self-hosted, open-source) | $0 |
| Internal portal | Next.js on DigitalOcean Droplet | $12/month |
| Authentication | Clerk | $0 (up to 10,000 users) |
| Database | PostgreSQL on same Droplet | $0 |

## Monthly Cost Estimate

| Item | Cost |
|------|------|
| Proton Business — 2 users | ~$14 |
| DigitalOcean Droplet (2 GB RAM) | $12 |
| Clerk | $0 |
| **Total** | **~$26/month** |

## Domains

`ordina.one` — internal use only. All staff-facing tools run under this domain.

- `app.ordina.one` — internal portal
- `crm.ordina.one` — Twenty CRM

`ordinacresce.com` — public-facing company website (future).

## Server — DigitalOcean Droplet

One Droplet hosts everything: the Next.js portal, Twenty CRM, and PostgreSQL database.

**Recommended spec:** 1 vCPU, 2 GB RAM, $12/month.

Nginx runs as a reverse proxy and routes traffic by subdomain:

- `app.ordina.one` — internal portal
- `crm.ordina.one` — Twenty CRM

Both Twenty and the portal run in Docker. Nginx terminates SSL and forwards requests to the correct container.

## Internal Portal

The portal is a Next.js web app. Staff log in once via Clerk (email + password, magic link to Proton inbox). After login, the portal shows links and tools based on the user's role.

### Access by role

| Role | Access |
|------|--------|
| Admin | Everything |
| Staff | CRM, internal SOPs, operations tools |

### Authentication flow

1. Staff opens `app.ordina.one`.
2. Logs in with company email and password (Proton inbox receives verification emails).
3. Clerk confirms identity and returns a session.
4. Portal shows the dashboard for that user's role.

## CRM — Twenty

Twenty is an open-source CRM. We self-host it on the same Droplet via Docker. It manages contacts, clients, and opportunities.

Twenty supports SAML 2.0 SSO and OAuth 2.0. Future integration with the portal can use Twenty's OAuth server so staff do not need a separate CRM login.

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
Staff → [Clerk login] → [app.ordina.one]
                               ↓
                    [DigitalOcean Droplet / Nginx]
                         ↓              ↓
                  [Next.js portal]  [Twenty CRM]
                                    [PostgreSQL]
```

## Status

Pre-launch. Stack selected. Portal not yet built.

Next step: scaffold Next.js portal with Clerk authentication.
