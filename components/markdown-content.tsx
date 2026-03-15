"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <article className={`prose prose-lg dark:prose-invert max-w-none ${className || ""}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with proper spacing
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold tracking-tight text-foreground mt-10 mb-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-12 mb-5 pb-3 border-b border-border">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-foreground mt-10 mb-4">
              {children}
            </h3>
          ),
          // Paragraphs with Medium-like spacing
          p: ({ children }) => (
            <p className="text-foreground/90 leading-8 mb-6 text-[1.125rem]">
              {children}
            </p>
          ),
          // Links
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          // Strong text
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          // Emphasis
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="my-6 ml-6 list-disc space-y-3 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="my-6 ml-6 list-decimal space-y-3 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="text-foreground/90 leading-7 pl-2">
              {children}
            </li>
          ),
          // Blockquotes - Medium style
          blockquote: ({ children }) => (
            <blockquote className="my-8 border-l-4 border-primary pl-6 italic text-foreground/70">
              {children}
            </blockquote>
          ),
          // Code inline
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <code className={className}>
                  {children}
                </code>
              )
            }
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                {children}
              </code>
            )
          },
          // Code blocks
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              {children}
            </pre>
          ),
          // Images
          img: ({ src, alt }) => (
            <figure className="my-8">
              <img 
                src={src} 
                alt={alt || ''} 
                className="rounded-lg shadow-md w-full"
                loading="lazy"
              />
              {alt && (
                <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-8 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-3 text-foreground/90">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border even:bg-muted/30">
              {children}
            </tr>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-10 border-t border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
