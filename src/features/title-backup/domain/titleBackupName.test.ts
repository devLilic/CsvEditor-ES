import { describe, expect, it } from 'vitest'
import {
    buildTitleBackupBaseName,
    findNextTitleBackupName,
    formatTitleBackupDate,
} from './titleBackupName'

describe('title backup name', () => {
    const date = new Date('2026-07-03T12:00:00')

    it('formats the date correctly', () => {
        expect(formatTitleBackupDate(date)).toBe('03_07_2026')
    })

    it('generates the name without suffix', () => {
        expect(buildTitleBackupBaseName(date)).toBe('03_07_2026_titluri.csv')
        expect(findNextTitleBackupName(date, [])).toBe('03_07_2026_titluri.csv')
    })

    it('generates _2', () => {
        expect(findNextTitleBackupName(date, [
            '03_07_2026_titluri.csv',
        ])).toBe('03_07_2026_titluri_2.csv')
    })

    it('generates _3', () => {
        expect(findNextTitleBackupName(date, [
            '03_07_2026_titluri.csv',
            '03_07_2026_titluri_2.csv',
        ])).toBe('03_07_2026_titluri_3.csv')
    })

    it('ignores normal backups', () => {
        expect(findNextTitleBackupName(date, [
            'proiect_2026-07-03_12-00-00.csv',
            'backup_2026-07-03_12-00-00.csv',
        ])).toBe('03_07_2026_titluri.csv')
    })

    it('finds the first free suffix', () => {
        expect(findNextTitleBackupName(date, [
            '03_07_2026_titluri.csv',
            '03_07_2026_titluri_2.csv',
            '03_07_2026_titluri_4.csv',
        ])).toBe('03_07_2026_titluri_3.csv')
    })
})
