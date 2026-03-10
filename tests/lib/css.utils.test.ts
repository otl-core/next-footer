import type { BorderConfig, ColorReference } from "@otl-core/cms-types";
import { describe, expect, it } from "vitest";
import {
  generateResponsiveSpacingCSS,
  minifyCSS,
  resolveBorderToCSS,
  resolveColorToCSS,
  resolveColorsToCSS,
} from "@otl-core/style-utils";

describe("CSS Utils", () => {
  describe("minifyCSS", () => {
    it("should remove comments", () => {
      const css = "/* comment */ body { color: red; }";
      expect(minifyCSS(css)).not.toContain("comment");
    });

    it("should remove extra whitespace", () => {
      const css = "body  {  color:  red;  }";
      expect(minifyCSS(css)).toBe("body{color:red}");
    });

    it("should remove spaces around special characters", () => {
      const css = "body { color : red ; }";
      expect(minifyCSS(css)).toBe("body{color:red}");
    });

    it("should remove unnecessary semicolons", () => {
      const css = "body { color: red; }";
      expect(minifyCSS(css)).toBe("body{color:red}");
    });

    it("should normalize zero values", () => {
      expect(minifyCSS("body { margin: 0px; }")).toContain("margin:0");
      expect(minifyCSS("div { padding: 0em; }")).toContain("padding:0");
      expect(minifyCSS("span { border: 0rem; }")).toContain("border:0");
    });

    it("should handle complex CSS", () => {
      const css = `
        /* Main styles */
        body {
          margin: 0px;
          padding: 16px;
        }
        .container { 
          width: 100%;
        }
      `;
      const result = minifyCSS(css);
      expect(result).not.toContain("\n");
      expect(result).not.toContain("/*");
      expect(result).toContain("margin:0");
    });

    it("should handle edge cases", () => {
      // Empty string
      expect(minifyCSS("")).toBe("");

      // Only whitespace
      expect(minifyCSS("   \n\t  ")).toBe("");

      // Only comments
      expect(minifyCSS("/* comment */")).toBe("");

      // Multiple consecutive spaces
      expect(minifyCSS("body   {   color:   red;   }")).toBe("body{color:red}");

      // Nested comments
      expect(minifyCSS("/* outer /* inner */ */body{color:red}")).toContain(
        "body{color:red}",
      );
    });
  });

  describe("resolveColorToCSS", () => {
    it("should return undefined for undefined input", () => {
      expect(resolveColorToCSS(undefined)).toBeUndefined();
    });

    it("should resolve custom colors", () => {
      const color: ColorReference = { type: "custom", value: "#ff0000" };
      expect(resolveColorToCSS(color)).toBe("#ff0000");
    });

    it("should resolve theme colors to CSS variables", () => {
      const color: ColorReference = { type: "theme", value: "primary" };
      expect(resolveColorToCSS(color)).toBe("var(--primary)");
    });

    it("should resolve variable colors to CSS variables", () => {
      const color: ColorReference = { type: "variable", value: "text-color" };
      expect(resolveColorToCSS(color)).toBe("var(--text-color)");
    });

    it("should return undefined for unknown type", () => {
      const color = {
        type: "unknown",
        value: "test",
      } as unknown as ColorReference;
      expect(resolveColorToCSS(color)).toBeUndefined();
    });
  });

  describe("resolveColorsToCSS", () => {
    it("should resolve multiple colors", () => {
      const colors = {
        background: { type: "custom", value: "#ffffff" } as ColorReference,
        text: { type: "theme", value: "foreground" } as ColorReference,
      };
      const result = resolveColorsToCSS(colors);
      expect(result.background).toBe("#ffffff");
      expect(result.text).toBe("var(--foreground)");
    });

    it("should skip undefined colors", () => {
      const colors = {
        background: { type: "custom", value: "#ffffff" } as ColorReference,
        text: undefined,
      };
      const result = resolveColorsToCSS(colors);
      expect(result.background).toBe("#ffffff");
      expect(result.text).toBeUndefined();
    });

    it("should handle empty object", () => {
      expect(resolveColorsToCSS({})).toEqual({});
    });
  });

  describe("resolveBorderToCSS", () => {
    it("should return undefined for undefined border", () => {
      expect(resolveBorderToCSS(undefined)).toBeUndefined();
    });

    it("should resolve simple border", () => {
      const border: BorderConfig = {
        width: "1px",
        style: "solid",
        color: { type: "custom", value: "#000000" },
      };
      const result = resolveBorderToCSS(border);
      expect(result).toEqual({
        border: "1px solid #000000",
      });
    });

    it("should include border radius", () => {
      const border: BorderConfig = {
        width: "2px",
        style: "dashed",
        color: { type: "custom", value: "#ff0000" },
        radius: "4px",
      };
      const result = resolveBorderToCSS(border);
      expect(result).toEqual({
        border: "2px dashed #ff0000",
        borderRadius: "4px",
      });
    });

    it("should handle individual sides", () => {
      const border: BorderConfig = {
        top: {
          width: "1px",
          style: "solid",
          color: { type: "custom", value: "#000000" },
        },
        bottom: {
          width: "2px",
          style: "dashed",
          color: { type: "custom", value: "#ff0000" },
        },
      };
      const result = resolveBorderToCSS(border);
      expect(result).toEqual({
        borderTop: "1px solid #000000",
        borderBottom: "2px dashed #ff0000",
      });
    });

    it("should fall back to default values for individual sides", () => {
      const border: BorderConfig = {
        width: "1px",
        style: "solid",
        color: { type: "custom", value: "#000000" },
        top: { width: "2px" },
      };
      const result = resolveBorderToCSS(border);
      expect(result?.borderTop).toBe("2px solid #000000");
    });

    it("should return undefined when border is incomplete", () => {
      const border: BorderConfig = {
        width: "1px",
      };
      const result = resolveBorderToCSS(border);
      expect(result).toBeUndefined();
    });

    it("should handle edge cases", () => {
      // Border with only radius
      const onlyRadius: BorderConfig = {
        radius: "8px",
      };
      expect(resolveBorderToCSS(onlyRadius)).toEqual({
        borderRadius: "8px",
      });

      // Border with zero width
      const zeroWidth: BorderConfig = {
        width: "0",
        style: "solid",
        color: { type: "custom", value: "#000000" },
      };
      expect(resolveBorderToCSS(zeroWidth)).toEqual({
        border: "0 solid #000000",
      });

      // Individual sides with different colors
      const multiColor: BorderConfig = {
        top: {
          width: "1px",
          style: "solid",
          color: { type: "custom", value: "#ff0000" },
        },
        bottom: {
          width: "1px",
          style: "solid",
          color: { type: "custom", value: "#00ff00" },
        },
      };
      const result = resolveBorderToCSS(multiColor);
      expect(result?.borderTop).toBe("1px solid #ff0000");
      expect(result?.borderBottom).toBe("1px solid #00ff00");
    });
  });

  describe("generateResponsiveSpacingCSS", () => {
    it("should return null for empty config", () => {
      expect(generateResponsiveSpacingCSS("test", {})).toBeNull();
    });

    it("should generate base margin CSS", () => {
      const result = generateResponsiveSpacingCSS("navbar", {
        margin: "16px",
      });
      expect(result).toContain(".navbar");
      expect(result).toContain("margin:16px");
    });

    it("should generate base padding CSS", () => {
      const result = generateResponsiveSpacingCSS("navbar", {
        padding: "1rem",
      });
      expect(result).toContain(".navbar");
      expect(result).toContain("padding:1rem");
    });

    it("should generate base gap CSS", () => {
      const result = generateResponsiveSpacingCSS("navbar", {
        gap: "2rem",
      });
      expect(result).toContain(".navbar");
      expect(result).toContain("gap:2rem");
    });

    it("should generate responsive margin", () => {
      const result = generateResponsiveSpacingCSS("navbar", {
        margin: {
          base: "16px",
          md: "24px",
        },
      });
      expect(result).toContain("margin:16px");
      expect(result).toContain("@media(min-width:768px)");
      expect(result).toContain("margin:24px");
    });

    it("should generate border CSS", () => {
      const border: BorderConfig = {
        width: "1px",
        style: "solid",
        color: { type: "custom", value: "#e5e7eb" },
      };
      const result = generateResponsiveSpacingCSS("navbar", { border });
      expect(result).toContain("border:1px solid #e5e7eb");
    });

    it("should generate responsive border", () => {
      const border = {
        base: {
          width: "1px",
          style: "solid",
          color: { type: "custom", value: "#000" },
        } as BorderConfig,
        lg: {
          width: "2px",
          style: "solid",
          color: { type: "custom", value: "#fff" },
        } as BorderConfig,
      };
      const result = generateResponsiveSpacingCSS("navbar", { border });
      expect(result).toContain("border:1px solid #000");
      expect(result).toContain("@media(min-width:1024px)");
      expect(result).toContain("border:2px solid #fff");
    });

    it("should combine multiple spacing properties", () => {
      const result = generateResponsiveSpacingCSS("navbar", {
        margin: "8px",
        padding: "16px",
        gap: "2rem",
      });
      expect(result).toContain("margin:8px");
      expect(result).toContain("padding:16px");
      expect(result).toContain("gap:2rem");
    });

    it("should minify output", () => {
      const result = generateResponsiveSpacingCSS("navbar", {
        margin: "16px",
      });
      expect(result).not.toContain("\n");
      expect(result).not.toContain("  ");
    });
  });
});
