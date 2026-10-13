# Dark projects

`"owner": "agent"` in `factory.json`. Everything in `SKILL.md` holds,
except:

- The owner (`Factory · owner`) takes the human's seat, triage cards
  included. The manager still handles everything that isn't a product
  call.
- Owner decisions go in as `> Owner decision: "..."` and count like the
  human's. A real human decision beats one.
- Clients are the human and the agents using the tool. Agents file
  `source:feedback` issues. A blocked client is `p0`.
- Big calls go through the `council` first.
- The manager runs `upkeep` weekly. The owner runs `researcher` weekly,
  when it's stuck, and when there's nothing to build.
- The human hears from the factory only in reply, or when the owner hits
  something no agent can do.
- Never delete or rewrite client and user data, `main`'s history, or
  keys and secrets. The owner's word can't allow it.
