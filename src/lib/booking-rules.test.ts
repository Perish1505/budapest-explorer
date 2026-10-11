import { describe, expect, it } from "vitest";
import { calcTotal, canUserCancel, placesLeft } from "./booking-rules";

describe("booking rules", () => {
  it("prices adults and children separately", () => {
    expect(calcTotal(39, 25, 2, 1)).toBe(103);
  });
  it("ignores child price when tour has none", () => {
    expect(calcTotal(55, null, 3, 0)).toBe(165);
  });
  it("allows cancellation 24h or more before departure", () => {
    const now = new Date("2026-06-01T10:00:00Z");
    expect(canUserCancel("confirmed", "2026-06-02T10:00:00Z", now)).toBe(true);
  });
  it("blocks cancellation less than 24h before departure", () => {
    const now = new Date("2026-06-01T10:00:00Z");
    expect(canUserCancel("confirmed", "2026-06-02T09:59:00Z", now)).toBe(false);
  });
  it("blocks cancelling an already cancelled booking", () => {
    expect(canUserCancel("cancelled", "2030-01-01T00:00:00Z")).toBe(false);
  });
  it("never reports negative places", () => {
    expect(placesLeft(12, 14)).toBe(0);
  });
});
