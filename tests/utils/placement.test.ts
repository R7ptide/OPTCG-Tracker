import { parsePlacementInput } from "../../utils/placement";

describe("parsePlacementInput", () => {
  it("treats empty or whitespace-only input as no placement", () => {
    expect(parsePlacementInput("")).toEqual({ ok: true, value: null });
    expect(parsePlacementInput("   ")).toEqual({ ok: true, value: null });
  });

  it("accepts positive integers", () => {
    expect(parsePlacementInput("1")).toEqual({ ok: true, value: 1 });
    expect(parsePlacementInput("11")).toEqual({ ok: true, value: 11 });
  });

  it("trims surrounding whitespace", () => {
    expect(parsePlacementInput("  4  ")).toEqual({ ok: true, value: 4 });
  });

  it("rejects zero", () => {
    expect(parsePlacementInput("0")).toEqual({ ok: false });
  });

  it("rejects negative numbers", () => {
    expect(parsePlacementInput("-1")).toEqual({ ok: false });
  });

  it("rejects decimals", () => {
    expect(parsePlacementInput("1.5")).toEqual({ ok: false });
  });

  it("rejects non-numeric input", () => {
    expect(parsePlacementInput("abc")).toEqual({ ok: false });
    expect(parsePlacementInput("3abc")).toEqual({ ok: false });
  });
});
