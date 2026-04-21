import { defaultLocale, type Locale } from './i18n'
import {
  cloneTemplate,
  pushSwapTemplate,
  type Language,
  type ProjectFile,
  type ProjectTemplate,
  type RunStatus,
} from './editor-workspace'

export type StepCheckCase = {
  id: string
  label: string
  stdin: string
  mode: 'exact-output' | 'no-output' | 'error-output' | 'push-swap-sorted'
  expectedOutput?: string
  expectedStatus?: RunStatus
  maxMoves?: number
}

export type GuidedStep = {
  id: string
  title: string
  goal: string
  explanation: string
  activePath: string
  template: ProjectTemplate
  solutionTemplate: ProjectTemplate
  suggestedStdin: string
  expectedStatus?: RunStatus
  expectedOutput?: string
  hints: Array<string>
  todos: Array<string>
  filesToEdit: Array<string>
  definitionOfDone: Array<string>
  checkCases: Array<StepCheckCase>
}

export type GuidedProject = {
  id: string
  language: Language
  title: string
  description: string
  defaultStdin: string
  steps: Array<GuidedStep>
}

const finalFiles = new Map(pushSwapTemplate.files.map((file) => [file.path, file]))
const allPaths = pushSwapTemplate.files.map((file) => file.path)

function file(path: string) {
  const match = finalFiles.get(path)
  if (!match) throw new Error(`Missing push_swap file: ${path}`)
  return { ...match }
}

function source(path: string) {
  return file(path).content
}

function makeTemplate(
  activePath: string,
  overrides: Record<string, string> = {},
): ProjectTemplate {
  return {
    activePath,
    folders: [{ path: 'includes' }, { path: 'src' }],
    files: allPaths.map((path) => ({
      path,
      content: overrides[path] ?? source(path),
    })),
  }
}

function cFile(path: string, content: string): ProjectFile {
  return { path, content }
}

const header = source('includes/push_swap.h')
const makefile = source('Makefile')
const cleanupStub = `#include "push_swap.h"

void\tcleanup_stack(t_stack **stack)
{
\t/* TODO: walk the list and free each node. */
\t(void)stack;
}

int\twrite_error(void)
{
\twrite(2, "Error\\n", 6);
\treturn (1);
}
`
const cleanupFinal = source('src/cleanup.c')
const mainShellStarter = `#include "push_swap.h"

int\tmain(int argc, char **argv)
{
\t(void)argv;
\t/* TODO: no arguments should mean no work and no output. */
\tif (argc < 2)
\t\treturn (0);
\treturn (0);
}
`
const mainShellSolution = `#include "push_swap.h"

int\tmain(int argc, char **argv)
{
\t(void)argv;
\tif (argc < 2)
\t\treturn (0);
\treturn (0);
}
`
const mainFinal = source('src/main.c')
const stackStub = `#include "push_swap.h"

void\tappend_stack(t_stack **stack, int value)
{
\t/* TODO: allocate one node, fill value/index/next, append at the end. */
\t(void)stack;
\t(void)value;
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
`
const stackFinal = source('src/stack.c')
const parseStub = `#include "push_swap.h"

t_stack\t*parse_numbers(int argc, char **argv)
{
\t/* TODO: parse argv into stack a. */
\t(void)argc;
\t(void)argv;
\treturn (NULL);
}
`
const parseReadTodo = `#include "push_swap.h"

static int\tread_int(const char *str, int *out)
{
\t/* TODO: accept optional sign, require digits, reject overflow and junk. */
\t(void)str;
\t(void)out;
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
\t\tif (!read_int(argv[i], &value))
\t\t{
\t\t\tcleanup_stack(&a);
\t\t\treturn (NULL);
\t\t}
\t\tappend_stack(&a, value);
\t\ti++;
\t}
\treturn (a);
}
`
const parseDuplicateTodo = `#include "push_swap.h"

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
\t/* TODO: return 1 when value is already in the stack. */
\t(void)stack;
\t(void)value;
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
`
const parseFinal = source('src/parse.c')
const opsSwapPushStub = `#include "push_swap.h"

void\tsa(t_stack **a, int print)
{
\t/* TODO: swap the first two nodes in stack a. */
\t(void)a;
\t(void)print;
}

void\tpa(t_stack **a, t_stack **b, int print)
{
\t/* TODO: move the top node from b to a. */
\t(void)a;
\t(void)b;
\t(void)print;
}

void\tpb(t_stack **a, t_stack **b, int print)
{
\t/* TODO: move the top node from a to b. */
\t(void)a;
\t(void)b;
\t(void)print;
}
`
const opsSwapPushFinal = source('src/ops_swap_push.c')
const opsRotateStub = `#include "push_swap.h"

void\tra(t_stack **a, int print)
{
\t/* TODO: move the first node to the bottom of stack a. */
\t(void)a;
\t(void)print;
}

void\trra(t_stack **a, int print)
{
\t/* TODO: move the last node to the top of stack a. */
\t(void)a;
\t(void)print;
}
`
const opsRotateFinal = source('src/ops_rotate.c')
const sortSmallStub = `#include "push_swap.h"

void\tsort_small(t_stack **a)
{
\t/* TODO: handle two numbers first, then three numbers. */
\t(void)a;
}
`
const sortSmallTwoOnly = `#include "push_swap.h"

void\tsort_small(t_stack **a)
{
\tif (stack_len(*a) == 2 && !stack_is_sorted(*a))
\t\tsa(a, 1);
}
`
const sortSmallFinal = source('src/sort_small.c')
const sortLargeStub = `#include "push_swap.h"

void\tassign_indexes(t_stack *stack)
{
\t/* TODO: give each value its sorted rank, from 0 to len - 1. */
\t(void)stack;
}

void\tsort_stack(t_stack **a)
{
\tif (stack_len(*a) <= 3)
\t\tsort_small(a);
}
`
const sortLargeOneBitTodo = `#include "push_swap.h"

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

static void\tradix_one_bit(t_stack **a)
{
\t/* TODO: for bit 0, ra indexes with 1 and pb indexes with 0, then pa back. */
\t(void)a;
}

void\tsort_stack(t_stack **a)
{
\tif (stack_len(*a) <= 3)
\t\tsort_small(a);
\telse
\t{
\t\tassign_indexes(*a);
\t\tradix_one_bit(a);
\t}
}
`
const sortLargeOneBitSolution = `#include "push_swap.h"

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

static void\tradix_one_bit(t_stack **a)
{
\tt_stack\t*b;
\tint\t\tsize;
\tint\t\ti;

\tb = NULL;
\tsize = stack_len(*a);
\ti = 0;
\twhile (i < size)
\t{
\t\tif ((*a)->index & 1)
\t\t\tra(a, 1);
\t\telse
\t\t\tpb(a, &b, 1);
\t\ti++;
\t}
\twhile (b)
\t\tpa(a, &b, 1);
}

void\tsort_stack(t_stack **a)
{
\tif (stack_len(*a) <= 3)
\t\tsort_small(a);
\telse
\t{
\t\tassign_indexes(*a);
\t\tradix_one_bit(a);
\t}
}
`
const sortLargeFinal = source('src/sort_large.c')

const baseStubs = {
  Makefile: makefile,
  'includes/push_swap.h': header,
  'src/main.c': mainFinal,
  'src/parse.c': parseStub,
  'src/stack.c': stackStub,
  'src/ops_swap_push.c': opsSwapPushStub,
  'src/ops_rotate.c': opsRotateStub,
  'src/sort_small.c': sortSmallStub,
  'src/sort_large.c': sortLargeStub,
  'src/cleanup.c': cleanupStub,
}

type StepSeed = {
  id: string
  activePath: string
  suggestedStdin: string
  expectedStatus: RunStatus
  expectedOutput: string
  starter: Record<string, string>
  solution: Record<string, string>
  checkCases: Array<StepCheckCase>
}

const solvedThroughStack = {
  ...baseStubs,
  'src/main.c': mainFinal,
  'src/stack.c': stackFinal,
  'src/cleanup.c': cleanupFinal,
}

const solvedThroughParse = {
  ...solvedThroughStack,
  'src/parse.c': parseFinal,
}

const solvedThroughPush = {
  ...solvedThroughParse,
  'src/ops_swap_push.c': opsSwapPushFinal,
  'src/sort_small.c': sortSmallTwoOnly,
}

const solvedThroughRotate = {
  ...solvedThroughPush,
  'src/ops_rotate.c': opsRotateFinal,
  'src/sort_small.c': sortSmallFinal,
}

const solvedThroughSmall = {
  ...solvedThroughRotate,
  'src/sort_large.c': sortLargeStub,
}

const stepSeeds: Array<StepSeed> = [
  {
    id: 'program-shell',
    activePath: 'src/main.c',
    suggestedStdin: '',
    expectedStatus: 'success',
    expectedOutput: '(no output)',
    starter: { ...baseStubs, 'src/main.c': mainShellStarter },
    solution: { ...baseStubs, 'src/main.c': mainShellSolution },
    checkCases: [{ id: 'empty', label: 'No arguments stay quiet', stdin: '', mode: 'no-output' }],
  },
  {
    id: 'stack-cleanup',
    activePath: 'src/stack.c',
    suggestedStdin: '',
    expectedStatus: 'success',
    expectedOutput: '(no output)',
    starter: { ...baseStubs, 'src/main.c': mainShellSolution },
    solution: { ...baseStubs, 'src/main.c': mainShellSolution, 'src/stack.c': stackFinal, 'src/cleanup.c': cleanupFinal },
    checkCases: [{ id: 'compile', label: 'Project still compiles quietly', stdin: '', mode: 'no-output' }],
  },
  {
    id: 'read-int',
    activePath: 'src/parse.c',
    suggestedStdin: '42\n',
    expectedStatus: 'success',
    expectedOutput: '(no output)',
    starter: { ...solvedThroughStack, 'src/parse.c': parseReadTodo },
    solution: { ...solvedThroughStack, 'src/parse.c': parseDuplicateTodo },
    checkCases: [
      { id: 'valid-int', label: 'Clean integer is accepted', stdin: '42\n', mode: 'no-output' },
      { id: 'overflow', label: 'Overflow prints Error', stdin: '2147483648\n', mode: 'error-output', expectedOutput: 'Error' },
    ],
  },
  {
    id: 'parse-stack',
    activePath: 'src/parse.c',
    suggestedStdin: '1 2 2\n',
    expectedStatus: 'runtime_error',
    expectedOutput: 'Error',
    starter: { ...solvedThroughStack, 'src/parse.c': parseDuplicateTodo },
    solution: solvedThroughParse,
    checkCases: [
      { id: 'valid-list', label: 'Valid list is accepted', stdin: '3 2 1\n', mode: 'no-output' },
      { id: 'duplicate', label: 'Duplicate prints Error', stdin: '1 2 2\n', mode: 'error-output', expectedOutput: 'Error' },
    ],
  },
  {
    id: 'swap-push',
    activePath: 'src/ops_swap_push.c',
    suggestedStdin: '2 1\n',
    expectedStatus: 'success',
    expectedOutput: 'sa',
    starter: { ...solvedThroughParse, 'src/ops_swap_push.c': opsSwapPushStub, 'src/sort_small.c': sortSmallTwoOnly },
    solution: solvedThroughPush,
    checkCases: [
      { id: 'two-reversed', label: '2 1 prints sa', stdin: '2 1\n', mode: 'exact-output', expectedOutput: 'sa' },
      { id: 'two-sorted', label: '1 2 stays quiet', stdin: '1 2\n', mode: 'no-output' },
    ],
  },
  {
    id: 'rotate-reverse',
    activePath: 'src/ops_rotate.c',
    suggestedStdin: '3 2 1\n',
    expectedStatus: 'success',
    expectedOutput: 'ra\nsa',
    starter: { ...solvedThroughPush, 'src/ops_rotate.c': opsRotateStub, 'src/sort_small.c': sortSmallFinal },
    solution: solvedThroughRotate,
    checkCases: [
      { id: 'three-desc', label: '3 2 1 sorts through checker', stdin: '3 2 1\n', mode: 'push-swap-sorted', maxMoves: 3 },
    ],
  },
  {
    id: 'small-sort',
    activePath: 'src/sort_small.c',
    suggestedStdin: '2 3 1\n',
    expectedStatus: 'success',
    expectedOutput: 'rra',
    starter: { ...solvedThroughRotate, 'src/sort_small.c': sortSmallTwoOnly },
    solution: solvedThroughSmall,
    checkCases: [
      { id: 'perm-321', label: '3 2 1 sorts', stdin: '3 2 1\n', mode: 'push-swap-sorted', maxMoves: 3 },
      { id: 'perm-231', label: '2 3 1 sorts', stdin: '2 3 1\n', mode: 'push-swap-sorted', maxMoves: 2 },
      { id: 'perm-132', label: '1 3 2 sorts', stdin: '1 3 2\n', mode: 'push-swap-sorted', maxMoves: 2 },
    ],
  },
  {
    id: 'assign-indexes',
    activePath: 'src/sort_large.c',
    suggestedStdin: '1 2 3 4\n',
    expectedStatus: 'success',
    expectedOutput: '(no output)',
    starter: solvedThroughSmall,
    solution: { ...solvedThroughSmall, 'src/sort_large.c': sortLargeOneBitTodo },
    checkCases: [{ id: 'small-still-ok', label: 'Small sort still works', stdin: '3 1 2\n', mode: 'push-swap-sorted', maxMoves: 3 }],
  },
  {
    id: 'radix-one-bit',
    activePath: 'src/sort_large.c',
    suggestedStdin: '2 1 3 4\n',
    expectedStatus: 'success',
    expectedOutput: 'ra\npb\npb\nra\npa\npa',
    starter: { ...solvedThroughSmall, 'src/sort_large.c': sortLargeOneBitTodo },
    solution: { ...solvedThroughSmall, 'src/sort_large.c': sortLargeOneBitSolution },
    checkCases: [
      {
        id: 'one-bit-output',
        label: 'One bit pass prints the expected moves',
        stdin: '2 1 3 4\n',
        mode: 'exact-output',
        expectedOutput: 'ra\npb\npb\nra\npa\npa',
      },
    ],
  },
  {
    id: 'full-radix',
    activePath: 'src/sort_large.c',
    suggestedStdin: '8 3 5 1 7 2 6 4\n',
    expectedStatus: 'success',
    expectedOutput: 'checker OK',
    starter: { ...solvedThroughSmall, 'src/sort_large.c': sortLargeOneBitSolution },
    solution: { ...solvedThroughSmall, 'src/sort_large.c': sortLargeFinal },
    checkCases: [
      { id: 'eight-values', label: '8 values sort', stdin: '8 3 5 1 7 2 6 4\n', mode: 'push-swap-sorted', maxMoves: 80 },
      { id: 'negatives', label: 'Negative values sort', stdin: '-3 9 0 -1 4 2\n', mode: 'push-swap-sorted', maxMoves: 80 },
    ],
  },
  {
    id: 'evaluator-habits',
    activePath: 'src/parse.c',
    suggestedStdin: '1 2 2\n',
    expectedStatus: 'runtime_error',
    expectedOutput: 'Error',
    starter: { ...solvedThroughSmall, 'src/sort_large.c': sortLargeFinal },
    solution: { ...solvedThroughSmall, 'src/sort_large.c': sortLargeFinal },
    checkCases: [
      { id: 'duplicate', label: 'Duplicate prints Error', stdin: '1 2 2\n', mode: 'error-output', expectedOutput: 'Error' },
      { id: 'overflow', label: 'Overflow prints Error', stdin: '2147483648\n', mode: 'error-output', expectedOutput: 'Error' },
      { id: 'text', label: 'Text prints Error', stdin: '0 one 2\n', mode: 'error-output', expectedOutput: 'Error' },
      { id: 'final-sort', label: 'Mixed values sort', stdin: '8 3 5 1 7 2 6 4\n', mode: 'push-swap-sorted', maxMoves: 80 },
    ],
  },
]

const localizedContent = {
  en: {
    title: 'push_swap project lab',
    description:
      'Build a real push_swap in small TODO-first checkpoints, then check each layer before moving on.',
    steps: [
      {
        title: 'Program shell',
        goal: 'Create the smallest project that compiles and exits quietly.',
        explanation: 'Start with the contract: no arguments means no output.',
        hints: ['main owns the first decision: is there any work to do?', 'A quiet program is correct for an empty run.'],
        todos: ['Keep argc/argv valid without using argv yet.', 'Return 0 when argc is less than 2.'],
        filesToEdit: ['src/main.c'],
        definitionOfDone: ['No-argument runs print nothing.', 'The project compiles.'],
      },
      {
        title: 'Stack node basics',
        goal: 'Make stack nodes real and free them safely.',
        explanation: 'Every later move depends on a predictable linked-list shape.',
        hints: ['New nodes need value, index, and next.', 'Save next before freeing the current node.'],
        todos: ['Append new nodes at the end so argv order stays unchanged.', 'Walk cleanup_stack until the stack is empty.'],
        filesToEdit: ['src/stack.c', 'src/cleanup.c'],
        definitionOfDone: ['append_stack preserves input order.', 'cleanup_stack releases every node.'],
      },
      {
        title: 'Parse one integer',
        goal: 'Read one argv token as a clean int.',
        explanation: 'A token is valid only if it is an optional sign followed by digits inside int limits.',
        hints: ['A lone + or - is not a number.', 'Check overflow while building the number.'],
        todos: ['Implement read_int.', 'Reject trailing junk such as 12abc.'],
        filesToEdit: ['src/parse.c'],
        definitionOfDone: ['42 and -3 are accepted.', '2147483648 prints Error.'],
      },
      {
        title: 'Build stack and reject duplicates',
        goal: 'Turn argv into stack a and reject repeated numbers.',
        explanation: 'Parsing owns the input rules; stack helpers own memory shape.',
        hints: ['Check duplicates before appending.', 'Clean the partial stack before returning NULL.'],
        todos: ['Implement has_value.', 'Use cleanup_stack when parsing fails halfway.'],
        filesToEdit: ['src/parse.c'],
        definitionOfDone: ['3 2 1 is accepted.', '1 2 2 prints Error.'],
      },
      {
        title: 'Swap and push',
        goal: 'Make sa, pa, and pb reliable.',
        explanation: 'These operations move nodes, not copied values.',
        hints: ['Guard empty or one-node stacks.', 'pa moves from b into a; pb moves from a into b.'],
        todos: ['Rewire the first two nodes for sa.', 'Move one top node for pa and pb.'],
        filesToEdit: ['src/ops_swap_push.c'],
        definitionOfDone: ['2 1 prints sa.', '1 2 prints nothing.'],
      },
      {
        title: 'Rotate and reverse rotate',
        goal: 'Move the top to bottom and bottom to top.',
        explanation: 'ra and rra give small sort the last two moves it needs.',
        hints: ['ra detaches the first node and appends it after the last.', 'rra finds the previous-to-last node.'],
        todos: ['Implement ra.', 'Implement rra.'],
        filesToEdit: ['src/ops_rotate.c'],
        definitionOfDone: ['3 2 1 can be sorted by checker rules.', 'Small stacks remain safe.'],
      },
      {
        title: 'Small sort',
        goal: 'Sort two and three values with direct reasoning.',
        explanation: 'Tiny cases teach the shape of the operations before radix begins.',
        hints: ['For three values, move the biggest away first.', 'Then fix the top two with sa if needed.'],
        todos: ['Detect where the biggest value is.', 'Handle all three-number permutations.'],
        filesToEdit: ['src/sort_small.c'],
        definitionOfDone: ['All tested three-number permutations sort.', 'Sorted input stays quiet.'],
      },
      {
        title: 'Assign sorted indexes',
        goal: 'Give each value a rank from 0 to len - 1.',
        explanation: 'Radix is easier when values become compact non-negative indexes.',
        hints: ['The smallest value gets index 0.', 'Count how many values are smaller than the current node.'],
        todos: ['Implement assign_indexes.', 'Do not change the original values.'],
        filesToEdit: ['src/sort_large.c'],
        definitionOfDone: ['Small sort still works.', 'Every node can carry its sorted rank.'],
      },
      {
        title: 'One radix bit',
        goal: 'Practice one pass over bit 0.',
        explanation: 'A radix pass keeps 1-bit indexes in a with ra and parks 0-bit indexes in b.',
        hints: ['Process exactly the original stack length.', 'After the pass, pa everything back.'],
        todos: ['Implement radix_one_bit.', 'Compare your move order with the expected run.'],
        filesToEdit: ['src/sort_large.c'],
        definitionOfDone: ['The one-bit example prints the expected moves.', 'Stack b ends empty.'],
      },
      {
        title: 'Full radix sort',
        goal: 'Repeat bit passes until every index is sorted.',
        explanation: 'The full algorithm is the same pass, repeated for each bit in the largest index.',
        hints: ['max index is len - 1.', 'Stop when shifting max by bits reaches zero.'],
        todos: ['Compute max_bits.', 'Loop through every bit and reuse the pass idea.'],
        filesToEdit: ['src/sort_large.c'],
        definitionOfDone: ['8 mixed values pass the checker.', 'Negative values also sort.'],
      },
      {
        title: 'Evaluator habits',
        goal: 'Practice the cases reviewers and testers will try.',
        explanation: 'This lab uses separate argv tokens; quoted argument splitting is outside this browser runner.',
        hints: ['Try duplicates, overflow, text, sorted input, and mixed signs.', 'Explain why Error is expected for invalid input.'],
        todos: ['Run the evaluator checks.', 'Export only after the checks pass.'],
        filesToEdit: ['src/parse.c', 'src/sort_large.c'],
        definitionOfDone: ['Invalid input prints Error.', 'The fixed larger case sorts under the move cap.', 'You can explain the argv limitation.'],
      },
    ],
  },
  ar: {
    title: 'مختبر push_swap',
    description:
      'ابن push_swap حقيقيا عبر checkpoints صغيرة بأسلوب TODO أولا، ثم افحص كل طبقة قبل الانتقال.',
    steps: [
      {
        title: 'هيكل البرنامج',
        goal: 'ابن أصغر مشروع يترجم ويخرج بهدوء.',
        explanation: 'ابدأ بالعقد الأساسي: بدون arguments لا يوجد output.',
        hints: ['main يقرر أولا هل يوجد عمل أم لا.', 'الخروج الهادئ صحيح عند عدم وجود input.'],
        todos: ['اترك argc/argv صالحين بدون استخدام argv الآن.', 'أرجع 0 عندما يكون argc أقل من 2.'],
        filesToEdit: ['src/main.c'],
        definitionOfDone: ['التشغيل بدون arguments لا يطبع شيئا.', 'المشروع يترجم.'],
      },
      {
        title: 'أساسيات عقد الستاك',
        goal: 'اجعل عقد الستاك حقيقية ونظفها بأمان.',
        explanation: 'كل حركة لاحقة تعتمد على linked list واضحة.',
        hints: ['العقدة الجديدة تحتاج value و index و next.', 'احفظ next قبل تحرير العقدة الحالية.'],
        todos: ['أضف العقدة في النهاية حتى يبقى ترتيب argv كما هو.', 'اجعل cleanup_stack تمشي حتى يفرغ الستاك.'],
        filesToEdit: ['src/stack.c', 'src/cleanup.c'],
        definitionOfDone: ['append_stack يحافظ على ترتيب الإدخال.', 'cleanup_stack تحرر كل العقد.'],
      },
      {
        title: 'قراءة عدد واحد',
        goal: 'اقرأ token واحدا كـ int نظيف.',
        explanation: 'الـ token صالح فقط إذا كان sign اختياري ثم digits ضمن حدود int.',
        hints: ['+ أو - وحدها ليست رقما.', 'افحص overflow أثناء بناء الرقم.'],
        todos: ['نفذ read_int.', 'ارفض النص الزائد مثل 12abc.'],
        filesToEdit: ['src/parse.c'],
        definitionOfDone: ['42 و -3 مقبولان.', '2147483648 تطبع Error.'],
      },
      {
        title: 'بناء الستاك ومنع التكرار',
        goal: 'حوّل argv إلى stack a وارفض الأرقام المكررة.',
        explanation: 'الـ parsing يملك قواعد الإدخال، والـ stack helpers تملك شكل الذاكرة.',
        hints: ['افحص التكرار قبل الإضافة.', 'نظف الستاك الجزئي قبل إرجاع NULL.'],
        todos: ['نفذ has_value.', 'استخدم cleanup_stack إذا فشل parsing في المنتصف.'],
        filesToEdit: ['src/parse.c'],
        definitionOfDone: ['3 2 1 مقبول.', '1 2 2 تطبع Error.'],
      },
      {
        title: 'swap و push',
        goal: 'اجعل sa و pa و pb موثوقة.',
        explanation: 'هذه العمليات تنقل العقد ولا تنسخ القيم.',
        hints: ['احم الستاك الفارغ أو صاحب عقدة واحدة.', 'pa تنقل من b إلى a و pb من a إلى b.'],
        todos: ['غير روابط أول عقدتين في sa.', 'انقل عقدة واحدة في pa و pb.'],
        filesToEdit: ['src/ops_swap_push.c'],
        definitionOfDone: ['2 1 تطبع sa.', '1 2 لا تطبع شيئا.'],
      },
      {
        title: 'rotate و reverse rotate',
        goal: 'انقل الأعلى للأسفل والأسفل للأعلى.',
        explanation: 'ra و rra يعطيان small sort آخر حركتين يحتاجهما.',
        hints: ['ra تفصل أول عقدة وتضيفها بعد الأخيرة.', 'rra تبحث عن العقدة قبل الأخيرة.'],
        todos: ['نفذ ra.', 'نفذ rra.'],
        filesToEdit: ['src/ops_rotate.c'],
        definitionOfDone: ['3 2 1 تترتب حسب قواعد checker.', 'الستاك الصغير يبقى آمنا.'],
      },
      {
        title: 'الترتيب الصغير',
        goal: 'رتب قيمتين وثلاث قيم بتفكير مباشر.',
        explanation: 'الحالات الصغيرة تعلم شكل الحركات قبل radix.',
        hints: ['مع ثلاث قيم، أبعد الأكبر أولا.', 'ثم أصلح أول قيمتين بـ sa إذا لزم.'],
        todos: ['حدد مكان أكبر قيمة.', 'تعامل مع كل احتمالات الثلاثة أرقام.'],
        filesToEdit: ['src/sort_small.c'],
        definitionOfDone: ['كل احتمالات الثلاثة المختبرة تترتب.', 'الإدخال المرتب يبقى صامتا.'],
      },
      {
        title: 'إعطاء indexes مرتبة',
        goal: 'أعط كل قيمة رتبة من 0 إلى len - 1.',
        explanation: 'radix أسهل عندما تصبح القيم indexes صغيرة وغير سالبة.',
        hints: ['أصغر قيمة تأخذ index 0.', 'عد كم قيمة أصغر من العقدة الحالية.'],
        todos: ['نفذ assign_indexes.', 'لا تغير القيم الأصلية.'],
        filesToEdit: ['src/sort_large.c'],
        definitionOfDone: ['small sort لا يزال يعمل.', 'كل عقدة تستطيع حمل رتبتها.'],
      },
      {
        title: 'بت واحد من radix',
        goal: 'تدرب على pass واحد على bit 0.',
        explanation: 'radix pass يبقي indexes ذات bit 1 في a بـ ra وينقل bit 0 إلى b.',
        hints: ['عالج طول الستاك الأصلي فقط.', 'بعد pass أرجع كل شيء بـ pa.'],
        todos: ['نفذ radix_one_bit.', 'قارن ترتيب الحركات مع الناتج المتوقع.'],
        filesToEdit: ['src/sort_large.c'],
        definitionOfDone: ['مثال bit الواحد يطبع الحركات المتوقعة.', 'stack b تنتهي فارغة.'],
      },
      {
        title: 'radix الكامل',
        goal: 'كرر passes إلى أن تترتب كل indexes.',
        explanation: 'الخوارزمية الكاملة هي نفس pass مكرر لكل bit في أكبر index.',
        hints: ['أكبر index هو len - 1.', 'توقف عندما يصبح shift لأكبر index صفرا.'],
        todos: ['احسب max_bits.', 'كرر فكرة pass لكل bit.'],
        filesToEdit: ['src/sort_large.c'],
        definitionOfDone: ['8 قيم مختلطة تنجح في checker.', 'القيم السالبة تترتب أيضا.'],
      },
      {
        title: 'عادات التقييم',
        goal: 'تدرب على الحالات التي سيجربها المصححون.',
        explanation: 'هذا المختبر يستخدم argv منفصلة؛ تقسيم quoted arguments خارج مشغل المتصفح هذا.',
        hints: ['جرب التكرار و overflow والنص والإدخال المرتب والإشارات.', 'اشرح لماذا Error متوقعة للإدخال الخاطئ.'],
        todos: ['شغل فحوصات التقييم.', 'صدّر المشروع فقط بعد نجاح الفحوصات.'],
        filesToEdit: ['src/parse.c', 'src/sort_large.c'],
        definitionOfDone: ['الإدخال الخاطئ يطبع Error.', 'الحالة الكبيرة المحددة تترتب تحت حد الحركات.', 'تستطيع شرح حد argv في المتصفح.'],
      },
    ],
  },
} satisfies Record<
  Locale,
  {
    title: string
    description: string
    steps: Array<{
      title: string
      goal: string
      explanation: string
      hints: Array<string>
      todos: Array<string>
      filesToEdit: Array<string>
      definitionOfDone: Array<string>
    }>
  }
>

function pushSwapProject(locale: Locale): GuidedProject {
  const content = localizedContent[locale]

  return {
    id: 'push-swap',
    language: 'c',
    title: content.title,
    description: content.description,
    defaultStdin: '3 2 1\n',
    steps: stepSeeds.map((seed, index) => {
      const localizedStep = content.steps[index]
      return {
        id: seed.id,
        title: localizedStep.title,
        goal: localizedStep.goal,
        explanation: localizedStep.explanation,
        activePath: seed.activePath,
        template: makeTemplate(seed.activePath, seed.starter),
        solutionTemplate: makeTemplate(seed.activePath, seed.solution),
        suggestedStdin: seed.suggestedStdin,
        expectedStatus: seed.expectedStatus,
        expectedOutput: seed.expectedOutput,
        hints: [...localizedStep.hints],
        todos: [...localizedStep.todos],
        filesToEdit: [...localizedStep.filesToEdit],
        definitionOfDone: [...localizedStep.definitionOfDone],
        checkCases: seed.checkCases.map((check) => ({ ...check })),
      }
    }),
  }
}

const projectFactories: Record<string, (locale: Locale) => GuidedProject> = {
  'push-swap': pushSwapProject,
}

export function getGuidedProject(id: string, locale: Locale = defaultLocale) {
  return projectFactories[id]?.(locale)
}

export function getGuidedProjectStep(
  project: GuidedProject,
  stepId: string,
) {
  return project.steps.find((step) => step.id === stepId)
}

export function getGuidedProjectIds() {
  return Object.keys(projectFactories)
}

export function cloneGuidedTemplate(template: ProjectTemplate) {
  return cloneTemplate(template)
}

export const pushSwapGuidedDebugFiles = {
  final: allPaths.map((path) => cFile(path, source(path))),
}
