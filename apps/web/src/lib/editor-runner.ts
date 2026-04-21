import { createServerFn } from '@tanstack/react-start'
import {
  COMPILE_TIMEOUT_MS,
  RUN_TIMEOUT_MS,
  limitOutput,
  validateRunInput,
  type ProcessResult,
  type RunResult,
  type RunStatus,
} from './editor-workspace'

async function runProcess({
  command,
  args,
  cwd,
  stdin,
  timeoutMs,
}: {
  command: string
  args: Array<string>
  cwd: string
  stdin: string
  timeoutMs: number
}): Promise<ProcessResult> {
  const { spawn } = await import('node:child_process')

  return new Promise((resolve) => {
    const startedAt = Date.now()
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let settled = false

    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    const finish = (exitCode: number | null, extraError = '') => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({
        stdout: limitOutput(stdout),
        stderr: limitOutput(extraError ? `${stderr}${extraError}` : stderr),
        exitCode,
        timedOut,
        durationMs: Date.now() - startedAt,
      })
    }

    child.stdout.on('data', (chunk) => {
      stdout = limitOutput(stdout + chunk.toString())
    })

    child.stderr.on('data', (chunk) => {
      stderr = limitOutput(stderr + chunk.toString())
    })

    child.on('error', (error) => {
      finish(null, error.message)
    })

    child.on('close', (code) => {
      finish(code)
    })

    child.stdin.end(stdin)
  })
}

function resultFromProcess({
  process,
  command,
  compile,
}: {
  process: ProcessResult
  command: string
  compile?: boolean
}): RunResult {
  const status: RunStatus = process.timedOut
    ? 'timeout'
    : process.exitCode === 0
      ? 'success'
      : compile
        ? 'compile_error'
        : 'runtime_error'

  return {
    ok: status === 'success',
    status,
    stdout: process.stdout,
    stderr: process.stderr,
    exitCode: process.exitCode,
    durationMs: process.durationMs,
    command,
  }
}

export const runCode = createServerFn({ method: 'POST' })
  .inputValidator(validateRunInput)
  .handler(async ({ data }) => {
    const { mkdir, mkdtemp, rm, writeFile } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { dirname, join } = await import('node:path')

    const workdir = await mkdtemp(join(tmpdir(), 'forty-two-run-'))

    try {
      for (const file of data.files) {
        const targetPath = join(workdir, file.path)
        await mkdir(dirname(targetPath), { recursive: true })
        await writeFile(targetPath, file.content, 'utf8')
      }

      if (data.language === 'python') {
        const target =
          data.activePath.endsWith('.py')
            ? data.activePath
            : data.files.find((file) => file.path.endsWith('.py'))?.path

        if (!target) throw new Error('No Python file found.')

        const process = await runProcess({
          command: 'python3',
          args: [join(workdir, target)],
          cwd: workdir,
          stdin: data.stdin,
          timeoutMs: RUN_TIMEOUT_MS,
        })

        return resultFromProcess({
          process,
          command: `python3 ${target}`,
        })
      }

      const sourceFiles = data.files
        .filter((file) => file.path.endsWith('.c'))
        .map((file) => join(workdir, file.path))
      const binaryPath = join(workdir, 'a.out')

      if (sourceFiles.length === 0) throw new Error('No C source files found.')

      const compileProcess = await runProcess({
        command: 'cc',
        args: [
          '-std=c99',
          '-Wall',
          '-Wextra',
          '-I',
          join(workdir, 'includes'),
          ...sourceFiles,
          '-o',
          binaryPath,
        ],
        cwd: workdir,
        stdin: '',
        timeoutMs: COMPILE_TIMEOUT_MS,
      })

      if (compileProcess.exitCode !== 0 || compileProcess.timedOut) {
        return resultFromProcess({
          process: compileProcess,
          command: 'cc -std=c99 -Wall -Wextra -I includes src/*.c -o a.out',
          compile: true,
        })
      }

      const process = await runProcess({
        command: binaryPath,
        args: data.stdin.trim() ? data.stdin.trim().split(/\s+/) : [],
        cwd: workdir,
        stdin: '',
        timeoutMs: RUN_TIMEOUT_MS,
      })

      return resultFromProcess({
        process,
        command: './a.out',
      })
    } catch (error) {
      return {
        ok: false,
        status: 'error',
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown runner error.',
        exitCode: null,
        durationMs: 0,
        command: data.language,
      } satisfies RunResult
    } finally {
      await rm(workdir, { recursive: true, force: true })
    }
  })
