declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { ArticleMeta } from '../lib/content'

  export const meta: ArticleMeta
  const MDXComponent: ComponentType
  export default MDXComponent
}
