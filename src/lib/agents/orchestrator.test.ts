import { describe, expect, it } from "vitest";
import { routeTask } from "./orchestrator";
import { AGENTS } from "./registry";

describe("agent routing", () => {
  it("routes the cat's wake-up to the fast Muse", () => {
    expect(routeTask({ kind: "cat-prompt" })).toBe("muse-cat");
  });

  it("routes reviews to the Editor", () => {
    expect(
      routeTask({ kind: "review", draft: { title: "T", content: "C" } })
    ).toBe("editor");
  });

  it("routes structural critique to the Critic", () => {
    expect(
      routeTask({ kind: "critique", draft: { title: "T", content: "C" } })
    ).toBe("critic");
  });

  it("routes continuity checks to the Continuity keeper", () => {
    expect(
      routeTask({
        kind: "continuity",
        draft: { title: "T", content: "C" },
        entryId: "e1",
      })
    ).toBe("continuity");
  });

  it("routes brainstorming to the Muse", () => {
    expect(
      routeTask({
        kind: "brainstorm",
        draft: { title: "T", content: "C" },
        messages: [],
      })
    ).toBe("muse");
  });

  it("every routed agent exists in the registry with a persona and model", () => {
    for (const def of Object.values(AGENTS)) {
      expect(def.persona.length).toBeGreaterThan(50);
      expect(def.model.length).toBeGreaterThan(0);
      expect(def.persona).toContain(`[agent:${def.key}]`);
    }
  });
});
