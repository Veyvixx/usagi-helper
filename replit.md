# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (API server), node:sqlite built-in (Discord bot)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── discord-bot/        # gegg boi Discord bot (discord.js v14)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Discord Bot (`artifacts/discord-bot`)

**gegg boi** — A full-featured Discord moderation bot.

- **Prefix**: `,`
- **Embed color**: `#f4b729` (gold)
- **Runtime**: Node.js 24 with `node:sqlite` (no native compilation needed)
- **Entry**: `src/index.ts`
- **Database**: SQLite stored at `data/bot.db`

### Features

**Moderation commands** (30+):
- warn, warnings, history
- timeout, untimeout, mute, unmute
- imute (block media), iunmute, rmute (block reactions), runmute
- kick, softban, tempban, hardban, unban
- jail, unjail
- purge (by count or by user)
- slowmode, lockdown, unlock, topic, nuke, drag, revokefiles, modstats

**Reaction & Button Roles**:
- `,reactionrole <msgId> <emoji> @role` — Reaction role
- `,buttonrole @role [label]` — Button role menu

**Logging System**: Logs member join/leave, message edits/deletes, and all mod actions to a configured channel.

**ModMail**: Users DM the bot → thread channel opens in staff category → staff reply with `,mr message` → close with button.

### Setup Commands

- `,setlogchannel #channel` — Where all logs go
- `,setmodmailchannel #channel` — Parent for modmail threads
- `,setmuterole @role` — Role used for `,mute`
- `,setjailrole @role` — Role used for `,jail`

### Running

- Dev: `pnpm --filter @workspace/discord-bot run dev`
- Workflow: "gegg boi Discord Bot"
- Token: stored as `DISCORD_TOKEN` secret

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
