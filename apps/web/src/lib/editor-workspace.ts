export type Language = 'python' | 'c'

export type ProjectFile = {
  path: string
  content: string
}

export type ProjectFolder = {
  path: string
}

export type ProjectTemplate = {
  files: Array<ProjectFile>
  folders: Array<ProjectFolder>
  activePath: string
}

export type RunInput = {
  language: Language
  files: Array<ProjectFile>
  activePath: string
  stdin: string
}

export type RunStatus =
  | 'success'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'error'

export type RunResult = {
  ok: boolean
  status: RunStatus
  stdout: string
  stderr: string
  exitCode: number | null
  durationMs: number
  command: string
}

export type ProcessResult = {
  stdout: string
  stderr: string
  exitCode: number | null
  timedOut: boolean
  durationMs: number
}

export type TreeRow = {
  path: string
  name: string
  kind: 'folder' | 'file'
  depth: number
}

export const MAX_FILE_COUNT = 80
export const MAX_TOTAL_CODE_LENGTH = 100_000
export const MAX_FILE_LENGTH = 30_000
export const MAX_PATH_LENGTH = 160
export const MAX_STDIN_LENGTH = 10_000
export const MAX_OUTPUT_LENGTH = 16_000
export const RUN_TIMEOUT_MS = 4_000
export const COMPILE_TIMEOUT_MS = 6_000

export const pythonTemplate = {
  activePath: 'main.py',
  folders: [],
  files: [
    {
      path: 'main.py',
      content: `name = input().strip() or "42 learner"
print(f"Hello, {name}!")

numbers = [4, 67, 3, 87, 23]
print("min:", min(numbers))
print("max:", max(numbers))
`,
    },
  ],
} satisfies ProjectTemplate

export const pushSwapTemplate = {
  activePath: 'src/main.c',
  folders: [{ path: 'includes' }, { path: 'src' }],
  files: [
    {
      path: 'Makefile',
      content: `NAME = push_swap
CC = cc
CFLAGS = -Wall -Wextra -Werror
SRC = src/main.c src/parse.c src/stack.c src/ops_swap_push.c src/ops_rotate.c src/sort_small.c src/sort_large.c src/cleanup.c
OBJ = $(SRC:.c=.o)

all: $(NAME)

$(NAME): $(OBJ)
\t$(CC) $(CFLAGS) $(OBJ) -o $(NAME)

clean:
\trm -f $(OBJ)

fclean: clean
\trm -f $(NAME)

re: fclean all
`,
    },
    {
      path: 'includes/push_swap.h',
      content: `#ifndef PUSH_SWAP_H
# define PUSH_SWAP_H

# include <limits.h>
# include <stdlib.h>
# include <unistd.h>

typedef struct s_stack
{
\tint\t\t\t\tvalue;
\tint\t\t\t\tindex;
\tstruct s_stack\t*next;
} t_stack;

t_stack\t*parse_numbers(int argc, char **argv);
void\tappend_stack(t_stack **stack, int value);
int\t\tstack_len(t_stack *stack);
int\t\tstack_is_sorted(t_stack *stack);
void\tsa(t_stack **a, int print);
void\tpa(t_stack **a, t_stack **b, int print);
void\tpb(t_stack **a, t_stack **b, int print);
void\tra(t_stack **a, int print);
void\trra(t_stack **a, int print);
void\tsort_small(t_stack **a);
void\tsort_stack(t_stack **a);
void\tassign_indexes(t_stack *stack);
void\tcleanup_stack(t_stack **stack);
int\t\twrite_error(void);

#endif
`,
    },
    {
      path: 'src/main.c',
      content: `#include "push_swap.h"

int\tmain(int argc, char **argv)
{
\tt_stack\t*a;

\tif (argc < 2)
\t\treturn (0);
\ta = parse_numbers(argc, argv);
\tif (!a)
\t\treturn (write_error());
\tif (!stack_is_sorted(a))
\t\tsort_stack(&a);
\tcleanup_stack(&a);
\treturn (0);
}
`,
    },
    {
      path: 'src/parse.c',
      content: `#include "push_swap.h"

static int\tread_int(const char *str, int *out)
{
\tlong\tvalue;
\tint\t\tsign;

\tvalue = 0;
\tsign = 1;
\tif (*str == '-' || *str == '+')
\t{
\t\tif (*str == '-')
\t\t\tsign = -1;
\t\tstr++;
\t}
\tif (!*str)
\t\treturn (0);
\twhile (*str >= '0' && *str <= '9')
\t{
\t\tvalue = value * 10 + (*str++ - '0');
\t\tif (sign * value > INT_MAX || sign * value < INT_MIN)
\t\t\treturn (0);
\t}
\tif (*str)
\t\treturn (0);
\t*out = (int)(sign * value);
\treturn (1);
}

static int\thas_value(t_stack *stack, int value)
{
\twhile (stack)
\t{
\t\tif (stack->value == value)
\t\t\treturn (1);
\t\tstack = stack->next;
\t}
\treturn (0);
}

t_stack\t*parse_numbers(int argc, char **argv)
{
\tt_stack\t*a;
\tint\t\tvalue;
\tint\t\ti;

\ta = NULL;
\ti = 1;
\twhile (i < argc)
\t{
\t\tif (!read_int(argv[i], &value) || has_value(a, value))
\t\t{
\t\t\tcleanup_stack(&a);
\t\t\treturn (NULL);
\t\t}
\t\tappend_stack(&a, value);
\t\ti++;
\t}
\treturn (a);
}
`,
    },
    {
      path: 'src/stack.c',
      content: `#include "push_swap.h"

void\tappend_stack(t_stack **stack, int value)
{
\tt_stack\t*node;
\tt_stack\t*cursor;

\tnode = malloc(sizeof(t_stack));
\tif (!node)
\t\treturn ;
\tnode->value = value;
\tnode->index = -1;
\tnode->next = NULL;
\tif (!*stack)
\t{
\t\t*stack = node;
\t\treturn ;
\t}
\tcursor = *stack;
\twhile (cursor->next)
\t\tcursor = cursor->next;
\tcursor->next = node;
}

int\tstack_len(t_stack *stack)
{
\tint\tlen;

\tlen = 0;
\twhile (stack)
\t{
\t\tlen++;
\t\tstack = stack->next;
\t}
\treturn (len);
}

int\tstack_is_sorted(t_stack *stack)
{
\twhile (stack && stack->next)
\t{
\t\tif (stack->value > stack->next->value)
\t\t\treturn (0);
\t\tstack = stack->next;
\t}
\treturn (1);
}
`,
    },
    {
      path: 'src/ops_swap_push.c',
      content: `#include "push_swap.h"

void\tsa(t_stack **a, int print)
{
\tt_stack\t*first;
\tt_stack\t*second;

\tif (!a || !*a || !(*a)->next)
\t\treturn ;
\tfirst = *a;
\tsecond = first->next;
\tfirst->next = second->next;
\tsecond->next = first;
\t*a = second;
\tif (print)
\t\twrite(1, "sa\\n", 3);
}

void\tpa(t_stack **a, t_stack **b, int print)
{
\tt_stack\t*node;

\tif (!b || !*b)
\t\treturn ;
\tnode = *b;
\t*b = node->next;
\tnode->next = *a;
\t*a = node;
\tif (print)
\t\twrite(1, "pa\\n", 3);
}

void\tpb(t_stack **a, t_stack **b, int print)
{
\tt_stack\t*node;

\tif (!a || !*a)
\t\treturn ;
\tnode = *a;
\t*a = node->next;
\tnode->next = *b;
\t*b = node;
\tif (print)
\t\twrite(1, "pb\\n", 3);
}
`,
    },
    {
      path: 'src/ops_rotate.c',
      content: `#include "push_swap.h"

void\tra(t_stack **a, int print)
{
\tt_stack\t*first;
\tt_stack\t*last;

\tif (!a || !*a || !(*a)->next)
\t\treturn ;
\tfirst = *a;
\t*a = first->next;
\tfirst->next = NULL;
\tlast = *a;
\twhile (last->next)
\t\tlast = last->next;
\tlast->next = first;
\tif (print)
\t\twrite(1, "ra\\n", 3);
}

void\trra(t_stack **a, int print)
{
\tt_stack\t*prev;
\tt_stack\t*last;

\tif (!a || !*a || !(*a)->next)
\t\treturn ;
\tprev = NULL;
\tlast = *a;
\twhile (last->next)
\t{
\t\tprev = last;
\t\tlast = last->next;
\t}
\tif (prev)
\t\tprev->next = NULL;
\tlast->next = *a;
\t*a = last;
\tif (print)
\t\twrite(1, "rra\\n", 4);
}
`,
    },
    {
      path: 'src/sort_small.c',
      content: `#include "push_swap.h"

static int\ttop_is_max(t_stack *a)
{
\treturn (a->value > a->next->value && a->value > a->next->next->value);
}

static int\tsecond_is_max(t_stack *a)
{
\treturn (a->next->value > a->value && a->next->value > a->next->next->value);
}

static void\tsort_three(t_stack **a)
{
\tif (stack_is_sorted(*a))
\t\treturn ;
\tif (top_is_max(*a))
\t\tra(a, 1);
\telse if (second_is_max(*a))
\t\trra(a, 1);
\tif ((*a)->value > (*a)->next->value)
\t\tsa(a, 1);
}

void\tsort_small(t_stack **a)
{
\tint\tlen;

\tlen = stack_len(*a);
\tif (len == 2 && !stack_is_sorted(*a))
\t\tsa(a, 1);
\telse if (len == 3)
\t\tsort_three(a);
}
`,
    },
    {
      path: 'src/sort_large.c',
      content: `#include "push_swap.h"

void\tassign_indexes(t_stack *stack)
{
\tt_stack\t*cursor;
\tt_stack\t*compare;
\tint\t\tindex;

\tcursor = stack;
\twhile (cursor)
\t{
\t\tindex = 0;
\t\tcompare = stack;
\t\twhile (compare)
\t\t{
\t\t\tif (compare->value < cursor->value)
\t\t\t\tindex++;
\t\t\tcompare = compare->next;
\t\t}
\t\tcursor->index = index;
\t\tcursor = cursor->next;
\t}
}

static int\tmax_bits(t_stack *stack)
{
\tint\tmax;
\tint\tbits;

\tmax = stack_len(stack) - 1;
\tbits = 0;
\twhile ((max >> bits) != 0)
\t\tbits++;
\treturn (bits);
}

static void\tradix_sort(t_stack **a)
{
\tt_stack\t*b;
\tint\t\tsize;
\tint\t\tbit;
\tint\t\ti;

\tb = NULL;
\tsize = stack_len(*a);
\tbit = 0;
\twhile (bit < max_bits(*a))
\t{
\t\ti = 0;
\t\twhile (i < size)
\t\t{
\t\t\tif (((*a)->index >> bit) & 1)
\t\t\t\tra(a, 1);
\t\t\telse
\t\t\t\tpb(a, &b, 1);
\t\t\ti++;
\t\t}
\t\twhile (b)
\t\t\tpa(a, &b, 1);
\t\tbit++;
\t}
}

void\tsort_stack(t_stack **a)
{
\tint\tlen;

\tlen = stack_len(*a);
\tif (len <= 3)
\t\tsort_small(a);
\telse
\t{
\t\tassign_indexes(*a);
\t\tradix_sort(a);
\t}
}
`,
    },
    {
      path: 'src/cleanup.c',
      content: `#include "push_swap.h"

void\tcleanup_stack(t_stack **stack)
{
\tt_stack\t*next;

\twhile (*stack)
\t{
\t\tnext = (*stack)->next;
\t\tfree(*stack);
\t\t*stack = next;
\t}
}

int\twrite_error(void)
{
\twrite(2, "Error\\n", 6);
\treturn (1);
}
`,
    },
  ],
} satisfies ProjectTemplate

export const starterInput = {
  python: 'Mustafa\n',
  c: '3 2 1\n',
} satisfies Record<Language, string>

export const templates = {
  python: pythonTemplate,
  c: pushSwapTemplate,
} satisfies Record<Language, ProjectTemplate>

export function normalizeProjectPath(path: string, allowFolder = false) {
  const normalized = path.trim().replaceAll('\\', '/').replace(/\/+$/g, '')

  if (
    !normalized ||
    normalized.length > MAX_PATH_LENGTH ||
    normalized.startsWith('/') ||
    normalized.includes('//') ||
    normalized.split('/').some((part) => !part || part === '.' || part === '..') ||
    !/^[A-Za-z0-9._/-]+$/.test(normalized)
  ) {
    throw new Error('Invalid project path.')
  }

  if (!allowFolder && normalized.endsWith('/')) {
    throw new Error('Invalid file path.')
  }

  return normalized
}

export function cloneTemplate(template: ProjectTemplate) {
  return {
    activePath: template.activePath,
    folders: template.folders.map((folder) => ({ ...folder })),
    files: template.files.map((file) => ({ ...file })),
  }
}

export function getParentFolders(path: string) {
  const parts = path.split('/')
  const parents: Array<string> = []

  for (let index = 1; index < parts.length; index += 1) {
    parents.push(parts.slice(0, index).join('/'))
  }

  return parents
}

export function buildTreeRows(
  files: Array<ProjectFile>,
  folders: Array<ProjectFolder>,
) {
  const rows: Array<TreeRow> = []
  const folderSet = new Set<string>()

  for (const folder of folders) {
    folderSet.add(folder.path)
    for (const parent of getParentFolders(folder.path)) folderSet.add(parent)
  }

  for (const file of files) {
    for (const parent of getParentFolders(file.path)) folderSet.add(parent)
  }

  for (const path of [...folderSet].sort()) {
    rows.push({
      path,
      name: path.split('/').at(-1) ?? path,
      kind: 'folder',
      depth: path.split('/').length - 1,
    })
  }

  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    rows.push({
      path: file.path,
      name: file.path.split('/').at(-1) ?? file.path,
      kind: 'file',
      depth: file.path.split('/').length - 1,
    })
  }

  const childrenByParent = new Map<string, Array<TreeRow>>()

  for (const row of rows) {
    const parent = row.path.includes('/') ? row.path.slice(0, row.path.lastIndexOf('/')) : ''
    childrenByParent.set(parent, [...(childrenByParent.get(parent) ?? []), row])
  }

  for (const children of childrenByParent.values()) {
    children.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  const orderedRows: Array<TreeRow> = []
  const appendChildren = (parent: string) => {
    for (const child of childrenByParent.get(parent) ?? []) {
      orderedRows.push(child)
      if (child.kind === 'folder') appendChildren(child.path)
    }
  }

  appendChildren('')

  return orderedRows
}

export function validateProjectFiles(files: unknown) {
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILE_COUNT) {
    throw new Error('Expected project files.')
  }

  let totalLength = 0
  const seen = new Set<string>()

  return files.map((file) => {
    if (!file || typeof file !== 'object') {
      throw new Error('Invalid file entry.')
    }

    const input = file as Record<string, unknown>
    const path = normalizeProjectPath(String(input.path ?? ''))
    const content = input.content

    if (seen.has(path)) throw new Error('Duplicate file path.')
    if (typeof content !== 'string') throw new Error('Invalid file content.')
    if (content.length > MAX_FILE_LENGTH) throw new Error('File is too large.')

    totalLength += content.length
    if (totalLength > MAX_TOTAL_CODE_LENGTH) {
      throw new Error('Project is too large.')
    }

    seen.add(path)
    return { path, content }
  })
}

export function validateRunInput(data: unknown): RunInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Expected run input.')
  }

  const input = data as Record<string, unknown>
  const language = input.language
  const stdin = input.stdin
  const files = validateProjectFiles(input.files)
  const activePath = normalizeProjectPath(String(input.activePath ?? files[0]?.path ?? ''))

  if (language !== 'python' && language !== 'c') {
    throw new Error('Unsupported language.')
  }

  if (!files.some((file) => file.path === activePath)) {
    throw new Error('Active file does not exist.')
  }

  if (typeof stdin !== 'string') {
    throw new Error('stdin must be a string.')
  }

  if (stdin.length > MAX_STDIN_LENGTH) {
    throw new Error('stdin is too large.')
  }

  return { language, files, activePath, stdin }
}

export function limitOutput(value: string) {
  if (value.length <= MAX_OUTPUT_LENGTH) return value
  return `${value.slice(0, MAX_OUTPUT_LENGTH)}\n[output truncated]`
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

function concatBytes(chunks: Array<Uint8Array>) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const output = new Uint8Array(length)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }

  return output
}

export function makeZip(files: Array<ProjectFile>, folders: Array<ProjectFolder>) {
  const encoder = new TextEncoder()
  const localChunks: Array<Uint8Array> = []
  const centralChunks: Array<Uint8Array> = []
  const entries = [
    ...folders.map((folder) => ({ path: `${folder.path}/`, content: '' })),
    ...files,
  ]
  let offset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.path)
    const data = encoder.encode(entry.content)
    const crc = crc32(data)
    const local = new Uint8Array(30 + name.length + data.length)
    const localView = new DataView(local.buffer)

    writeU32(localView, 0, 0x04034b50)
    writeU16(localView, 4, 20)
    writeU16(localView, 6, 0x0800)
    writeU16(localView, 8, 0)
    writeU32(localView, 10, 0)
    writeU32(localView, 14, crc)
    writeU32(localView, 18, data.length)
    writeU32(localView, 22, data.length)
    writeU16(localView, 26, name.length)
    writeU16(localView, 28, 0)
    local.set(name, 30)
    local.set(data, 30 + name.length)
    localChunks.push(local)

    const central = new Uint8Array(46 + name.length)
    const centralView = new DataView(central.buffer)

    writeU32(centralView, 0, 0x02014b50)
    writeU16(centralView, 4, 20)
    writeU16(centralView, 6, 20)
    writeU16(centralView, 8, 0x0800)
    writeU16(centralView, 10, 0)
    writeU32(centralView, 12, 0)
    writeU32(centralView, 16, crc)
    writeU32(centralView, 20, data.length)
    writeU32(centralView, 24, data.length)
    writeU16(centralView, 28, name.length)
    writeU16(centralView, 30, 0)
    writeU16(centralView, 32, 0)
    writeU16(centralView, 34, 0)
    writeU16(centralView, 36, 0)
    writeU32(centralView, 38, entry.path.endsWith('/') ? 0x10 : 0)
    writeU32(centralView, 42, offset)
    central.set(name, 46)
    centralChunks.push(central)
    offset += local.length
  }

  const centralOffset = offset
  const centralDirectory = concatBytes(centralChunks)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)

  writeU32(endView, 0, 0x06054b50)
  writeU16(endView, 8, entries.length)
  writeU16(endView, 10, entries.length)
  writeU32(endView, 12, centralDirectory.length)
  writeU32(endView, 16, centralOffset)

  return new Blob([concatBytes([...localChunks, centralDirectory, end])], {
    type: 'application/zip',
  })
}
