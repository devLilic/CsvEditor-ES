import React, { type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CsvProvider, useEntities } from '@/features/csv-editor'
import { useCsvContext } from '../context/CsvContext'
import { TITLE_DIVIDER_MARKER } from '../domain/plateauTitleList'
import { csvService } from '../services/csvService'

function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(CsvProvider, null, children)
}

function useHarness() {
    const { dispatch, state } = useCsvContext()
    const entities = useEntities()

    const rows = state.entities.sections.find((section) => section.id === state.activeSectionId)?.rows ?? []
    const items = rows.flatMap((row) => {
        if (row.title) return [`title:${row.id}:${row.title.nr ?? ''}:${row.title.title}`]
        if (row.titleDivider) return [`divider:${row.titleDivider.id}`]
        return []
    })

    return {
        ...entities,
        items,
        seedInvited() {
            dispatch({
                type: 'CSV_LOADED',
                payload: {
                    sections: [{
                        id: 'invited-1',
                        kind: 'invited',
                        rows: [
                            { id: 'row-title-1', title: { id: 'title-1', title: 'Titlu 1' } },
                            { id: 'row-title-2', title: { id: 'title-2', title: 'Titlu 2' } },
                        ],
                    }],
                },
            })
        },
        seedBeta() {
            dispatch({
                type: 'CSV_LOADED',
                payload: {
                    sections: [
                        {
                            id: 'beta-1',
                            kind: 'beta',
                            betaIndex: 1,
                            betaTitle: 'Beta',
                            rows: [{ id: 'beta-title-row', title: { id: 'beta-title', title: 'Titlu beta' } }],
                        },
                        {
                            id: 'invited-1',
                            kind: 'invited',
                            rows: [
                                { id: 'row-title-1', title: { id: 'title-1', title: 'Titlu 1' } },
                                { id: 'divider-row', titleDivider: { type: 'divider', id: 'divider-1' } },
                            ],
                        },
                    ],
                },
            })
            dispatch({ type: 'SECTION_SET_ACTIVE', payload: { sectionId: 'beta-1' } })
        },
    }
}

describe('usePlateauTitleDividers operations through useEntities', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('adds without selection at the end', async () => {
        vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        await act(async () => {
            await result.current.addPlateauTitleDivider()
        })

        expect(result.current.items.join('|')).toMatch(/^title:row-title-1:1:Titlu 1\|title:row-title-2:2:Titlu 2\|divider:/)
    })

    it('adds after afterItemId when it is valid', async () => {
        vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        await act(async () => {
            await result.current.addPlateauTitleDivider({ afterItemId: 'row-title-1' })
        })

        expect(result.current.items.join('|')).toMatch(/^title:row-title-1:1:Titlu 1\|divider:[^|]+\|title:row-title-2:2:Titlu 2$/)
    })

    it('adds at the end when afterItemId is invalid', async () => {
        vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        await act(async () => {
            await result.current.addPlateauTitleDivider({ afterItemId: 'missing-item' })
        })

        expect(result.current.items.join('|')).toMatch(/\|divider:[^|]+$/)
    })

    it('refuses add when it would create consecutive dividers', async () => {
        const writeSpy = vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        await act(async () => {
            await result.current.addPlateauTitleDivider({ afterItemId: 'row-title-1' })
        })
        let addResult: Awaited<ReturnType<typeof result.current.addPlateauTitleDivider>>
        await act(async () => {
            addResult = await result.current.addPlateauTitleDivider({ afterItemId: 'row-title-1' })
        })

        expect(addResult!).toEqual({
            ok: false,
            error: 'Nu pot fi adăugate două separatoare consecutive.',
        })
        expect(writeSpy).toHaveBeenCalledTimes(1)
        expect(result.current.items.filter((item) => item.startsWith('divider:'))).toHaveLength(1)
    })

    it('adds when Edit Mode is OFF because the hook has no edit-mode dependency', async () => {
        vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        let addResult: Awaited<ReturnType<typeof result.current.addPlateauTitleDivider>>
        await act(async () => {
            addResult = await result.current.addPlateauTitleDivider()
        })

        expect(addResult!).toEqual({ ok: true, dividerId: expect.any(String) })
        expect(result.current.items.some((item) => item.startsWith('divider:'))).toBe(true)
    })

    it('refuses add in BETA', async () => {
        const writeSpy = vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedBeta())
        let addResult: Awaited<ReturnType<typeof result.current.addPlateauTitleDivider>>
        await act(async () => {
            addResult = await result.current.addPlateauTitleDivider()
        })

        expect(addResult!).toEqual({ ok: false, error: 'TITLE_DIVIDER_NOT_ALLOWED' })
        expect(writeSpy).not.toHaveBeenCalled()
    })

    it('delete removes only the divider', async () => {
        vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        let dividerId = ''
        await act(async () => {
            const addResult = await result.current.addPlateauTitleDivider({ afterItemId: 'row-title-1' })
            dividerId = addResult.dividerId ?? ''
        })
        await act(async () => {
            await result.current.deletePlateauTitleDivider(dividerId)
        })

        expect(result.current.items.join('|')).toBe('title:row-title-1:1:Titlu 1|title:row-title-2:2:Titlu 2')
    })

    it('delete keeps neighboring titles', async () => {
        vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        let dividerId = ''
        await act(async () => {
            const addResult = await result.current.addPlateauTitleDivider({ afterItemId: 'row-title-1' })
            dividerId = addResult.dividerId ?? ''
        })
        await act(async () => {
            await result.current.deletePlateauTitleDivider(dividerId)
        })

        expect(result.current.items).toEqual([
            'title:row-title-1:1:Titlu 1',
            'title:row-title-2:2:Titlu 2',
        ])
    })

    it('refuses delete in BETA', async () => {
        const writeSpy = vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedBeta())
        let deleteResult: Awaited<ReturnType<typeof result.current.deletePlateauTitleDivider>>
        await act(async () => {
            deleteResult = await result.current.deletePlateauTitleDivider('divider-1')
        })

        expect(deleteResult!).toEqual({ ok: false, error: 'TITLE_DIVIDER_NOT_ALLOWED' })
        expect(writeSpy).not.toHaveBeenCalled()
    })

    it('successful add triggers existing CSV persistence', async () => {
        const writeSpy = vi.spyOn(csvService, 'write').mockResolvedValue({ ok: true })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        await act(async () => {
            await result.current.addPlateauTitleDivider()
        })

        expect(writeSpy).toHaveBeenCalledTimes(1)
        expect(writeSpy.mock.calls[0][0]).toContain(TITLE_DIVIDER_MARKER)
    })

    it('write failure returns a controlled result', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(csvService, 'write').mockResolvedValue({ ok: false, error: 'WRITE_FAILED' })
        const { result } = renderHook(() => useHarness(), { wrapper })

        act(() => result.current.seedInvited())
        let addResult: Awaited<ReturnType<typeof result.current.addPlateauTitleDivider>>
        await act(async () => {
            addResult = await result.current.addPlateauTitleDivider()
        })

        await waitFor(() => {
            expect(addResult).toEqual({ ok: false, error: 'WRITE_FAILED' })
        })
    })
})
