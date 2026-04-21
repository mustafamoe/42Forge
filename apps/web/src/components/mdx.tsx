import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Folder,
  Info,
  Lightbulb,
  ListChecks,
  TerminalSquare,
} from 'lucide-react'
import { Children } from 'react'
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'
import { ProjectLab } from './ProjectLab'

export { ProjectLab } from './ProjectLab'

type CalloutType = 'note' | 'tip' | 'warning' | 'success'

const calloutIcons: Record<CalloutType, ReactNode> = {
  note: <Info aria-hidden="true" size={18} />,
  tip: <Lightbulb aria-hidden="true" size={18} />,
  warning: <AlertTriangle aria-hidden="true" size={18} />,
  success: <CheckCircle2 aria-hidden="true" size={18} />,
}

export function Callout({
  type = 'note',
  title,
  children,
}: PropsWithChildren<{ type?: CalloutType; title?: string }>) {
  return (
    <aside className={`callout callout-${type}`}>
      <div className="callout-icon">{calloutIcons[type]}</div>
      <div>
        {title ? <p className="callout-title">{title}</p> : null}
        <div className="callout-body">{children}</div>
      </div>
    </aside>
  )
}

export function CodeBlock({
  filename,
  children,
}: PropsWithChildren<{ filename?: string }>) {
  return (
    <figure className="code-frame">
      {filename ? (
        <figcaption>
          <TerminalSquare aria-hidden="true" size={16} />
          <span>{filename}</span>
        </figcaption>
      ) : null}
      <pre>{children}</pre>
    </figure>
  )
}

export function FileTree({ files }: { files: Array<string> }) {
  return (
    <div className="file-tree">
      <div className="file-tree-title">
        <Folder aria-hidden="true" size={16} />
        <span>files</span>
      </div>
      <ul>
        {files.map((file) => (
          <li key={file}>
            <FileText aria-hidden="true" size={15} />
            <code>{file}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StepList({ children }: PropsWithChildren) {
  return (
    <div className="step-list">
      <ListChecks aria-hidden="true" size={20} />
      <div>{children}</div>
    </div>
  )
}

type TinyPathItem = {
  title: string
  body: string
}

export function TinyPath({ items }: { items: Array<TinyPathItem> }) {
  return (
    <div className="tiny-path">
      {items.map((item, index) => (
        <div
          className="tiny-path-item"
          key={item.title}
          style={{ '--i': index } as CSSProperties}
        >
          <span className="tiny-path-number">{index + 1}</span>
          <div>
            <p>{item.title}</p>
            <span>{item.body}</span>
          </div>
          {index < items.length - 1 ? (
            <ArrowRight aria-hidden="true" className="tiny-path-arrow" size={18} />
          ) : null}
        </div>
      ))}
    </div>
  )
}

type OperationTile = {
  op: string
  title: string
  body: string
}

export function OperationTiles({ items }: { items: Array<OperationTile> }) {
  return (
    <div className="operation-tiles">
      {items.map((item) => (
        <div className="operation-tile" key={item.op}>
          <code>{item.op}</code>
          <p>{item.title}</p>
          <span>{item.body}</span>
        </div>
      ))}
    </div>
  )
}

type StackStage = {
  label: string
  a: Array<number | string>
  b?: Array<number | string>
  note?: string
}

export function StackStory({
  stages,
  emptyLabel = 'empty',
}: {
  stages: Array<StackStage>
  emptyLabel?: string
}) {
  return (
    <div className="stack-story" aria-label="push_swap visual story">
      {stages.map((stage, index) => (
        <div
          className="stack-stage"
          key={stage.label}
          style={{ '--i': index } as CSSProperties}
        >
          <p className="stack-stage-label">{stage.label}</p>
          <div className="stack-pair">
            <StackColumn name="a" values={stage.a} emptyLabel={emptyLabel} />
            <StackColumn name="b" values={stage.b ?? []} emptyLabel={emptyLabel} />
          </div>
          {stage.note ? <p className="stack-stage-note">{stage.note}</p> : null}
        </div>
      ))}
    </div>
  )
}

function StackColumn({
  name,
  values,
  emptyLabel,
}: {
  name: string
  values: Array<number | string>
  emptyLabel: string
}) {
  return (
    <div className="stack-column">
      <span>{name}</span>
      <div className="stack-boxes">
        {values.length ? (
          values.map((value, index) => (
            <b key={`${value}-${index}`}>{value}</b>
          ))
        ) : (
          <em>{emptyLabel}</em>
        )}
      </div>
    </div>
  )
}

export function NormNote({
  title = 'Norm note',
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <Callout type="warning" title={title}>
      {children}
    </Callout>
  )
}

export const mdxComponents = {
  Callout,
  CodeBlock,
  FileTree,
  StepList,
  TinyPath,
  OperationTiles,
  StackStory,
  NormNote,
  ProjectLab,
  h2: Heading2,
  h3: Heading3,
}

function Heading2({ children }: PropsWithChildren) {
  return <h2 id={headingId(children)}>{children}</h2>
}

function Heading3({ children }: PropsWithChildren) {
  return <h3 id={headingId(children)}>{children}</h3>
}

function headingId(children: ReactNode) {
  return Children.toArray(children)
    .join(' ')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
