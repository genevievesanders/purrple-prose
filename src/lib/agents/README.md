# Agent orchestration layer

Framework-agnostic — nothing in here may import from `next/*` or `@/app/*`.
The web layer calls into this module; never the other way around.

```
agents/
  orchestrator.ts   # routes a request to the right sub-agent(s)   (Phase 4)
  registry.ts       # declarative agent defs: persona, tools, model (Phase 4)
  agents/           # muse, editor, continuity, critic, researcher  (Phase 4–5)
  tools/            # typed tool interface: retrieval, draft ops    (Phase 4–5)
  llm/              # LLMProvider interface + Anthropic impl        (Phase 4)
  memory/           # chunking, embeddings, per-user vector store   (Phase 5)
```

Key invariant: **every memory/retrieval call is scoped to a userId at the
repository level** — an agent cannot construct an unscoped query.
