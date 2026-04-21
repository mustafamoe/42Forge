import { useRouterState } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, RotateCcw, Target } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CodeWorkspace } from './CodeWorkspace'
import type { CodeLineNote, CodeNote } from './CodeWorkspace'
import { asLocale, defaultLocale, isLocale, type Locale } from '../lib/i18n'
import {
  getGuidedProject,
  getGuidedProjectStep,
  type GuidedProject,
  type GuidedStep,
} from '../lib/guided-projects'

const copy = {
  en: {
    eyebrow: 'Project lab',
    load: 'Load step',
    current: 'Current',
    back: 'Back',
    next: 'Next',
    start: 'Start',
    done: 'Done',
    step: 'Step',
    of: 'of',
    objective: 'Objective',
    hints: 'Hints',
    hideHints: 'Hide hint',
    showHints: 'Show hint',
    tinyExample: 'Tiny example',
    tryMoves: 'Try moves',
    reset: 'Reset',
    pileA: 'Pile a',
    pileB: 'Pile b',
    empty: 'empty',
    yourTask: 'Your task',
    output: 'Output',
    expected: 'Expected run',
    filesToEdit: 'Files to edit',
    todos: 'TODO',
    definitionOfDone: 'Definition of done',
    operations: 'Moves used here',
    missing: 'This guided project is not available yet.',
    projects: 'Projects',
  },
  ar: {
    eyebrow: 'مختبر المشروع',
    load: 'حمّل الخطوة',
    current: 'الحالية',
    back: 'السابق',
    next: 'التالي',
    start: 'البداية',
    done: 'انتهى',
    step: 'خطوة',
    of: 'من',
    objective: 'الهدف',
    hints: 'تلميحات',
    hideHints: 'أخف التلميح',
    showHints: 'أظهر تلميحا',
    tinyExample: 'مثال صغير',
    tryMoves: 'جرب الحركات',
    reset: 'إعادة',
    pileA: 'الكومة a',
    pileB: 'الكومة b',
    empty: 'فارغ',
    yourTask: 'مهمتك',
    output: 'النتيجة',
    expected: 'نتيجة التشغيل المتوقعة',
    filesToEdit: 'ملفات التعديل',
    todos: 'TODO',
    definitionOfDone: 'تعريف الإنجاز',
    operations: 'الحركات هنا',
    missing: 'هذا المشروع التفاعلي غير متوفر بعد.',
    projects: 'المشاريع',
  },
} satisfies Record<Locale, Record<string, string>>

function localeFromPath(pathname: string) {
  const pathLocale = pathname.match(/^\/(en|ar)(?=\/|$)/)?.[1]
  return isLocale(pathLocale) ? pathLocale : defaultLocale
}

function getStoredStep(project: GuidedProject, storageKey: string) {
  if (typeof window === 'undefined') return project.steps[0]?.id
  const stored = window.localStorage.getItem(storageKey)
  return stored && getGuidedProjectStep(project, stored)
    ? stored
    : project.steps[0]?.id
}

function expectedText(step: GuidedStep) {
  const status =
    step.expectedStatus === 'runtime_error' && step.expectedOutput === 'Error'
      ? 'expected Error output'
      : step.expectedStatus?.replaceAll('_', ' ') ?? ''
  if (!status && !step.expectedOutput) return ''
  if (step.expectedOutput?.includes('\n')) {
    return [status, step.expectedOutput].filter(Boolean).join('\n')
  }
  return [status, step.expectedOutput].filter(Boolean).join(' / ')
}

function renderInlineCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

type CoachStep = {
  what: string
  example: string
  task: string
  demo: {
    a: Array<number>
    b: Array<number>
    commands: Array<string>
    output?: string
  }
}

function getStepCoach(step: GuidedStep, locale: Locale): CoachStep {
  const content = {
    en: {
      'program-shell': {
        what: 'Make a tiny program that stays quiet when there are no numbers.',
        example: 'No input means no moves. The output should stay empty.',
        task: 'Press Run. You should see no output.',
        demo: { a: [], b: [], commands: [], output: '(no output)' },
      },
      'stack-cleanup': {
        what: 'Build one linked-list node shape and clean it safely.',
        example: 'A node keeps the number, its future sorted index, and the next pointer.',
        task: 'Reveal only if stuck, then finish `append_stack` and `cleanup_stack`.',
        demo: { a: [3, 2, 1], b: [], commands: [], output: '(stored as nodes)' },
      },
      'read-int': {
        what: 'Read one argument as a valid C int.',
        example: '`-42` is valid. `42abc`, `-`, and overflow are invalid.',
        task: 'Run Check. `42` should pass and `2147483648` should print `Error`.',
        demo: { a: [42], b: [], commands: [], output: '(valid int)' },
      },
      'parse-stack': {
        what: 'Build stack a and reject repeated numbers.',
        example: '`1 2 2` fails because the second 2 is already stored.',
        task: 'Run Check. Valid lists stay quiet; duplicates print `Error`.',
        demo: { a: [1, 2, 2], b: [], commands: [], output: 'Error' },
      },
      'swap-push': {
        what: 'Make node moves for swap and push.',
        example: '`sa` swaps 2 and 1, so `2 1` becomes sorted.',
        task: 'Run Check. `2 1` should print exactly `sa`.',
        demo: { a: [2, 1], b: [], commands: ['sa', 'pb', 'pa'] },
      },
      'rotate-reverse': {
        what: 'Make rotate and reverse rotate real.',
        example: '`ra` moves the top number to the bottom. `rra` brings the bottom up.',
        task: 'Run Check. `3 2 1` should sort through checker rules.',
        demo: { a: [3, 2, 1], b: [], commands: ['ra', 'sa', 'rra'] },
      },
      'parse-and-store': {
        what: 'Turn the words the user types into a pile of numbers.',
        example: 'Input `3 2 1` becomes pile `a`: 3 on top, then 2, then 1.',
        task: 'Run with `3 2 1`. For now, it should read cleanly and print nothing.',
        demo: { a: [3, 2, 1], b: [], commands: [], output: '(stored in a)' },
      },
      'trusted-moves': {
        what: 'Teach the program a few tiny moves, then test one small sort.',
        example: '`sa` swaps the top two numbers. Try it: 2 1 becomes 1 2.',
        task: 'Run with `2 1`. You should see one move: `sa`.',
        demo: { a: [2, 1], b: [], commands: ['sa', 'pb', 'pa', 'ra', 'rra'] },
      },
      'small-sort': {
        what: 'Sort three numbers by moving the biggest number away first.',
        example: 'For `3 2 1`, `ra` moves 3 to the bottom, then `sa` fixes 2 and 1.',
        task: 'Run with `3 2 1`. You should see `ra`, then `sa`.',
        demo: { a: [3, 2, 1], b: [], commands: ['ra', 'sa', 'rra'] },
      },
      'assign-indexes': {
        what: 'Turn values into sorted indexes before radix.',
        example: 'Values `40 10 30` become indexes 2, 0, 1 while values stay unchanged.',
        task: 'Finish `assign_indexes`, then run Check to confirm earlier sorting still works.',
        demo: { a: [40, 10, 30], b: [], commands: [], output: 'indexes: 2 0 1' },
      },
      'radix-one-bit': {
        what: 'Run one radix pass over the lowest bit.',
        example: 'Bit 0 decides whether each indexed node rotates in a or parks in b.',
        task: 'Run Check. The one-bit example should print the exact expected move list.',
        demo: { a: [2, 1, 3, 4], b: [], commands: ['ra', 'pb', 'pa'] },
      },
      'full-radix': {
        what: 'Repeat radix passes until larger stacks sort.',
        example: 'Each bit pass groups indexes a little more until all indexes are ordered.',
        task: 'Run Check with the fixed 8-value case and the negative-value case.',
        demo: { a: [8, 3, 5, 1], b: [], commands: ['pb', 'ra', 'pa'] },
      },
      'evaluator-habits': {
        what: 'Practice bad input so the project fails clearly and safely.',
        example: '`1 2 2` has a repeated number. Repeated numbers are not allowed.',
        task: 'Run with `1 2 2`. You should see `Error`.',
        demo: { a: [1, 2, 2], b: [], commands: [], output: 'Error' },
      },
    },
    ar: {
      'program-shell': {
        what: 'ابن برنامجا صغيرا يبقى صامتا عندما لا توجد أرقام.',
        example: 'بدون input لا توجد حركات. يجب أن تبقى النتيجة فارغة.',
        task: 'اضغط Run. يجب ألا ترى أي output.',
        demo: { a: [], b: [], commands: [], output: '(لا يوجد output)' },
      },
      'stack-cleanup': {
        what: 'ابن شكل عقدة linked list ونظفها بأمان.',
        example: 'العقدة تحفظ الرقم، و index الترتيب لاحقا، ومؤشر next.',
        task: 'أكمل `append_stack` و `cleanup_stack`، واكشف الحل فقط إذا علقت.',
        demo: { a: [3, 2, 1], b: [], commands: [], output: '(محفوظة كعقد)' },
      },
      'read-int': {
        what: 'اقرأ argument واحدا كـ int صالح.',
        example: '`-42` صالح. `42abc` و `-` و overflow غير صالحة.',
        task: 'شغل Check. يجب أن تقبل `42` وأن يطبع `2147483648` كلمة `Error`.',
        demo: { a: [42], b: [], commands: [], output: '(int صالح)' },
      },
      'parse-stack': {
        what: 'ابن stack a وارفض الأرقام المكررة.',
        example: '`1 2 2` تفشل لأن الرقم 2 الثاني محفوظ من قبل.',
        task: 'شغل Check. القوائم الصالحة صامتة، والتكرار يطبع `Error`.',
        demo: { a: [1, 2, 2], b: [], commands: [], output: 'Error' },
      },
      'swap-push': {
        what: 'اجعل swap و push تنقل العقد فعلا.',
        example: '`sa` تبدل 2 و 1، لذلك `2 1` تصبح مرتبة.',
        task: 'شغل Check. يجب أن تطبع `2 1` حركة `sa` فقط.',
        demo: { a: [2, 1], b: [], commands: ['sa', 'pb', 'pa'] },
      },
      'rotate-reverse': {
        what: 'اجعل rotate و reverse rotate حقيقيتين.',
        example: '`ra` تنقل أعلى رقم للأسفل. `rra` تجلب الرقم السفلي للأعلى.',
        task: 'شغل Check. يجب أن تترتب `3 2 1` حسب قواعد checker.',
        demo: { a: [3, 2, 1], b: [], commands: ['ra', 'sa', 'rra'] },
      },
      'parse-and-store': {
        what: 'حوّل الكلمات التي يكتبها المستخدم إلى كومة أرقام.',
        example: 'الإدخال `3 2 1` يصبح الكومة `a`: 3 في الأعلى، ثم 2، ثم 1.',
        task: 'شغل `3 2 1`. الآن يجب أن يقرأها بهدوء ولا يطبع شيئا.',
        demo: { a: [3, 2, 1], b: [], commands: [], output: '(محفوظة في a)' },
      },
      'trusted-moves': {
        what: 'علّم البرنامج حركات صغيرة، ثم اختبر ترتيب رقمين.',
        example: '`sa` تبدل أعلى رقمين. جربها: 2 1 تصبح 1 2.',
        task: 'شغل `2 1`. يجب أن ترى حركة واحدة: `sa`.',
        demo: { a: [2, 1], b: [], commands: ['sa', 'pb', 'pa', 'ra', 'rra'] },
      },
      'small-sort': {
        what: 'رتب ثلاثة أرقام بإبعاد أكبر رقم أولا.',
        example: 'مع `3 2 1`، حركة `ra` تنزل 3 للأسفل، ثم `sa` تصلح 2 و 1.',
        task: 'شغل `3 2 1`. يجب أن ترى `ra` ثم `sa`.',
        demo: { a: [3, 2, 1], b: [], commands: ['ra', 'sa', 'rra'] },
      },
      'assign-indexes': {
        what: 'حوّل القيم إلى indexes مرتبة قبل radix.',
        example: 'القيم `40 10 30` تصبح indexes 2 و 0 و 1 مع بقاء القيم كما هي.',
        task: 'أكمل `assign_indexes`، ثم شغل Check لتتأكد أن الترتيب الصغير ما زال يعمل.',
        demo: { a: [40, 10, 30], b: [], commands: [], output: 'indexes: 2 0 1' },
      },
      'radix-one-bit': {
        what: 'شغل pass واحدا من radix على أقل bit.',
        example: 'bit 0 يقرر هل العقدة تعمل rotate في a أو تنتقل مؤقتا إلى b.',
        task: 'شغل Check. مثال bit الواحد يجب أن يطبع قائمة الحركات المتوقعة.',
        demo: { a: [2, 1, 3, 4], b: [], commands: ['ra', 'pb', 'pa'] },
      },
      'full-radix': {
        what: 'كرر radix passes حتى تترتب الستاك الكبيرة.',
        example: 'كل bit pass يقرب indexes من ترتيبها إلى أن تكتمل.',
        task: 'شغل Check مع حالة 8 قيم وحالة القيم السالبة.',
        demo: { a: [8, 3, 5, 1], b: [], commands: ['pb', 'ra', 'pa'] },
      },
      'evaluator-habits': {
        what: 'تدرب على الإدخال الخاطئ حتى يفشل المشروع بوضوح وأمان.',
        example: '`1 2 2` فيها رقم مكرر. الأرقام المكررة غير مسموحة.',
        task: 'شغل `1 2 2`. يجب أن ترى `Error`.',
        demo: { a: [1, 2, 2], b: [], commands: [], output: 'Error' },
      },
    },
  } satisfies Record<Locale, Record<string, CoachStep>>

  const localizedContent = content[locale] as Record<string, CoachStep>

  return localizedContent[step.id] ?? {
    what: step.goal,
    example: step.explanation,
    task: step.suggestedStdin.trim()
      ? `Run with ${step.suggestedStdin.trim()}.`
      : 'Press Run and observe the output.',
    demo: { a: [], b: [], commands: [] },
  }
}

function getCodeNotes(locale: Locale): Array<CodeNote> {
  const notes = {
    en: [
      {
        path: 'src/main.c',
        start: 3,
        end: 15,
        title: 'main is the traffic controller',
        body: 'This function does not sort directly. It checks if there is input, asks the parser to build stack a, sorts only when needed, then frees memory before exiting.',
      },
      {
        path: 'src/parse.c',
        start: 3,
        end: 28,
        title: 'read_int checks one token',
        body: 'This helper reads one argument like "42" or "-3". It rejects empty text, non-digits, and numbers outside int before giving back the parsed value.',
      },
      {
        path: 'src/parse.c',
        start: 30,
        end: 39,
        title: 'has_value catches duplicates',
        body: 'This walks through the stack and asks: did we already store this number? If yes, the input is invalid for push_swap.',
      },
      {
        path: 'src/parse.c',
        start: 41,
        end: 59,
        title: 'parse_numbers builds stack a',
        body: 'This is the main parser loop. For each argument it reads an int, rejects duplicates, appends the value to stack a, and cleans up if anything fails.',
      },
      {
        path: 'src/stack.c',
        start: 3,
        end: 20,
        title: 'append_stack adds a node',
        body: 'This creates one linked-list node and puts it at the end of the stack, so the input order stays the same.',
      },
      {
        path: 'src/stack.c',
        start: 22,
        end: 31,
        title: 'stack_len counts nodes',
        body: 'This walks one node at a time and counts how many values are currently in the stack.',
      },
      {
        path: 'src/stack.c',
        start: 33,
        end: 42,
        title: 'stack_is_sorted checks the goal',
        body: 'This compares each value with the next one. If a bigger number appears before a smaller number, stack a is not sorted yet.',
      },
      {
        path: 'src/ops_swap_push.c',
        start: 3,
        end: 17,
        title: 'sa swaps the top two',
        body: 'This rewires the first two linked-list nodes. No values are copied; the node links change places, then it prints sa when requested.',
      },
      {
        path: 'src/ops_swap_push.c',
        start: 19,
        end: 31,
        title: 'pa moves b to a',
        body: 'This takes the top node from stack b and puts it on top of stack a. Think: push from b into a.',
      },
      {
        path: 'src/ops_swap_push.c',
        start: 33,
        end: 45,
        title: 'pb moves a to b',
        body: 'This takes the top node from stack a and puts it on top of stack b. It is the mirror of pa.',
      },
      {
        path: 'src/ops_rotate.c',
        start: 3,
        end: 21,
        title: 'ra sends top to bottom',
        body: 'This removes the first node from stack a and attaches it after the last node. The whole stack rotates upward.',
      },
      {
        path: 'src/ops_rotate.c',
        start: 23,
        end: 43,
        title: 'rra sends bottom to top',
        body: 'This finds the last node, detaches it from the end, and makes it the new top of stack a.',
      },
      {
        path: 'src/sort_small.c',
        start: 3,
        end: 10,
        title: 'max helpers answer one question',
        body: 'These helpers identify where the biggest of three numbers is. That lets sort_three choose one simple move.',
      },
      {
        path: 'src/sort_small.c',
        start: 13,
        end: 24,
        title: 'sort_three fixes three numbers',
        body: 'If the biggest number is in the way, rotate it away first. Then, if the top two are still reversed, use sa.',
      },
      {
        path: 'src/sort_small.c',
        start: 26,
        end: 35,
        title: 'sort_small chooses the tiny case',
        body: 'Two numbers only need sa when reversed. Three numbers go to sort_three. Bigger sorting comes later.',
      },
      {
        path: 'src/sort_large.c',
        start: 3,
        end: 6,
        title: 'sort_stack is the sorting entry point',
        body: 'For now this calls the small sorter. Later this is where a bigger algorithm like radix can plug in.',
      },
      {
        path: 'src/cleanup.c',
        start: 3,
        end: 12,
        title: 'cleanup_stack frees memory',
        body: 'This walks through the linked list and frees every node. It prevents leaks when the program finishes or parsing fails.',
      },
      {
        path: 'src/cleanup.c',
        start: 14,
        end: 18,
        title: 'write_error reports bad input',
        body: 'This prints Error to standard error and returns 1, matching the project expectation for invalid input.',
      },
      {
        path: 'includes/push_swap.h',
        start: 8,
        end: 12,
        title: 't_stack is one pile node',
        body: 'Each node stores one number and a pointer to the next node. A stack is a chain of these nodes.',
      },
      {
        path: 'Makefile',
        start: 1,
        end: 18,
        title: 'Makefile builds the program',
        body: 'The Makefile lists source files, compiles them with the required flags, and provides clean/fclean/re targets.',
      },
    ],
    ar: [
      {
        path: 'src/main.c',
        start: 3,
        end: 15,
        title: 'main ينظم الطريق',
        body: 'هذه الدالة لا ترتب بنفسها. تتحقق من وجود input، تطلب من parser بناء stack a، ترتب عند الحاجة، ثم تنظف الذاكرة.',
      },
      {
        path: 'src/parse.c',
        start: 3,
        end: 28,
        title: 'read_int تفحص كلمة واحدة',
        body: 'تقرأ argument واحدا مثل "42" أو "-3". ترفض النص الفارغ، الحروف، والأرقام خارج حدود int.',
      },
      {
        path: 'src/parse.c',
        start: 30,
        end: 39,
        title: 'has_value تمنع التكرار',
        body: 'تمر على الستاك وتسأل: هل خزنا هذا الرقم من قبل؟ إذا نعم، فالـ input غير صالح.',
      },
      {
        path: 'src/parse.c',
        start: 41,
        end: 59,
        title: 'parse_numbers تبني stack a',
        body: 'هذه هي حلقة الـ parser الأساسية. تقرأ كل رقم، ترفض التكرار، تضيفه إلى stack a، وتنظف إذا حدث خطأ.',
      },
      {
        path: 'src/ops_swap_push.c',
        start: 3,
        end: 17,
        title: 'sa تبدل أول رقمين',
        body: 'هذه تغير روابط أول عقدتين في linked list. لا تنسخ القيم؛ فقط تبدل أماكن العقد.',
      },
      {
        path: 'src/ops_swap_push.c',
        start: 19,
        end: 45,
        title: 'pa و pb ينقلان رقم بين الكومتين',
        body: 'pa تنقل أعلى رقم من b إلى a. pb تنقل أعلى رقم من a إلى b.',
      },
      {
        path: 'src/ops_rotate.c',
        start: 3,
        end: 43,
        title: 'rotate يحرك الطرف',
        body: 'ra تنقل أول رقم إلى الأسفل. rra تنقل آخر رقم إلى الأعلى.',
      },
      {
        path: 'src/sort_small.c',
        start: 13,
        end: 35,
        title: 'sort_small يرتب الحالات الصغيرة',
        body: 'رقمان يحتاجان sa فقط إذا كانا معكوسين. ثلاثة أرقام تستخدم فكرة إبعاد الأكبر ثم إصلاح الأعلى.',
      },
      {
        path: 'src/cleanup.c',
        start: 3,
        end: 18,
        title: 'cleanup و write_error',
        body: 'cleanup_stack تحرر الذاكرة. write_error تطبع Error عندما يكون الإدخال غير صالح.',
      },
    ],
  } satisfies Record<Locale, Array<CodeNote>>

  return notes[locale]
}

function getCodeLineNotes(locale: Locale): Array<CodeLineNote> {
  const notes = {
    en: [
      {
        path: 'src/parse.c',
        line: 10,
        title: 'Accept an optional sign',
        body: 'This allows numbers like -3 or +8. If the first character is a sign, the parser handles it before reading digits.',
      },
      {
        path: 'src/parse.c',
        line: 13,
        title: 'Remember negative numbers',
        body: 'If the sign is -, we store -1. Later the final number is multiplied by this sign.',
      },
      {
        path: 'src/parse.c',
        line: 17,
        title: 'Reject only a sign',
        body: 'A string like "-" or "+" is not a number. After skipping the sign, there must still be at least one digit.',
      },
      {
        path: 'src/parse.c',
        line: 18,
        title: 'Read digits one by one',
        body: 'This loop continues while the current character is between 0 and 9. It stops as soon as it sees anything else.',
      },
      {
        path: 'src/parse.c',
        line: 20,
        title: 'Build the number',
        body: 'Move the old value one digit left by multiplying by 10, then add the new digit. The expression *str++ - 0 turns a digit character into its numeric value.',
      },
      {
        path: 'src/parse.c',
        line: 21,
        title: 'Check int limits early',
        body: 'After each new digit, we check whether the signed value is bigger than INT_MAX or smaller than INT_MIN. If yes, parsing fails.',
      },
      {
        path: 'src/parse.c',
        line: 24,
        title: 'Reject trailing junk',
        body: 'If something remains after the digit loop, like abc in 123abc, this is not a valid integer.',
      },
      {
        path: 'src/parse.c',
        line: 26,
        title: 'Give the number back',
        body: 'out points to the caller variable. This writes the parsed int into that variable.',
      },
      {
        path: 'src/parse.c',
        line: 34,
        title: 'Duplicate check',
        body: 'If any existing stack node already has this value, return 1 to say: yes, duplicate found.',
      },
      {
        path: 'src/parse.c',
        line: 36,
        title: 'Move to the next node',
        body: 'This walks forward through the linked list, one node at a time.',
      },
      {
        path: 'src/parse.c',
        line: 47,
        title: 'Skip argv[0]',
        body: 'argv[0] is the program name. Real numbers start at argv[1], so i starts at 1.',
      },
      {
        path: 'src/parse.c',
        line: 51,
        title: 'Two ways to fail',
        body: 'This fails if the token is not a clean int, or if the number is already in stack a.',
      },
      {
        path: 'src/parse.c',
        line: 53,
        title: 'Clean before giving up',
        body: 'If parsing fails halfway, free the stack already built so we do not leak memory.',
      },
      {
        path: 'src/parse.c',
        line: 56,
        title: 'Store valid number',
        body: 'Only after the number is valid and unique do we add it to stack a.',
      },
      {
        path: 'src/ops_swap_push.c',
        line: 7,
        title: 'Guard small stacks',
        body: 'sa needs at least two nodes. If stack a is missing or has one node, there is nothing to swap.',
      },
      {
        path: 'src/ops_swap_push.c',
        line: 12,
        title: 'Detach first from second',
        body: 'The old first node now points after the old second node. This is the first link change in the swap.',
      },
      {
        path: 'src/ops_swap_push.c',
        line: 13,
        title: 'Put second before first',
        body: 'The old second node now points to the old first node, so their order is reversed.',
      },
      {
        path: 'src/ops_swap_push.c',
        line: 14,
        title: 'Update the stack top',
        body: 'The stack pointer must now point to the old second node, because it became the new top.',
      },
      {
        path: 'src/ops_swap_push.c',
        line: 24,
        title: 'Remove top from b',
        body: 'b now starts at the next node, because the old top is being moved away.',
      },
      {
        path: 'src/ops_swap_push.c',
        line: 25,
        title: 'Attach node to a',
        body: 'The moved node points to the old top of a, so it can become the new first node.',
      },
      {
        path: 'src/ops_swap_push.c',
        line: 26,
        title: 'New top of a',
        body: 'a now points to the moved node. The push is complete.',
      },
      {
        path: 'src/ops_rotate.c',
        line: 10,
        title: 'Second node becomes top',
        body: 'For ra, the first node leaves the top, so stack a now starts at the second node.',
      },
      {
        path: 'src/ops_rotate.c',
        line: 11,
        title: 'Detach old top',
        body: 'The old first node is temporarily alone so it can be placed at the bottom safely.',
      },
      {
        path: 'src/ops_rotate.c',
        line: 14,
        title: 'Find the bottom',
        body: 'This loop walks until last points to the final node in the stack.',
      },
      {
        path: 'src/ops_rotate.c',
        line: 15,
        title: 'Attach old top at bottom',
        body: 'The old top becomes the last node. That is exactly what rotate means.',
      },
      {
        path: 'src/sort_small.c',
        line: 16,
        title: 'Already sorted? stop',
        body: 'If the three numbers are already in order, do nothing and print no moves.',
      },
      {
        path: 'src/sort_small.c',
        line: 18,
        title: 'Biggest on top',
        body: 'If the biggest number is first, ra moves it to the bottom where it belongs.',
      },
      {
        path: 'src/sort_small.c',
        line: 20,
        title: 'Biggest in second place',
        body: 'If the biggest number is second, rra brings the bottom number up and moves the biggest away from the middle.',
      },
      {
        path: 'src/sort_small.c',
        line: 22,
        title: 'Fix top two',
        body: 'After the biggest is handled, if the top two are reversed, sa swaps them.',
      },
      {
        path: 'src/cleanup.c',
        line: 7,
        title: 'Save next before freeing',
        body: 'Once a node is freed, we cannot safely read its next pointer. So we save next first.',
      },
      {
        path: 'src/cleanup.c',
        line: 8,
        title: 'Free current node',
        body: 'This releases the memory for the current stack node.',
      },
      {
        path: 'src/cleanup.c',
        line: 9,
        title: 'Move forward',
        body: 'The stack pointer moves to the saved next node, and the loop continues.',
      },
    ],
    ar: [
      {
        path: 'src/parse.c',
        line: 20,
        title: 'ابن الرقم',
        body: 'نضرب القيمة القديمة في 10 ثم نضيف الرقم الجديد. هذا يحول قراءة 4 ثم 2 إلى 42.',
      },
      {
        path: 'src/parse.c',
        line: 21,
        title: 'افحص حدود int',
        body: 'بعد كل رقم جديد نتأكد أن القيمة لا تتجاوز INT_MAX ولا تنزل تحت INT_MIN.',
      },
      {
        path: 'src/parse.c',
        line: 51,
        title: 'سببان للفشل',
        body: 'يفشل إذا لم يكن النص رقما صحيحا، أو إذا كان الرقم مكررا في stack a.',
      },
      {
        path: 'src/ops_swap_push.c',
        line: 14,
        title: 'حدّث رأس الستاك',
        body: 'بعد التبديل، يجب أن يشير a إلى العقدة التي صارت في الأعلى.',
      },
      {
        path: 'src/sort_small.c',
        line: 22,
        title: 'أصلح أول رقمين',
        body: 'بعد إبعاد الأكبر، إذا بقي أول رقمين بالعكس، تستخدم sa.',
      },
    ],
  } satisfies Record<Locale, Array<CodeLineNote>>

  return notes[locale]
}

export function ProjectLab({
  projectId,
  guidePortalId,
  hideGuidePanel = false,
  toolbarPortalId,
}: {
  projectId: string
  guidePortalId?: string
  hideGuidePanel?: boolean
  toolbarPortalId?: string
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const locale = asLocale(localeFromPath(pathname))
  const project = useMemo(() => getGuidedProject(projectId, locale), [locale, projectId])
  const t = copy[locale]
  const storageKey = `guided-project:${projectId}:active-step`
  const completedStorageKey = `guided-project:${projectId}:completed-steps`
  const [activeStepId, setActiveStepId] = useState<string | undefined>(() =>
    project ? project.steps[0]?.id : undefined,
  )
  const [guideTarget, setGuideTarget] = useState<HTMLElement | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!project) return
    setActiveStepId(getStoredStep(project, storageKey))
  }, [project, storageKey])

  useEffect(() => {
    if (!project || typeof window === 'undefined') return
    const raw = window.localStorage.getItem(completedStorageKey)
    const known = new Set(project.steps.map((step) => step.id))
    const parsed = raw
      ? raw
          .split(',')
          .map((id) => id.trim())
          .filter((id) => known.has(id))
      : []
    setCompletedStepIds(new Set(parsed))
  }, [completedStorageKey, project])

  useEffect(() => {
    if (!guidePortalId || hideGuidePanel) {
      setGuideTarget(null)
      return
    }

    setGuideTarget(document.getElementById(guidePortalId))
  }, [guidePortalId, hideGuidePanel])

  useEffect(() => {
    setShowHints(false)
  }, [activeStepId])

  if (!project) {
    return <p className="project-lab-missing">{t.missing}</p>
  }

  const activeStep =
    getGuidedProjectStep(project, activeStepId ?? '') ?? project.steps[0]

  const loadStep = (stepId: string) => {
    setActiveStepId(stepId)
    setShowHints(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, stepId)
    }
  }

  const markActiveStepComplete = () => {
    setCompletedStepIds((currentIds) => {
      const nextIds = new Set(currentIds).add(activeStep.id)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(completedStorageKey, [...nextIds].join(','))
      }
      return nextIds
    })
  }

  const activeStepIndex = project.steps.findIndex((step) => step.id === activeStep.id)
  const previousStep = activeStepIndex > 0 ? project.steps[activeStepIndex - 1] : null
  const nextStep =
    activeStepIndex >= 0 && activeStepIndex < project.steps.length - 1
      ? project.steps[activeStepIndex + 1]
      : null
  const coach = getStepCoach(activeStep, locale)

  const labPanel = (
    <div className="project-lab-panel">
      <div className="project-step-rail">
        <div className="project-step-progress" aria-label={project.title}>
          <div>
            <span>
              {t.step} {activeStepIndex + 1} {t.of} {project.steps.length}
            </span>
            <strong>{activeStep.title}</strong>
            <em>{activeStep.activePath}</em>
          </div>
          <div
            className="project-step-meter"
            aria-hidden="true"
            style={
              {
                '--step-progress': `${((activeStepIndex + 1) / project.steps.length) * 100}%`,
              } as CSSProperties
            }
          >
            <span />
          </div>
        </div>

        <div className="project-step-list" aria-label={t.load}>
          {project.steps.map((step, index) => {
            const isComplete = completedStepIds.has(step.id)
            return (
              <button
                className={`${step.id === activeStep.id ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}
                key={step.id}
                onClick={() => loadStep(step.id)}
                type="button"
              >
                <span>
                  {isComplete ? (
                    <CheckCircle2 aria-hidden="true" size={14} />
                  ) : (
                    <strong>{index + 1}</strong>
                  )}
                  {step.title}
                </span>
                <em>{step.activePath}</em>
              </button>
            )
          })}
        </div>
      </div>

      <div className="project-step-card">
        <div className="project-step-title">
          <Target aria-hidden="true" size={19} />
          <div>
            <span>{t.objective}</span>
            <h3>{coach.what}</h3>
          </div>
        </div>
        <StepSandbox
          key={activeStep.id}
          coach={coach}
          labels={{
            empty: t.empty,
            pileA: t.pileA,
            pileB: t.pileB,
            reset: t.reset,
            tinyExample: t.tinyExample,
            tryMoves: t.tryMoves,
            yourTask: t.yourTask,
            output: t.output,
          }}
        />
        <StepDetailList label={t.filesToEdit} items={activeStep.filesToEdit} codeItems />
        <StepDetailList label={t.todos} items={activeStep.todos} />
        <StepDetailList label={t.definitionOfDone} items={activeStep.definitionOfDone} />
        <OperationCheatSheet label={t.operations} />
        <div className="project-step-hints">
          <button
            aria-expanded={showHints}
            className="project-hint-toggle"
            onClick={() => setShowHints((isOpen) => !isOpen)}
            type="button"
          >
            <Lightbulb aria-hidden="true" size={16} />
            <span>{showHints ? t.hideHints : t.showHints}</span>
          </button>
          {showHints ? (
            <ul>
              {activeStep.hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          ) : null}
        </div>
        {expectedText(activeStep) ? (
          <p className="project-step-expected">
            <strong>{t.expected}:</strong> <code>{expectedText(activeStep)}</code>
          </p>
        ) : null}
        <div className="project-step-nav">
          <button
            disabled={!previousStep}
            onClick={() => previousStep && loadStep(previousStep.id)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={15} />
            <span>{previousStep ? t.back : t.start}</span>
          </button>
          <button
            disabled={!nextStep}
            onClick={() => nextStep && loadStep(nextStep.id)}
            type="button"
          >
            <span>{nextStep ? t.next : t.done}</span>
            <ChevronRight aria-hidden="true" size={15} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="project-lab" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="project-lab-heading">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{project.title}</h2>
        <p>{project.description}</p>
      </div>

      <CodeWorkspace
        locale={locale}
        initialLanguage={project.language}
        initialTemplate={activeStep.template}
        initialStdin={activeStep.suggestedStdin}
        workspaceKey={`${project.id}:${activeStep.id}`}
        allowLanguageSwitch={false}
        solutionTemplate={activeStep.solutionTemplate}
        checkCases={activeStep.checkCases}
        onChecksComplete={markActiveStepComplete}
        codeNotes={getCodeNotes(locale)}
        codeLineNotes={getCodeLineNotes(locale)}
        exportFilename={`${project.id}-${activeStep.id}.zip`}
        labPanel={hideGuidePanel || guideTarget ? null : labPanel}
        toolbarPortalId={toolbarPortalId}
        toolbarStart={
          <>
            <a
              href={`/${locale}#projects`}
              className="editor-back-link"
              aria-label={t.projects}
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </a>
            <div className="editor-project-title">
              <strong>push_swap</strong>
              <span>{activeStep.title}</span>
            </div>
          </>
        }
      />
      {!hideGuidePanel && guideTarget ? createPortal(labPanel, guideTarget) : null}
    </div>
  )
}

function StepSandbox({
  coach,
  labels,
}: {
  coach: CoachStep
  labels: Record<
    | 'empty'
    | 'output'
    | 'pileA'
    | 'pileB'
    | 'reset'
    | 'tinyExample'
    | 'tryMoves'
    | 'yourTask',
    string
  >
}) {
  const [a, setA] = useState(coach.demo.a)
  const [b, setB] = useState(coach.demo.b)

  const reset = () => {
    setA(coach.demo.a)
    setB(coach.demo.b)
  }

  const applyCommand = (command: string) => {
    const next = moveStacks(command, a, b)
    setA(next.a)
    setB(next.b)
  }

  return (
    <div className="step-coach">
      <section className="step-coach-block">
        <span>{labels.tinyExample}</span>
        <p>{renderInlineCode(coach.example)}</p>
        <div className="stack-sandbox">
          <Pile label={labels.pileA} values={a} emptyLabel={labels.empty} />
          <Pile label={labels.pileB} values={b} emptyLabel={labels.empty} />
        </div>
        {coach.demo.output ? (
          <p className="step-demo-output">
            <strong>{labels.output}</strong>
            <code>{coach.demo.output}</code>
          </p>
        ) : null}
        {coach.demo.commands.length ? (
          <div className="command-playground">
            <span>{labels.tryMoves}</span>
            <div>
              {coach.demo.commands.map((command) => (
                <button key={command} onClick={() => applyCommand(command)} type="button">
                  {command}
                </button>
              ))}
              <button aria-label={labels.reset} onClick={reset} type="button">
                <RotateCcw aria-hidden="true" size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </section>
      <section className="step-coach-block is-task">
        <span>{labels.yourTask}</span>
        <p>{renderInlineCode(coach.task)}</p>
      </section>
    </div>
  )
}

function StepDetailList({
  label,
  items,
  codeItems = false,
}: {
  label: string
  items: Array<string>
  codeItems?: boolean
}) {
  if (!items.length) return null

  return (
    <section className="step-detail-list">
      <span>{label}</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{codeItems ? <code>{item}</code> : renderInlineCode(item)}</li>
        ))}
      </ul>
    </section>
  )
}

function OperationCheatSheet({ label }: { label: string }) {
  return (
    <section className="operation-cheat-sheet" aria-label={label}>
      <span>{label}</span>
      <div>
        {[
          ['sa', 'swap a'],
          ['pa', 'b to a'],
          ['pb', 'a to b'],
          ['ra', 'top to bottom'],
          ['rra', 'bottom to top'],
        ].map(([op, meaning]) => (
          <p key={op}>
            <code>{op}</code>
            <small>{meaning}</small>
          </p>
        ))}
      </div>
    </section>
  )
}

function Pile({
  label,
  values,
  emptyLabel,
}: {
  label: string
  values: Array<number>
  emptyLabel: string
}) {
  return (
    <div className="sandbox-pile">
      <span>{label}</span>
      <div>
        {values.length ? (
          values.map((value, index) => <b key={`${value}-${index}`}>{value}</b>)
        ) : (
          <em>{emptyLabel}</em>
        )}
      </div>
    </div>
  )
}

function moveStacks(command: string, a: Array<number>, b: Array<number>) {
  const nextA = [...a]
  const nextB = [...b]

  if (command === 'sa') swapTop(nextA)
  if (command === 'sb') swapTop(nextB)
  if (command === 'ss') {
    swapTop(nextA)
    swapTop(nextB)
  }
  if (command === 'pa' && nextB.length) nextA.unshift(nextB.shift()!)
  if (command === 'pb' && nextA.length) nextB.unshift(nextA.shift()!)
  if (command === 'ra') rotate(nextA)
  if (command === 'rb') rotate(nextB)
  if (command === 'rr') {
    rotate(nextA)
    rotate(nextB)
  }
  if (command === 'rra') reverseRotate(nextA)
  if (command === 'rrb') reverseRotate(nextB)
  if (command === 'rrr') {
    reverseRotate(nextA)
    reverseRotate(nextB)
  }

  return { a: nextA, b: nextB }
}

function swapTop(values: Array<number>) {
  if (values.length < 2) return
  const first = values[0]
  values[0] = values[1]
  values[1] = first
}

function rotate(values: Array<number>) {
  if (values.length < 2) return
  values.push(values.shift()!)
}

function reverseRotate(values: Array<number>) {
  if (values.length < 2) return
  values.unshift(values.pop()!)
}
