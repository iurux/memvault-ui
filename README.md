# memvault-ui

Web UI for [memvault](https://github.com/iurux/memvault): browse, search, edit, tag, archive and delete the AI conversations saved in your local memvault database.

It talks to the memvault API on your own machine (`http://127.0.0.1:8765`), so your data never leaves your computer.

## Install

Requires [Bun](https://bun.sh) (or Node 20+) and the memvault backend.

```bash
mkdir -p ~/code && cd ~/code
git clone https://github.com/iurux/memvault.git && pip install -e ./memvault
git clone https://github.com/iurux/memvault-ui.git
cd memvault-ui && bun install
```

## Run

```bash
memvault ui                                        # API, in one terminal
cd ~/code/memvault-ui && bun run dev -- --port 4173  # UI, in another
```

Open http://localhost:4173. If the API isn't running, the UI shows sample data and a banner telling you so. The API address can be changed in the settings popover.

To start both at login and use it as a Dock app, see the [memvault README](https://github.com/iurux/memvault#use-it-as-an-app).

## Update

```bash
cd ~/code/memvault-ui && git pull && bun install
```

The dev server reloads by itself; just refresh the window.

## Keyboard shortcuts

| key | |
|---|---|
| `/` | search |
| `j` / `k` | next / previous conversation |
| `Enter` | open |
| `e` | archive / unarchive |
| `#` | delete permanently |
| `Esc` | close or clear |
| `?` | show all shortcuts |

## Development

React, TypeScript, TanStack Start/Router/Query, Tailwind and shadcn/ui. All API calls live in `src/lib/api.ts`.

```bash
bun run dev      # local dev server
bun run lint
bun run test
```

`bun run build` produces a Cloudflare Workers bundle in `.output/`. For local use, `bun run dev` is all you need.

This project is built with [Lovable](https://lovable.dev). Changes made in the Lovable editor are committed to this repo, and pushes to `main` sync back to Lovable.

## License

MIT
