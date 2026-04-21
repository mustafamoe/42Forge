import { describe, expect, it } from 'vitest'
import {
  getGuidedProject,
  getGuidedProjectIds,
  getGuidedProjectStep,
} from './guided-projects'

describe('guided project registry', () => {
  it('lists the push_swap lab', () => {
    expect(getGuidedProjectIds()).toContain('push-swap')
  })

  it('returns localized projects with runnable checkpoint snapshots', () => {
    const project = getGuidedProject('push-swap', 'en')

    expect(project?.language).toBe('c')
    expect(project?.steps).toHaveLength(11)
    expect(project?.steps[0]?.template.files.some((file) => file.path === 'src/main.c')).toBe(
      true,
    )
    expect(project?.steps[9]?.suggestedStdin).toBe('8 3 5 1 7 2 6 4\n')
  })

  it('finds steps by id and clones starter and solution snapshots per lookup', () => {
    const firstLookup = getGuidedProject('push-swap', 'en')
    const secondLookup = getGuidedProject('push-swap', 'en')

    expect(firstLookup).toBeTruthy()
    expect(secondLookup).toBeTruthy()

    const firstStep = getGuidedProjectStep(firstLookup!, 'full-radix')
    const secondStep = getGuidedProjectStep(secondLookup!, 'full-radix')

    expect(firstStep?.activePath).toBe('src/sort_large.c')
    expect(firstStep?.template.files).not.toBe(secondStep?.template.files)
    expect(firstStep?.solutionTemplate.files).not.toBe(secondStep?.solutionTemplate.files)
    expect(firstStep?.template.files).not.toBe(firstStep?.solutionTemplate.files)
  })

  it('includes beginner-facing check cases across the full project', () => {
    const project = getGuidedProject('push-swap', 'en')
    const checks = project?.steps.flatMap((step) => step.checkCases) ?? []

    expect(checks.some((check) => check.id === 'duplicate')).toBe(true)
    expect(checks.some((check) => check.id === 'perm-321')).toBe(true)
    expect(checks.some((check) => check.id === 'eight-values')).toBe(true)
    expect(checks.some((check) => check.mode === 'error-output')).toBe(true)
    expect(checks.some((check) => check.mode === 'push-swap-sorted')).toBe(true)
  })
})
