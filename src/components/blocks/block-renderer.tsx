/**
 * Block Renderer for Footer Components
 * Renders blocks within the footer context
 * This is a minimal implementation that supports the blocks commonly used in footers
 */

import { BlockInstance } from "@otl-core/cms-types";
import React from "react";
import ReactMarkdown from "react-markdown";

interface BlockRendererProps {
  block: BlockInstance;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const { type, config } = block;

  // Markdown block
  if (type === "markdown") {
    const content = (config as { content?: string }).content || "";
    return (
      <div className="footer-block footer-markdown">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Link block
  if (type === "link") {
    const linkConfig = config as {
      text?: string;
      href?: string;
      external?: boolean;
      variant?: string;
      ariaLabel?: string;
    };

    const target = linkConfig.external ? "_blank" : undefined;
    const rel = linkConfig.external ? "noopener noreferrer" : undefined;

    const variantClasses = {
      default: "footer-link hover:underline transition-colors",
      underline: "footer-link underline",
      "no-underline": "footer-link no-underline",
      "button-primary":
        "footer-link inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90",
      "button-secondary":
        "footer-link inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80",
      "button-outline":
        "footer-link inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors border border-gray-200 text-surface-foreground hover:bg-accent hover:text-accent-foreground",
    };

    const className =
      variantClasses[
        (linkConfig.variant as keyof typeof variantClasses) || "default"
      ];

    return (
      <a
        href={linkConfig.href}
        target={target}
        rel={rel}
        className={className}
        aria-label={linkConfig.ariaLabel || linkConfig.text}
      >
        {linkConfig.text}
      </a>
    );
  }

  // Button block (existing button rendering logic)
  if (type === "button") {
    const buttonConfig = config as {
      text?: string;
      url?: string;
      variant?: string;
      size?: string;
      newTab?: boolean;
    };

    const target = buttonConfig.newTab ? "_blank" : undefined;
    const rel = buttonConfig.newTab ? "noopener noreferrer" : undefined;

    return (
      <a
        href={buttonConfig.url}
        target={target}
        rel={rel}
        className="footer-block footer-button inline-flex items-center justify-center px-4 py-2 rounded-md transition-colors"
      >
        {buttonConfig.text}
      </a>
    );
  }

  // Image block
  if (type === "image") {
    const imageConfig = config as {
      src?: string;
      alt?: string;
      width?: number;
      height?: number;
    };

    return (
      <div className="footer-block footer-image">
        <img
          src={imageConfig.src}
          alt={imageConfig.alt || ""}
          width={imageConfig.width}
          height={imageConfig.height}
        />
      </div>
    );
  }

  // Divider block
  if (type === "divider") {
    return <hr className="footer-block footer-divider" />;
  }

  // Fallback for unknown block types
  return null;
};
