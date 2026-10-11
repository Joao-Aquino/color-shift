import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";

interface ChangelogEntry {
  date: string;
  paragraphs: string[];
  title: string;
}

const progressFile = readFile(path.join(process.cwd(), "progress.md"), "utf8");
const inlineMarkdownPattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function parseProgress(markdown: string): ChangelogEntry[] {
  return markdown
    .split(/^## /m)
    .slice(1)
    .flatMap((section) => {
      const [heading = "", ...bodyLines] = section.trim().split("\n");
      const headingMatch = heading.match(/^(\d{4}-\d{2}-\d{2})\s+[-—]\s+(.+)$/);
      if (!headingMatch) return [];

      return [
        {
          date: headingMatch[1],
          title: headingMatch[2],
          paragraphs: bodyLines
            .join("\n")
            .trim()
            .split(/\n\s*\n/)
            .filter(Boolean),
        },
      ];
    });
}

function renderInlineMarkdown(value: string): ReactNode[] {
  return value.split(inlineMarkdownPattern).filter(Boolean).map((part, index) => {
    const key = `${index}-${part.slice(0, 16)}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const external = href.startsWith("http://") || href.startsWith("https://");
      return (
        <a
          href={href}
          key={key}
          rel={external ? "noreferrer" : undefined}
          target={external ? "_blank" : undefined}
        >
          {label}
        </a>
      );
    }

    return part;
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export async function ChangelogContent() {
  const entries = parseProgress(await progressFile);

  return (
    <article
      aria-labelledby="changelog-title"
      className="underlay-nav__document underlay-nav__document--changelog"
    >
      <header className="underlay-nav__document-header">
        <p className="underlay-nav__eyebrow">Product updates</p>
        <h2 id="changelog-title">Changelog</h2>
      </header>

      <div
        className="step-timeline"
        data-step-timeline-activation="0.5"
        data-step-timeline-init
      >
        <div className="step-timeline__wrapper">
          <div aria-hidden="true" className="step-timeline__line" data-step-timeline-line>
            <div className="step-timeline__fill" data-step-timeline-fill />
          </div>

          <ol className="step-timeline__list">
            {entries.map((entry, index) => (
              <li
                className="step-timeline__item"
                data-status="inactive"
                data-step-timeline-item
                key={`${entry.date}-${entry.title}`}
              >
                <div aria-hidden="true" className="step-timeline__marker" data-step-timeline-marker>
                  <span>{index + 1}</span>
                </div>

                <section aria-labelledby={`changelog-entry-${index}`} className="step-timeline__content">
                  <time className="step-timeline__date" dateTime={entry.date}>
                    {formatDate(entry.date)}
                  </time>
                  <h3 className="step-timeline__content-h" id={`changelog-entry-${index}`}>
                    {entry.title}
                  </h3>
                  <div className="step-timeline__body">
                    {entry.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${entry.date}-${paragraphIndex}`}>
                        {renderInlineMarkdown(paragraph)}
                      </p>
                    ))}
                  </div>
                </section>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}
