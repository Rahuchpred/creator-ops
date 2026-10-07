# Creator Ops

See [README.md](README.md) for the idea and [docs/plan.md](docs/plan.md) for
the build stages.

## Design rules

These come from the owner. Do not use the frontend-design skill or any other
design skill here.

- Font: Geist.
- Components: Base UI (`@base-ui/react`). Fall back to shadcn only when Base
  UI has no equivalent.
- Color: blue, around `#356ED8`. Never a flat fill for the brand color. It
  always carries a gradient, glow or shader, in the spirit of everygen.ai.
- Layout: use the Mobbin MCP to find a good structure. Borrow the structure
  only, never the visuals.
- Quality checks: the Vercel web interface guidelines.

## Writing

No em dashes or en dashes anywhere, including UI copy and comments.
