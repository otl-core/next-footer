import {
  Site,
  HeaderConfig,
  HeaderDropdownButtonConfig,
  HeaderDropdownContent,
  HeaderDropdownNavigationItemConfig,
  HeaderNavigationItem,
  HeaderNavigationItemButtonConfig,
  HeaderNavigationItemDropdownConfig,
  HeaderNavigationItemLinkConfig,
  HeaderSection,
  LocalizedString,
  ShadowConfig,
} from "@otl-core/cms-types";
import { marked } from "marked";
import {
  generateDesktopDropdownAnimations,
  generateMobileMenuAnimations,
  generateResponsiveSpacingCSS,
  generateScrollbarStyles,
  generateToggleIconAnimations,
  minifyCSS,
} from "@otl-core/style-utils";

/**
 * Convert ShadowConfig to CSS box-shadow string
 */
export function shadowConfigToCSS(shadow: ShadowConfig): string {
  const { offsetX, offsetY, blurRadius, spreadRadius, color, inset } = shadow;
  const parts = [offsetX, offsetY, blurRadius, spreadRadius, color];
  if (inset) {
    return `inset ${parts.join(" ")}`;
  }
  return parts.join(" ");
}

export function calculateNavigationWidth(
  sections: HeaderSection[],
  site?: Site,
): number {
  let totalWidth = 150;

  for (const section of sections) {
    for (const item of section?.items || []) {
      if (item.type === "logo") continue;

      const label =
        typeof item.label === "string"
          ? item.label
          : getLocalizedString(item.label, site) || "";
      const labelLength = label.length;

      if (item.type === "button") {
        totalWidth += labelLength * 8 + 48;
      } else if (item.type === "link" || item.type === "dropdown") {
        totalWidth += labelLength * 8 + 24;
      }
    }
  }

  return totalWidth;
}

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl" | null;

export function getBreakpointForWidth(estimatedWidth: number): Breakpoint {
  const MAX_USABLE_WIDTH = 1400;

  if (estimatedWidth > MAX_USABLE_WIDTH) return null;

  if (estimatedWidth <= 640) return "sm";
  if (estimatedWidth <= 768) return "md";
  if (estimatedWidth <= 1024) return "lg";
  if (estimatedWidth <= 1280) return "xl";
  return "2xl";
}

export function generateNavigationCSS(
  id: string,
  navigation: HeaderConfig,
  resolvedColors: Record<string, string | undefined>,
  dropdownIds: string[] = [],
): string {
  const cssBlocks: (string | null)[] = [];

  if (navigation.style) {
    const headerCSS = generateResponsiveSpacingCSS(`header-${id}`, {
      margin: navigation.style.layout?.margin,
    });
    if (headerCSS) cssBlocks.push(headerCSS);
  }

  if (navigation.style) {
    const navbarCSS = generateResponsiveSpacingCSS(`navbar-${id}`, {
      border: navigation.style.border,
      padding: navigation.style.layout?.padding,
      gap: navigation.style.layout?.sectionGap,
      shadow: navigation.style.shadow,
    });
    if (navbarCSS) cssBlocks.push(navbarCSS);
  }

  if (navigation.style && dropdownIds.length > 0) {
    dropdownIds.forEach((dropdownId) => {
      const dropdownCSS = generateResponsiveSpacingCSS(
        `navigation-dropdown-${dropdownId}`,
        {
          padding: navigation.style?.dropdown?.padding,
          border: navigation.style?.dropdown?.border,
        },
      );
      if (dropdownCSS) cssBlocks.push(dropdownCSS);

      const dropdownContentCSS = generateResponsiveSpacingCSS(
        `dropdown-content-${dropdownId}`,
        {
          gap: navigation.style?.dropdown?.sectionGap,
        },
      );
      if (dropdownContentCSS) cssBlocks.push(dropdownContentCSS);
    });
  }

  if (resolvedColors.burgerButtonBackgroundHover) {
    cssBlocks.push(
      `.mobile-menu-toggle-${id}:hover{background-color:${resolvedColors.burgerButtonBackgroundHover}!important}`,
    );
  }

  if (
    resolvedColors.dropdownMenuLinkHoverColor ||
    resolvedColors.dropdownMenuLinkHoverBackground
  ) {
    const hoverStyles: string[] = [];
    if (resolvedColors.dropdownMenuLinkHoverBackground) {
      hoverStyles.push(
        `background-color:${resolvedColors.dropdownMenuLinkHoverBackground}!important`,
      );
    }
    if (resolvedColors.dropdownMenuLinkHoverColor) {
      hoverStyles.push(
        `color:${resolvedColors.dropdownMenuLinkHoverColor}!important`,
      );
    }
    cssBlocks.push(
      `#mobile-menu-dropdown-${id} a:hover{${hoverStyles.join(";")}}`,
    );
  }

  cssBlocks.push(...generateToggleIconAnimations());
  cssBlocks.push(...generateMobileMenuAnimations());
  cssBlocks.push(...generateScrollbarStyles());
  cssBlocks.push(...generateDesktopDropdownAnimations());

  return minifyCSS(cssBlocks.filter(Boolean).join(""));
}

export function sectionsToDropdownContent(
  sections: HeaderSection[],
): HeaderDropdownContent[] {
  const result: HeaderDropdownContent[] = [];

  sections.forEach((section: HeaderSection) => {
    const items = section?.items?.filter((item: HeaderNavigationItem) => {
      if (item.type === "logo") return false;
      const vis =
        item.visibility ||
        ((item as unknown as Record<string, unknown>).collapse === false
          ? "navbar-only"
          : undefined);
      if (vis === "navbar-only") return false;
      return true;
    });

    if (items?.length === 0) return;

    items?.forEach((item: HeaderNavigationItem) => {
      if (item.type === "link") {
        const config = item.config as HeaderNavigationItemLinkConfig;
        const navConfig: HeaderDropdownNavigationItemConfig = {
          label: item.label || "",
          href: config.href,
          icon: config.icon,
          external: config.external,
        };
        result.push({
          id: item.id,
          type: "navigation-item",
          config: navConfig,
        });
      } else if (item.type === "button") {
        const config = item.config as HeaderNavigationItemButtonConfig;
        const btnConfig: HeaderDropdownButtonConfig = {
          label: item.label || "",
          href: config.href,
          icon: config.icon,
          external: config.external,
          variant: config.variant,
          size: config.size,
        };
        result.push({
          id: item.id,
          type: "button",
          config: btnConfig,
        });
      } else if (item.type === "dropdown") {
        const config = item.config as HeaderNavigationItemDropdownConfig;
        result.push({
          id: item.id,
          type: "dropdown",
          label: item.label || "",
          config,
        });
      }
    });

    if (sections.indexOf(section) < sections.length - 1) {
      result.push({
        id: `divider-${section.id}`,
        type: "divider",
        config: {},
      });
    }
  });

  return result;
}

export function resolveDropdownColor(
  colorRef: { type: string; value: string } | undefined,
  resolvedColors: Record<string, string | undefined>,
  fallback?: string,
): string | undefined {
  if (!colorRef) return fallback;

  if (colorRef.type === "custom") {
    return colorRef.value;
  }

  if (colorRef.type === "theme") {
    return resolvedColors[colorRef.value] || fallback;
  }

  if (colorRef.type === "variable") {
    // For variables, construct the CSS variable reference
    return `var(--color-${colorRef.value})`;
  }

  return fallback;
}

function getBrowserPreferredLocales(options = {}) {
  const defaultOptions = {
    languageCodeOnly: false,
  };
  const opt = {
    ...defaultOptions,
    ...options,
  };
  const browserLocales =
    navigator.languages === undefined
      ? [navigator.language]
      : navigator.languages;
  if (!browserLocales) {
    return undefined;
  }
  return browserLocales.map((locale) => {
    const trimmedLocale = locale.trim();
    return opt.languageCodeOnly ? trimmedLocale.split(/-|_/)[0] : trimmedLocale;
  });
}

export function getLocalizedString(
  value: string | LocalizedString | null | undefined,
  site?: Site,
): string {
  // Handle null/undefined
  if (value === null || value === undefined) return "";

  // If it's already a string, return it
  if (typeof value === "string") return value;

  // Get the preferred locale from options or use default fallback
  const preferredLocale = getBrowserPreferredLocales() || [
    site?.default_locale || "en",
  ];

  // Try preferred locale
  for (const locale of preferredLocale) {
    if (locale in value && value[locale]) {
      return value[locale];
    }
  }

  // Try default locale
  if (
    site?.default_locale &&
    site.default_locale in value &&
    value[site.default_locale]
  ) {
    return value[site.default_locale];
  }

  // Try 'en' as fallback
  if ("en" in value && value.en) {
    return value.en;
  }

  // Try any supported locale
  if (site?.supported_locales) {
    for (const locale of site.supported_locales) {
      if (locale in value && value[locale]) {
        return value[locale];
      }
    }
  }

  // Return first available value as last resort
  const keys = Object.keys(value);
  if (keys.length > 0 && value[keys[0]]) {
    return value[keys[0]];
  }

  return "";
}

export function parseMarkdownToHTML(markdown: string): string {
  // Parse markdown to HTML
  const html = marked.parse(markdown, { async: false }) as string;

  // Transform h1-h6 elements to divs with corresponding classes
  return html
    .replace(/<h1>/g, '<div class="h1">')
    .replace(/<\/h1>/g, "</div>")
    .replace(/<h2>/g, '<div class="h2">')
    .replace(/<\/h2>/g, "</div>")
    .replace(/<h3>/g, '<div class="h3">')
    .replace(/<\/h3>/g, "</div>")
    .replace(/<h4>/g, '<div class="h4">')
    .replace(/<\/h4>/g, "</div>")
    .replace(/<h5>/g, '<div class="h5">')
    .replace(/<\/h5>/g, "</div>")
    .replace(/<h6>/g, '<div class="h6">')
    .replace(/<\/h6>/g, "</div>");
}
