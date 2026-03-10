import { describe, expect, it } from "vitest";
import { cn } from "@otl-core/style-utils";

describe("Utils", () => {
  describe("cn (className merger)", () => {
    it("should merge class names", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      const result = cn("foo", false && "bar", "baz");
      expect(result).toBe("foo baz");
    });

    it("should merge tailwind classes correctly", () => {
      const result = cn("px-2 py-1", "px-4");
      expect(result).toBe("py-1 px-4");
    });

    it("should handle empty inputs", () => {
      const result = cn();
      expect(result).toBe("");
    });
  });
});
