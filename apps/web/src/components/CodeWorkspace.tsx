import { useServerFn } from '@tanstack/react-start'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { cpp } from '@codemirror/lang-cpp'
import { python } from '@codemirror/lang-python'
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { tags } from '@lezer/highlight'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import {
  Code2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileCode2,
  FileInput,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  Play,
  RotateCcw,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { toast as heroToast } from '@heroui/react'
import { runCode } from '../lib/editor-runner'
import type { StepCheckCase } from '../lib/guided-projects'
import type { Locale } from '../lib/i18n'
import { simulatePushSwapOutput } from '../lib/push-swap-simulator'
import {
  buildTreeRows,
  cloneTemplate,
  getParentFolders,
  makeZip,
  starterInput,
  templates,
  type Language,
  type ProjectFile,
  type ProjectFolder,
  type ProjectTemplate,
  type RunResult,
} from '../lib/editor-workspace'

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

type WorkspaceCopy = {
  language: string
  project: string
  source: string
  input: string
  output: string
  run: string
  reset: string
  export: string
  loadTemplate: string
  ready: string
  running: string
  success: string
  compile_error: string
  runtime_error: string
  timeout: string
  error: string
  hint: string
  python: string
  c: string
  files: string
  checkpoint: string
  edited: string
  codeHelp: string
  codeHelpEmpty: string
  codeHelpMissing: string
  line: string
  revealSolution: string
  hideSolution: string
  solution: string
  solutionMissing: string
  solutionUnchanged: string
  requiredFile: string
  editedFile: string
  solutionViewed: string
  checking: string
  checkFailed: string
}

const workspaceCopy = {
  en: {
    language: 'Language',
    project: 'Project',
    source: 'Source',
    input: 'stdin',
    output: 'Output',
    run: 'Run',
    reset: 'Reset',
    export: 'Export',
    loadTemplate: '42 tree',
    ready: 'Run your project to see output here.',
    running: 'Running...',
    success: 'Finished successfully',
    compile_error: 'Compile error',
    runtime_error: 'Runtime error',
    timeout: 'Timed out',
    error: 'Runner error',
    hint: 'C compiles every .c file with includes/ on the include path. Local runs are capped at 4 seconds.',
    python: 'Python',
    c: 'C',
    files: 'files',
    checkpoint: 'checkpoint',
    edited: 'edited',
    codeHelp: 'Code help',
    codeHelpEmpty: 'Click a line in the code to explain the nearest block.',
    codeHelpMissing: 'No line help for this line yet.',
    line: 'line',
    revealSolution: 'Reveal',
    hideSolution: 'Hide',
    solution: 'Solution',
    solutionMissing: 'No solution is available for this file.',
    solutionUnchanged: 'No solution changes for this file.',
    requiredFile: 'To edit',
    editedFile: 'Edited',
    solutionViewed: 'Solution viewed',
    checking: 'Checking...',
    checkFailed: 'Check failed',
  },
  ar: {
    language: 'اللغة',
    project: 'المشروع',
    source: 'الكود',
    input: 'stdin',
    output: 'النتيجة',
    run: 'تشغيل',
    reset: 'إعادة',
    export: 'تصدير',
    loadTemplate: 'شجرة 42',
    ready: 'شغل المشروع لتظهر النتيجة هنا.',
    running: 'جاري التشغيل...',
    success: 'انتهى بنجاح',
    compile_error: 'خطأ في الترجمة',
    runtime_error: 'خطأ أثناء التشغيل',
    timeout: 'انتهى الوقت',
    error: 'خطأ في المشغل',
    hint: 'تشغيل C يترجم كل ملفات .c مع includes/ ضمن مسار الـ include. التشغيل المحلي محدود بأربع ثوان.',
    python: 'Python',
    c: 'C',
    files: 'ملفات',
    checkpoint: 'نقطة جاهزة',
    edited: 'تم التعديل',
    codeHelp: 'شرح الكود',
    codeHelpEmpty: 'اضغط على سطر في الكود لشرح أقرب جزء.',
    codeHelpMissing: 'لا يوجد شرح لهذا السطر حتى الآن.',
    line: 'سطر',
    revealSolution: 'الحل',
    hideSolution: 'إخفاء',
    solution: 'الحل',
    solutionMissing: 'لا يوجد حل لهذا الملف.',
    solutionUnchanged: 'لا توجد تغييرات حل لهذا الملف.',
    requiredFile: 'للتعديل',
    editedFile: 'تم تعديله',
    solutionViewed: 'تم عرض الحل',
    checking: 'جاري الفحص...',
    checkFailed: 'فشل الفحص',
  },
} satisfies Record<Locale, WorkspaceCopy>

const TREE_PANEL_MIN = 210
const TREE_PANEL_DEFAULT = 240
const TREE_PANEL_MAX = 380
const SIDE_PANEL_MIN = 300
const SIDE_PANEL_DEFAULT = 360
const SIDE_PANEL_MAX = 560
const SOLUTION_PANEL_MIN = 120
const SOLUTION_PANEL_DEFAULT = 240
const SOLUTION_PANEL_MAX = 520
const verticalResizerClassName =
  'editor-resizer w-1.5 shrink-0 cursor-col-resize bg-[color-mix(in_oklab,var(--line)_70%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--control-bg)]'
const horizontalResizerClassName =
  'solution-resizer h-1.5 shrink-0 cursor-row-resize bg-[color-mix(in_oklab,var(--line)_70%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--control-bg)]'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export type CodeNote = {
  path: string
  start: number
  end: number
  title: string
  body: string
}

export type CodeLineNote = {
  path: string
  line: number
  title: string
  body: string
}

function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, '\n').trim()
}

function getExpandedFolderPaths(
  files: Array<ProjectFile>,
  folders: Array<ProjectFolder>,
) {
  const paths = new Set(folders.map((folder) => folder.path))

  for (const file of files) {
    for (const parent of getParentFolders(file.path)) paths.add(parent)
  }

  return paths
}

const codeHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: 'var(--code-token-comment)' },
  { tag: tags.string, color: 'var(--code-token-string)' },
  { tag: tags.number, color: 'var(--code-token-number)' },
  { tag: tags.keyword, color: 'var(--code-token-keyword)' },
  { tag: tags.controlKeyword, color: 'var(--code-token-keyword)' },
  { tag: tags.typeName, color: 'var(--code-token-type)' },
  { tag: tags.standard(tags.typeName), color: 'var(--code-token-type)' },
  { tag: tags.function(tags.variableName), color: 'var(--code-token-function)' },
  { tag: tags.definition(tags.function(tags.variableName)), color: 'var(--code-token-function)' },
  { tag: tags.variableName, color: 'var(--code-token-variable)' },
  { tag: tags.operator, color: 'var(--code-token-operator)' },
])

const codeEditorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      backgroundColor: 'var(--code-bg)',
      color: 'var(--code-text)',
      fontSize: '0.84rem',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      lineHeight: '1.45',
    },
    '.cm-content': {
      caretColor: 'var(--code-caret)',
      paddingBlock: '0.45rem',
    },
    '.cm-line': {
      paddingInline: '0.55rem',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--code-gutter-bg)',
      borderRight: '1px solid var(--code-gutter-border)',
      color: 'var(--code-gutter-text)',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--code-active-line)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--code-active-gutter)',
      color: 'var(--code-caret)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--code-selection)',
    },
  },
  { dark: true },
)

export type CodeWorkspaceProps = {
  locale: Locale
  initialLanguage: Language
  initialTemplate: ProjectTemplate
  initialStdin: string
  workspaceKey?: string
  allowLanguageSwitch?: boolean
  filesToEdit?: Array<string>
  labPanel?: ReactNode
  solutionTemplate?: ProjectTemplate
  checkCases?: Array<StepCheckCase>
  onChecksComplete?: () => void
  codeNotes?: Array<CodeNote>
  codeLineNotes?: Array<CodeLineNote>
  exportFilename?: string
  toolbarPortalId?: string
  toolbarStart?: ReactNode
}

export type CodeWorkspaceHandle = {
  runChecks: () => Promise<boolean>
}

export const CodeWorkspace = forwardRef<CodeWorkspaceHandle, CodeWorkspaceProps>(function CodeWorkspace({
  locale,
  initialLanguage,
  initialTemplate,
  initialStdin,
  workspaceKey,
  allowLanguageSwitch = true,
  filesToEdit = [],
  labPanel,
  solutionTemplate,
  checkCases = [],
  onChecksComplete,
  codeNotes = [],
  codeLineNotes = [],
  exportFilename,
  toolbarPortalId,
  toolbarStart,
}: CodeWorkspaceProps, ref) {
  const t = workspaceCopy[locale]
  const isRtl = locale === 'ar'
  const execute = useServerFn(runCode)
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [files, setFiles] = useState<Array<ProjectFile>>(
    cloneTemplate(initialTemplate).files,
  )
  const [folders, setFolders] = useState<Array<ProjectFolder>>(
    cloneTemplate(initialTemplate).folders,
  )
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() =>
    getExpandedFolderPaths(initialTemplate.files, initialTemplate.folders),
  )
  const [activePath, setActivePath] = useState(initialTemplate.activePath)
  const [stdin, setStdin] = useState(initialStdin)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const toastKeyRef = useRef<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined' || !toolbarPortalId) return null
    return document.getElementById(toolbarPortalId)
  })
  const [isSolutionVisible, setIsSolutionVisible] = useState(false)
  const [editedFilePaths, setEditedFilePaths] = useState<Set<string>>(() => new Set())
  const [revealedSolutionPaths, setRevealedSolutionPaths] = useState<Set<string>>(
    () => new Set(),
  )
  const [solutionPanelHeight, setSolutionPanelHeight] = useState(SOLUTION_PANEL_DEFAULT)
  const [treeWidth, setTreeWidth] = useState(TREE_PANEL_DEFAULT)
  const [sideWidth, setSideWidth] = useState(SIDE_PANEL_DEFAULT)
  const [selectedCodeLine, setSelectedCodeLine] = useState<number | null>(null)

  const clearToast = () => {
    if (!toastKeyRef.current) return
    heroToast.close(toastKeyRef.current)
    toastKeyRef.current = null
  }

  const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info') => {
    clearToast()
    const options = { timeout: 4500 }
    toastKeyRef.current =
      tone === 'success'
        ? heroToast.success(message, options)
        : tone === 'error'
          ? heroToast.danger(message, options)
          : heroToast.info(message, options)
  }

  useEffect(() => () => clearToast(), [])

  useIsomorphicLayoutEffect(() => {
    const project = cloneTemplate(initialTemplate)
    setLanguage(initialLanguage)
    setFiles(project.files)
    setFolders(project.folders)
    setExpandedFolders(getExpandedFolderPaths(project.files, project.folders))
    setActivePath(project.activePath)
    setStdin(initialStdin)
    setResult(null)
    clearToast()
    setIsDirty(false)
    setSelectedCodeLine(null)
    setIsChecking(false)
    setIsSolutionVisible(false)
    setEditedFilePaths(new Set())
    setRevealedSolutionPaths(new Set())
    setSolutionPanelHeight(SOLUTION_PANEL_DEFAULT)
  }, [initialLanguage, initialStdin, initialTemplate, workspaceKey])

  useIsomorphicLayoutEffect(() => {
    if (!toolbarPortalId) {
      setToolbarTarget(null)
      return
    }

    setToolbarTarget(document.getElementById(toolbarPortalId))
  }, [toolbarPortalId])

  const treeRows = useMemo(() => buildTreeRows(files, folders), [files, folders])
  const visibleTreeRows = useMemo(
    () =>
      treeRows.filter((row) =>
        getParentFolders(row.path).every((parent) => expandedFolders.has(parent)),
      ),
    [expandedFolders, treeRows],
  )
  const activeFile = files.find((file) => file.path === activePath) ?? files[0]
  const activeSolutionFile = useMemo(() => {
    if (!solutionTemplate || !activeFile) return null
    return (
      solutionTemplate.files.find((file) => file.path === activeFile.path) ?? null
    )
  }, [activeFile, solutionTemplate])
  const activeStarterFile = useMemo(() => {
    if (!activeFile) return null
    return initialTemplate.files.find((file) => file.path === activeFile.path) ?? null
  }, [activeFile, initialTemplate])
  const activeSolutionDiffers =
    !!activeSolutionFile &&
    activeSolutionFile.content !== (activeStarterFile?.content ?? '')
  const requiredFilePaths = useMemo(() => new Set(filesToEdit), [filesToEdit])

  useEffect(() => {
    if (!isSolutionVisible || !activeSolutionFile || !activeSolutionDiffers) return
    setRevealedSolutionPaths((currentPaths) => {
      if (currentPaths.has(activeSolutionFile.path)) return currentPaths
      return new Set(currentPaths).add(activeSolutionFile.path)
    })
  }, [activeSolutionDiffers, activeSolutionFile, isSolutionVisible])
  const activeCodeNote = useMemo(() => {
    if (!activeFile || selectedCodeLine === null) return null
    return (
      codeNotes.find(
        (note) =>
          note.path === activeFile.path &&
          selectedCodeLine >= note.start &&
          selectedCodeLine <= note.end,
      ) ?? null
    )
  }, [activeFile, codeNotes, selectedCodeLine])
  const activeCodeLineNote = useMemo(() => {
    if (!activeFile || selectedCodeLine === null) return null
    return (
      codeLineNotes.find(
        (note) => note.path === activeFile.path && note.line === selectedCodeLine,
      ) ?? null
    )
  }, [activeFile, codeLineNotes, selectedCodeLine])
  const selectedLineIsFunctionStart =
    selectedCodeLine !== null && activeCodeNote?.start === selectedCodeLine
  const shownCodeHelp =
    selectedCodeLine === null || selectedLineIsFunctionStart
      ? activeCodeNote
      : activeCodeLineNote
  const hasSelectedLineWithoutHelp =
    selectedCodeLine !== null && !selectedLineIsFunctionStart && !activeCodeLineNote
  const statusText = useMemo(() => {
    if (isChecking) return t.checking
    if (isRunning) return t.running
    if (!result) return t.ready
    return t[result.status]
  }, [isChecking, isRunning, result, t])

  const resetWorkspace = (nextLanguage = language) => {
    const project =
      allowLanguageSwitch && nextLanguage in templates
        ? cloneTemplate(templates[nextLanguage])
        : cloneTemplate(initialTemplate)

    setLanguage(nextLanguage)
    setFiles(project.files)
    setFolders(project.folders)
    setExpandedFolders(getExpandedFolderPaths(project.files, project.folders))
    setActivePath(project.activePath)
    setStdin(allowLanguageSwitch ? starterInput[nextLanguage] : initialStdin)
    setResult(null)
    clearToast()
    setIsDirty(false)
    setIsChecking(false)
    setIsSolutionVisible(false)
    setEditedFilePaths(new Set())
    setRevealedSolutionPaths(new Set())
    setSolutionPanelHeight(SOLUTION_PANEL_DEFAULT)
  }

  const updateLanguage = (nextLanguage: Language) => {
    resetWorkspace(nextLanguage)
  }

  const updateActiveContent = (content: string) => {
    if (!activeFile) return
    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.path === activeFile.path ? { ...file, content } : file,
      ),
    )
    setIsDirty(true)
    setEditedFilePaths((currentPaths) => {
      const nextPaths = new Set(currentPaths)
      const starterContent =
        initialTemplate.files.find((file) => file.path === activeFile.path)?.content ??
        ''
      if (content === starterContent) nextPaths.delete(activeFile.path)
      else nextPaths.add(activeFile.path)
      return nextPaths
    })
  }

  const selectActivePath = (path: string) => {
    setActivePath(path)
    setSelectedCodeLine(null)
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((currentFolders) => {
      const nextFolders = new Set(currentFolders)
      if (nextFolders.has(path)) nextFolders.delete(path)
      else nextFolders.add(path)
      return nextFolders
    })
  }

  const exportProject = () => {
    const blob = makeZip(files, folders)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download =
      exportFilename ??
      (language === 'c' ? 'push_swap-workspace.zip' : 'python-workspace.zip')
    link.click()
    URL.revokeObjectURL(url)
  }

  const revealSolution = () => {
    if (!solutionTemplate) return
    const nextIsVisible = !isSolutionVisible
    setIsSolutionVisible(nextIsVisible)
    if (nextIsVisible && activeSolutionFile && activeSolutionDiffers) {
      setRevealedSolutionPaths((currentPaths) =>
        new Set(currentPaths).add(activeSolutionFile.path),
      )
    }
  }

  const evaluateCheckCase = (checkCase: StepCheckCase, nextResult: RunResult) => {
    const combinedOutput = `${nextResult.stdout}${nextResult.stderr ? `${nextResult.stdout ? '\n' : ''}${nextResult.stderr}` : ''}`
    const normalizedOutput = normalizeOutput(combinedOutput)
    const expectedOutput = normalizeOutput(checkCase.expectedOutput ?? '')

    if (checkCase.expectedStatus && nextResult.status !== checkCase.expectedStatus) {
      return `${checkCase.label}: expected ${checkCase.expectedStatus}, got ${nextResult.status}.`
    }

    if (checkCase.mode === 'no-output') {
      if (nextResult.status !== 'success') {
        return `${checkCase.label}: expected success, got ${nextResult.status}.`
      }
      if (normalizedOutput) return `${checkCase.label}: expected no output, got ${normalizedOutput}.`
      return ''
    }

    if (checkCase.mode === 'exact-output') {
      if (nextResult.status !== 'success') {
        return `${checkCase.label}: expected success, got ${nextResult.status}.`
      }
      if (normalizedOutput !== expectedOutput) {
        return `${checkCase.label}: expected ${expectedOutput || '(no output)'}, got ${normalizedOutput || '(no output)'}.`
      }
      return ''
    }

    if (checkCase.mode === 'error-output') {
      if (nextResult.status === 'compile_error' || nextResult.status === 'timeout') {
        return `${checkCase.label}: expected Error output, got ${nextResult.status}.`
      }
      if (normalizedOutput !== (expectedOutput || 'Error')) {
        return `${checkCase.label}: expected Error, got ${normalizedOutput || '(no output)'}.`
      }
      return ''
    }

    if (nextResult.status !== 'success') {
      return `${checkCase.label}: expected sortable output, got ${nextResult.status}.`
    }
    const simulation = simulatePushSwapOutput({
      input: checkCase.stdin,
      output: nextResult.stdout,
      maxMoves: checkCase.maxMoves,
    })
    return simulation.ok ? '' : `${checkCase.label}: ${simulation.message}`
  }

  const runCheckCases = async () => {
    if (!checkCases.length) return true
    if (isRunning || isChecking) return false
    setIsChecking(true)
    setResult(null)
    clearToast()

    try {
      for (const checkCase of checkCases) {
        const nextResult = await execute({
          data: {
            language,
            files,
            activePath: activeFile?.path ?? activePath,
            stdin: checkCase.stdin,
          },
        })
        setResult(nextResult)
        const failure = evaluateCheckCase(checkCase, nextResult)
        if (failure) {
          showToast(`${t.checkFailed}: ${failure}`, 'error')
          return false
        }
      }
      onChecksComplete?.()
      return true
    } catch (error) {
      setResult({
        ok: false,
        status: 'error',
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown runner error.',
        exitCode: null,
        durationMs: 0,
        command: language,
      })
      return false
    } finally {
      setIsChecking(false)
    }
  }

  useImperativeHandle(ref, () => ({ runChecks: runCheckCases }))

  const runCurrentCode = async () => {
    setIsRunning(true)
    setResult(null)
    clearToast()

    try {
      const nextResult = await execute({
        data: {
          language,
          files,
          activePath: activeFile?.path ?? activePath,
          stdin,
        },
      })
      setResult(nextResult)
    } catch (error) {
      setResult({
        ok: false,
        status: 'error',
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown runner error.',
        exitCode: null,
        durationMs: 0,
        command: language,
      })
    } finally {
      setIsRunning(false)
    }
  }

  const resizeEditorPanel = (
    panel: 'tree' | 'side',
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const grid = event.currentTarget.parentElement
    if (!grid) return

    event.preventDefault()
    const bounds = grid.getBoundingClientRect()
    const pointerId = event.pointerId
    event.currentTarget.setPointerCapture(pointerId)

    const onMove = (moveEvent: PointerEvent) => {
      if (panel === 'tree') {
        const width = Math.round(
          isRtl
            ? bounds.right - moveEvent.clientX
            : moveEvent.clientX - bounds.left,
        )
        setTreeWidth(clamp(width, TREE_PANEL_MIN, TREE_PANEL_MAX))
        return
      }

      const width = Math.round(
        isRtl
          ? moveEvent.clientX - bounds.left
          : bounds.right - moveEvent.clientX,
      )
      setSideWidth(clamp(width, SIDE_PANEL_MIN, SIDE_PANEL_MAX))
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const resizeSolutionPanel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = event.currentTarget.parentElement
    if (!container) return

    event.preventDefault()
    const solutionPanel = event.currentTarget.previousElementSibling as HTMLElement | null
    const startY = event.clientY
    const startHeight =
      solutionPanel?.getBoundingClientRect().height ?? solutionPanelHeight
    const pointerId = event.pointerId
    event.currentTarget.setPointerCapture(pointerId)

    const onMove = (moveEvent: PointerEvent) => {
      const bounds = container.getBoundingClientRect()
      const height = Math.round(startHeight + moveEvent.clientY - startY)
      const maxHeight = Math.min(
        SOLUTION_PANEL_MAX,
        Math.max(SOLUTION_PANEL_MIN, bounds.height - 180),
      )
      setSolutionPanelHeight(clamp(height, SOLUTION_PANEL_MIN, maxHeight))
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const adjustEditorPanel = (panel: 'tree' | 'side', widthDelta: number) => {
    if (panel === 'tree') {
      setTreeWidth((width) => clamp(width + widthDelta, TREE_PANEL_MIN, TREE_PANEL_MAX))
      return
    }

    setSideWidth((width) => clamp(width + widthDelta, SIDE_PANEL_MIN, SIDE_PANEL_MAX))
  }

  const adjustEditorPanelForKey = (panel: 'tree' | 'side', physicalDelta: number) => {
    if (panel === 'tree') {
      adjustEditorPanel(panel, isRtl ? -physicalDelta : physicalDelta)
      return
    }

    adjustEditorPanel(panel, isRtl ? physicalDelta : -physicalDelta)
  }

  const adjustSolutionPanelForKey = (heightDelta: number) => {
    setSolutionPanelHeight((height) =>
      clamp(height + heightDelta, SOLUTION_PANEL_MIN, SOLUTION_PANEL_MAX),
    )
  }

  const toolbar = (
    <div className="editor-toolbar">
      <div className="editor-toolbar-start">
        {toolbarStart}
        {allowLanguageSwitch ? (
          <div className="editor-language" aria-label={t.language}>
            <>
              <button
                className={language === 'python' ? 'is-active' : undefined}
                onClick={() => updateLanguage('python')}
                type="button"
              >
                {t.python}
              </button>
              <button
                className={language === 'c' ? 'is-active' : undefined}
                onClick={() => updateLanguage('c')}
                type="button"
              >
                {t.c}
              </button>
            </>
          </div>
        ) : null}
      </div>

      <div className="editor-actions">
        {allowLanguageSwitch ? (
          <button
            aria-label={t.loadTemplate}
            className="editor-button secondary"
            onClick={() => resetWorkspace('c')}
            title={t.loadTemplate}
            type="button"
          >
            <Sparkles aria-hidden="true" size={16} />
            <span>{t.loadTemplate}</span>
          </button>
        ) : null}
        <button
          aria-label={t.reset}
          className="editor-button secondary"
          onClick={() => resetWorkspace()}
          title={t.reset}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={16} />
          <span>{t.reset}</span>
        </button>
        <button
          aria-label={t.export}
          className="editor-button export"
          onClick={exportProject}
          title={t.export}
          type="button"
        >
          <Download aria-hidden="true" size={16} />
          <span>{t.export}</span>
        </button>
        {solutionTemplate ? (
          <button
            aria-label={isSolutionVisible ? t.hideSolution : t.revealSolution}
            className="editor-button secondary"
            onClick={revealSolution}
            title={isSolutionVisible ? t.hideSolution : t.revealSolution}
            type="button"
          >
            <Eye aria-hidden="true" size={16} />
            <span>{isSolutionVisible ? t.hideSolution : t.revealSolution}</span>
          </button>
        ) : null}
        <button
          aria-label={isRunning ? t.running : t.run}
          className="editor-button primary"
          disabled={isRunning || isChecking}
          onClick={runCurrentCode}
          title={isRunning ? t.running : t.run}
          type="button"
        >
          <Play aria-hidden="true" size={16} />
          <span>{isRunning ? t.running : t.run}</span>
        </button>
      </div>
    </div>
  )

  return (
    <section className="editor-workspace" aria-label={t.project}>
      {toolbarPortalId
        ? toolbarTarget
          ? createPortal(toolbar, toolbarTarget)
          : null
        : toolbar}

      {labPanel}

      <div
        className="editor-grid"
        style={
          {
            '--tree-width': `${treeWidth}px`,
            '--side-width': `${sideWidth}px`,
          } as CSSProperties
        }
      >
        <aside className="editor-tree" aria-label={t.project}>
          <div className="editor-panel-title tree-title">
            <FolderTree aria-hidden="true" size={18} />
            <span>{t.project}</span>
            <strong>
              {files.length} {t.files}
            </strong>
          </div>
          <div className="tree-list">
            {visibleTreeRows.map((row) => {
              const isFolder = row.kind === 'folder'
              const isExpanded = isFolder && expandedFolders.has(row.path)
              const isRequired = !isFolder && requiredFilePaths.has(row.path)
              const isEdited = !isFolder && editedFilePaths.has(row.path)
              const isSolutionRevealed =
                !isFolder && revealedSolutionPaths.has(row.path)

              return (
                <button
                  key={`${row.kind}:${row.path}`}
                  aria-expanded={isFolder ? isExpanded : undefined}
                  className={[
                    'tree-row',
                    row.kind,
                    row.path === activePath ? 'is-active' : '',
                    isRequired ? 'is-required' : '',
                    isEdited ? 'is-edited' : '',
                    isSolutionRevealed ? 'has-solution' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    if (isFolder) toggleFolder(row.path)
                    else selectActivePath(row.path)
                  }}
                  style={{ '--depth': row.depth } as CSSProperties}
                  title={row.path}
                  type="button"
                >
                  {isFolder ? (
                    <>
                      {isExpanded ? (
                        <ChevronDown
                          aria-hidden="true"
                          className="tree-row-chevron"
                          size={14}
                        />
                      ) : (
                        <ChevronRight
                          aria-hidden="true"
                          className="tree-row-chevron"
                          size={14}
                        />
                      )}
                      {isExpanded ? (
                        <FolderOpen aria-hidden="true" size={16} />
                      ) : (
                        <Folder aria-hidden="true" size={16} />
                      )}
                    </>
                  ) : row.path.endsWith('.c') || row.path.endsWith('.h') ? (
                    <>
                      <span aria-hidden="true" className="tree-row-chevron" />
                      <FileCode2 aria-hidden="true" size={16} />
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true" className="tree-row-chevron" />
                      <FileText aria-hidden="true" size={16} />
                    </>
                  )}
                  <span>{row.name}</span>
                  {!isFolder ? (
                    <span className="tree-row-badges" aria-hidden="true">
                      {isRequired ? (
                        <span className="tree-row-badge required" title={t.requiredFile}>
                          T
                        </span>
                      ) : null}
                      {isEdited ? (
                        <span className="tree-row-badge edited" title={t.editedFile}>
                          E
                        </span>
                      ) : null}
                      {isSolutionRevealed ? (
                        <span
                          className="tree-row-badge solution"
                          title={t.solutionViewed}
                        >
                          S
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </aside>

        <div
          aria-label="Resize file tree"
          aria-orientation="vertical"
          className={verticalResizerClassName}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              adjustEditorPanelForKey('tree', -16)
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              adjustEditorPanelForKey('tree', 16)
            }
          }}
          onPointerDown={(event) => resizeEditorPanel('tree', event)}
          role="separator"
          tabIndex={0}
        />

        <div className="editor-panel code-panel">
          <span className="editor-panel-title source-title">
            <Code2 aria-hidden="true" size={18} />
            <span>{activeFile?.path ?? t.source}</span>
            <strong
              className={`workspace-state ${isDirty ? 'is-dirty' : ''}`}
            >
              {isDirty ? t.edited : t.checkpoint}
            </strong>
          </span>
          {isSolutionVisible ? (
            <section
              className="solution-reference"
              aria-label={t.solution}
              style={{ '--solution-height': `${solutionPanelHeight}px` } as CSSProperties}
            >
              <div className="solution-reference-title">
                <Eye aria-hidden="true" size={15} />
                <strong>{t.solution}</strong>
                <span>{activeFile?.path ?? t.source}</span>
              </div>
              {activeSolutionFile ? (
                activeSolutionDiffers ? (
                  <CodeEditor
                    language={language}
                    readOnly
                    value={activeSolutionFile.content}
                  />
                ) : (
                  <p>{t.solutionUnchanged}</p>
                )
              ) : (
                <p>{t.solutionMissing}</p>
              )}
            </section>
          ) : null}
          {isSolutionVisible ? (
            <div
              aria-label="Resize solution reference"
              aria-orientation="horizontal"
              className={horizontalResizerClassName}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  adjustSolutionPanelForKey(-16)
                }
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  adjustSolutionPanelForKey(16)
                }
              }}
              onPointerDown={resizeSolutionPanel}
              role="separator"
              tabIndex={0}
            />
          ) : null}
          <CodeEditor
            language={language}
            onLineSelect={setSelectedCodeLine}
            value={activeFile?.content ?? ''}
            onChange={updateActiveContent}
          />
        </div>

        <div
          aria-label="Resize output panel"
          aria-orientation="vertical"
          className={verticalResizerClassName}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              adjustEditorPanelForKey('side', -16)
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              adjustEditorPanelForKey('side', 16)
            }
          }}
          onPointerDown={(event) => resizeEditorPanel('side', event)}
          role="separator"
          tabIndex={0}
        />

        <div className="editor-side">
          <section className="editor-panel code-help-panel">
            <span className="editor-panel-title">
              <Code2 aria-hidden="true" size={18} />
              {t.codeHelp}
              {selectedCodeLine !== null ? (
                <strong>
                  {t.line} {selectedCodeLine}
                </strong>
              ) : null}
            </span>
            {shownCodeHelp ? (
              <div className="code-help-body">
                <h3>{shownCodeHelp.title}</h3>
                <p>{shownCodeHelp.body}</p>
              </div>
            ) : hasSelectedLineWithoutHelp ? (
              <p className="code-help-empty">{t.codeHelpMissing}</p>
            ) : (
              <p className="code-help-empty">{t.codeHelpEmpty}</p>
            )}
          </section>

          <label className="editor-panel input-panel">
            <span className="editor-panel-title">
              <FileInput aria-hidden="true" size={18} />
              {t.input}
            </span>
            <textarea
              spellCheck={false}
              value={stdin}
              onChange={(event) => {
                setStdin(event.target.value)
                setIsDirty(true)
              }}
              dir="ltr"
            />
          </label>

          <section
            className={`editor-panel output-panel status-${result?.status ?? 'idle'}`}
            aria-live="polite"
          >
            <span className="editor-panel-title">
              <TerminalSquare aria-hidden="true" size={18} />
              {t.output}
            </span>
            <div className="output-status">
              <strong>{statusText}</strong>
              {result ? (
                <span>
                  {result.exitCode === null ? '-' : `exit ${result.exitCode}`} |{' '}
                  {result.durationMs}ms
                </span>
              ) : null}
            </div>
            {result ? (
              <div className="output-streams" dir="ltr">
                <pre>
                  <code>
                    {result.stdout || result.stderr
                      ? `${result.stdout}${result.stderr ? `${result.stdout ? '\n' : ''}${result.stderr}` : ''}`
                      : '(no output)'}
                  </code>
                </pre>
              </div>
            ) : (
              <p className="output-empty">{t.hint}</p>
            )}
          </section>
        </div>
      </div>
    </section>
  )
})

function CodeEditor({
  language,
  onLineSelect,
  readOnly = false,
  value,
  onChange,
}: {
  language: Language
  onLineSelect?: (line: number) => void
  readOnly?: boolean
  value: string
  onChange?: (value: string) => void
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onLineSelectRef = useRef(onLineSelect)
  const valueRef = useRef(value)
  const applyingExternalValueRef = useRef(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onLineSelectRef.current = onLineSelect
  }, [onLineSelect])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useIsomorphicLayoutEffect(() => {
    if (!hostRef.current) return

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: valueRef.current,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(codeHighlightStyle, { fallback: true }),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
          language === 'python' ? python() : cpp(),
          codeEditorTheme,
          EditorView.domEventHandlers({
            click: (event, view) => {
              const position = view.posAtCoords({
                x: event.clientX,
                y: event.clientY,
              })
              if (position === null) return false
              onLineSelectRef.current?.(view.state.doc.lineAt(position).number)
              return false
            },
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged || applyingExternalValueRef.current) return
            const nextValue = update.state.doc.toString()
            valueRef.current = nextValue
            onChangeRef.current?.(nextValue)
          }),
          EditorView.updateListener.of((update) => {
            if (!update.selectionSet) return
            const line = update.state.doc.lineAt(update.state.selection.main.head)
            onLineSelectRef.current?.(line.number)
          }),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
        ],
      }),
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [language, readOnly])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (value === currentValue) return

    applyingExternalValueRef.current = true
    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    })
    applyingExternalValueRef.current = false
  }, [value])

  return <div className="code-editor" dir="ltr" ref={hostRef} />
}
