import { useServerFn } from '@tanstack/react-start'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { cpp } from '@codemirror/lang-cpp'
import { python } from '@codemirror/lang-python'
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { EditorState } from '@codemirror/state'
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
  CheckCircle2,
  Download,
  Eye,
  FileCode2,
  FileInput,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderTree,
  Play,
  RotateCcw,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { runCode } from '../lib/editor-runner'
import type { StepCheckCase } from '../lib/guided-projects'
import type { Locale } from '../lib/i18n'
import { simulatePushSwapOutput } from '../lib/push-swap-simulator'
import {
  buildTreeRows,
  cloneTemplate,
  getParentFolders,
  makeZip,
  normalizeProjectPath,
  starterInput,
  templates,
  type Language,
  type ProjectFile,
  type ProjectFolder,
  type ProjectTemplate,
  type RunResult,
} from '../lib/editor-workspace'

type WorkspaceCopy = {
  language: string
  project: string
  source: string
  input: string
  output: string
  run: string
  reset: string
  export: string
  addFile: string
  addFolder: string
  loadTemplate: string
  filePrompt: string
  folderPrompt: string
  invalidPath: string
  duplicatePath: string
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
  checkStep: string
  checking: string
  checksPassed: string
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
    addFile: 'File',
    addFolder: 'Folder',
    loadTemplate: '42 tree',
    filePrompt: 'New file path, for example src/check.c',
    folderPrompt: 'New folder path, for example tests',
    invalidPath: 'Use a relative path without spaces, .., or special symbols.',
    duplicatePath: 'That path already exists.',
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
    checkStep: 'Check',
    checking: 'Checking...',
    checksPassed: 'All step checks passed.',
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
    addFile: 'ملف',
    addFolder: 'مجلد',
    loadTemplate: 'شجرة 42',
    filePrompt: 'مسار الملف الجديد، مثلا src/check.c',
    folderPrompt: 'مسار المجلد الجديد، مثلا tests',
    invalidPath: 'استخدم مسارا نسبيا بدون مسافات أو .. أو رموز خاصة.',
    duplicatePath: 'هذا المسار موجود بالفعل.',
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
    checkStep: 'افحص',
    checking: 'جاري الفحص...',
    checksPassed: 'نجحت كل فحوصات الخطوة.',
    checkFailed: 'فشل الفحص',
  },
} satisfies Record<Locale, WorkspaceCopy>

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
      caretColor: '#f4c95d',
      paddingBlock: '0.45rem',
    },
    '.cm-line': {
      paddingInline: '0.55rem',
    },
    '.cm-gutters': {
      backgroundColor: 'color-mix(in oklab, var(--code-bg) 84%, #48b685 16%)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      color: 'rgba(237, 242, 247, 0.48)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(244, 201, 93, 0.08)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(244, 201, 93, 0.1)',
      color: '#f4c95d',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(105, 196, 211, 0.28)',
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

export function CodeWorkspace({
  locale,
  initialLanguage,
  initialTemplate,
  initialStdin,
  workspaceKey,
  allowLanguageSwitch = true,
  labPanel,
  solutionTemplate,
  checkCases = [],
  onChecksComplete,
  codeNotes = [],
  codeLineNotes = [],
  exportFilename,
  toolbarPortalId,
  toolbarStart,
}: CodeWorkspaceProps) {
  const t = workspaceCopy[locale]
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
  const [notice, setNotice] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null)
  const [treeWidth, setTreeWidth] = useState(150)
  const [sideWidth, setSideWidth] = useState(210)
  const [selectedCodeLine, setSelectedCodeLine] = useState<number | null>(null)

  useEffect(() => {
    const project = cloneTemplate(initialTemplate)
    setLanguage(initialLanguage)
    setFiles(project.files)
    setFolders(project.folders)
    setExpandedFolders(getExpandedFolderPaths(project.files, project.folders))
    setActivePath(project.activePath)
    setStdin(initialStdin)
    setResult(null)
    setNotice('')
    setIsDirty(false)
    setSelectedCodeLine(null)
    setIsChecking(false)
  }, [initialLanguage, initialStdin, initialTemplate, workspaceKey])

  useEffect(() => {
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
    setNotice('')
    setIsDirty(false)
    setIsChecking(false)
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
  }

  const selectActivePath = (path: string) => {
    setActivePath(path)
    setSelectedCodeLine(null)
  }

  const addFile = () => {
    const answer = window.prompt(t.filePrompt)
    if (answer === null) return

    try {
      const path = normalizeProjectPath(answer)
      if (files.some((file) => file.path === path)) {
        setNotice(t.duplicatePath)
        return
      }

      setFiles((currentFiles) => [...currentFiles, { path, content: '' }])
      setFolders((currentFolders) => {
        const known = new Set(currentFolders.map((folder) => folder.path))
        const parents = getParentFolders(path).filter((folder) => !known.has(folder))
        return [
          ...currentFolders,
          ...parents.map((folder) => ({ path: folder })),
        ]
      })
      setExpandedFolders((currentFolders) => {
        const nextFolders = new Set(currentFolders)
        for (const parent of getParentFolders(path)) nextFolders.add(parent)
        return nextFolders
      })
      setActivePath(path)
      setNotice('')
      setIsDirty(true)
    } catch {
      setNotice(t.invalidPath)
    }
  }

  const addFolder = () => {
    const answer = window.prompt(t.folderPrompt)
    if (answer === null) return

    try {
      const path = normalizeProjectPath(answer, true)
      if (folders.some((folder) => folder.path === path)) {
        setNotice(t.duplicatePath)
        return
      }

      setFolders((currentFolders) => [...currentFolders, { path }])
      setExpandedFolders((currentFolders) => new Set(currentFolders).add(path))
      setNotice('')
      setIsDirty(true)
    } catch {
      setNotice(t.invalidPath)
    }
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
    const project = cloneTemplate(solutionTemplate)
    setFiles(project.files)
    setFolders(project.folders)
    setExpandedFolders(getExpandedFolderPaths(project.files, project.folders))
    setActivePath(project.activePath)
    setResult(null)
    setNotice('')
    setIsDirty(true)
    setSelectedCodeLine(null)
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
    if (!checkCases.length) return
    setIsChecking(true)
    setResult(null)
    setNotice('')

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
          setNotice(`${t.checkFailed}: ${failure}`)
          return
        }
      }
      setNotice(t.checksPassed)
      onChecksComplete?.()
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
      setIsChecking(false)
    }
  }

  const runCurrentCode = async () => {
    setIsRunning(true)
    setResult(null)
    setNotice('')

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
        const width = Math.round(moveEvent.clientX - bounds.left)
        setTreeWidth(Math.min(Math.max(width, 96), 320))
        return
      }

      const width = Math.round(bounds.right - moveEvent.clientX)
      setSideWidth(Math.min(Math.max(width, 150), 420))
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const adjustEditorPanel = (panel: 'tree' | 'side', amount: number) => {
    if (panel === 'tree') {
      setTreeWidth((width) => Math.min(Math.max(width + amount, 96), 320))
      return
    }

    setSideWidth((width) => Math.min(Math.max(width - amount, 150), 420))
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
        <button
          aria-label={t.addFolder}
          className="editor-button secondary"
          onClick={addFolder}
          title={t.addFolder}
          type="button"
        >
          <FolderPlus aria-hidden="true" size={16} />
          <span>{t.addFolder}</span>
        </button>
        <button
          aria-label={t.addFile}
          className="editor-button secondary"
          onClick={addFile}
          title={t.addFile}
          type="button"
        >
          <FilePlus2 aria-hidden="true" size={16} />
          <span>{t.addFile}</span>
        </button>
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
            aria-label={t.revealSolution}
            className="editor-button secondary"
            onClick={revealSolution}
            title={t.revealSolution}
            type="button"
          >
            <Eye aria-hidden="true" size={16} />
            <span>{t.revealSolution}</span>
          </button>
        ) : null}
        {checkCases.length ? (
          <button
            aria-label={isChecking ? t.checking : t.checkStep}
            className="editor-button primary"
            disabled={isRunning || isChecking}
            onClick={runCheckCases}
            title={isChecking ? t.checking : t.checkStep}
            type="button"
          >
            <CheckCircle2 aria-hidden="true" size={16} />
            <span>{isChecking ? t.checking : t.checkStep}</span>
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
      {toolbarTarget ? createPortal(toolbar, toolbarTarget) : toolbar}

      {labPanel}
      {notice ? <p className="editor-notice">{notice}</p> : null}

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

              return (
                <button
                  key={`${row.kind}:${row.path}`}
                  aria-expanded={isFolder ? isExpanded : undefined}
                  className={`tree-row ${row.kind} ${row.path === activePath ? 'is-active' : ''}`}
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
                </button>
              )
            })}
          </div>
        </aside>

        <div
          aria-label="Resize file tree"
          aria-orientation="vertical"
          className="editor-resizer"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') adjustEditorPanel('tree', -16)
            if (event.key === 'ArrowRight') adjustEditorPanel('tree', 16)
          }}
          onPointerDown={(event) => resizeEditorPanel('tree', event)}
          role="separator"
          tabIndex={0}
        />

        <div className="editor-panel code-panel">
          <span className="editor-panel-title source-title">
            <Code2 aria-hidden="true" size={18} />
            <span>{activeFile?.path ?? t.source}</span>
            <strong className={`workspace-state ${isDirty ? 'is-dirty' : ''}`}>
              {isDirty ? t.edited : t.checkpoint}
            </strong>
          </span>
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
          className="editor-resizer"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') adjustEditorPanel('side', -16)
            if (event.key === 'ArrowRight') adjustEditorPanel('side', 16)
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
}

function CodeEditor({
  language,
  onLineSelect,
  value,
  onChange,
}: {
  language: Language
  onLineSelect?: (line: number) => void
  value: string
  onChange: (value: string) => void
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

  useEffect(() => {
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
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
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
            onChangeRef.current(nextValue)
          }),
          EditorView.updateListener.of((update) => {
            if (!update.selectionSet) return
            const line = update.state.doc.lineAt(update.state.selection.main.head)
            onLineSelectRef.current?.(line.number)
          }),
        ],
      }),
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [language])

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
