import {
  Site,
  FooterConfig,
  FooterContentSection,
  FooterSection,
} from "@otl-core/cms-types";
import React from "react";
import { resolveColorToCSS } from "@otl-core/style-utils";
import { isContentSection } from "../../lib/footer.utils";
import { BlockRenderer as LocalBlockRenderer } from "../blocks/block-renderer";
import type { BlockRegistry } from "@otl-core/block-registry";
import { BlockRenderer as RegistryBlockRenderer } from "@otl-core/block-registry";

interface FooterSectionProps {
  section: FooterSection | FooterContentSection;
  footer: FooterConfig;
  site: Site;
  resolvedColors: Record<string, string | undefined>;
  level?: number;
  blockRegistry?: BlockRegistry;
  parentMinWidth?: string;
}

export const FooterSectionComponent: React.FC<FooterSectionProps> = ({
  section,
  footer,
  site,
  resolvedColors,
  level = 0,
  blockRegistry,
  parentMinWidth,
}) => {
  const sectionStyle: React.CSSProperties = (() => {
    const style: React.CSSProperties = {
      display: "flex",
      flexDirection: section.type === "row" ? "row" : "column",
      alignItems: section.style.align || "flex-start",
      justifyContent: section.style.justify || "flex-start",
      gap: section.style.gap || "0",
    };

    if (section.style.flex) {
      style.flex = section.style.flex;
    }

    if (section.style.wrap) {
      style.flexWrap = "wrap";
    }

    if (parentMinWidth) {
      style.minWidth = parentMinWidth;
    }

    // Apply section-specific background
    if (section.style.background) {
      style.backgroundColor = resolveColorToCSS(section.style.background);
    }

    // Apply section-specific padding
    if (section.style.padding) {
      const padding =
        typeof section.style.padding === "object" &&
        "base" in section.style.padding
          ? section.style.padding.base
          : section.style.padding;
      style.padding = padding;
    }

    // Apply section-specific border
    if (section.style.border) {
      const border =
        typeof section.style.border === "object" &&
        "base" in section.style.border
          ? section.style.border.base
          : section.style.border;

      if (border) {
        const bw = border.width || "0";
        const bs = border.style || "solid";
        const bc = border.color
          ? resolveColorToCSS(border.color)
          : "transparent";
        if (bw.trim().includes(" ")) {
          style.borderWidth = bw;
          style.borderStyle = bs;
          style.borderColor = bc;
        } else {
          style.border = `${bw} ${bs} ${bc}`;
        }
        if (border.radius) {
          style.borderRadius = border.radius;
        }
      }
    }

    return style;
  })();

  // Content section - render blocks
  if (isContentSection(section)) {
    return (
      <div
        className="footer-section footer-content-section"
        style={sectionStyle}
        data-section-id={section.id}
      >
        {section?.blocks?.map((block) =>
          blockRegistry ? (
            <RegistryBlockRenderer
              key={block.id}
              block={block}
              blockRegistry={blockRegistry}
            />
          ) : (
            <LocalBlockRenderer key={block.id} block={block} />
          ),
        )}
      </div>
    );
  }

  // Container section - render nested sections recursively
  return (
    <div
      className="footer-section footer-container-section"
      style={sectionStyle}
      data-section-id={section.id}
    >
      {section?.sections
        ?.sort((a, b) => a.order - b.order)
        ?.map((childSection) => (
          <FooterSectionComponent
            key={childSection.id}
            section={childSection}
            footer={footer}
            site={site}
            resolvedColors={resolvedColors}
            parentMinWidth={section.style.minWidth}
            level={level + 1}
            blockRegistry={blockRegistry}
          />
        ))}
    </div>
  );
};
