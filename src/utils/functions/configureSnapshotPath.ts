import type { TestInfo } from '@playwright/test'

export const configureSnapshotPath = (testInfo: TestInfo) => {
  const originalSnapshotPath = testInfo.snapshotPath
  testInfo.snapshotPath = snapshotName => {
    const result = originalSnapshotPath
      .apply(testInfo, [snapshotName])
      .replace('.txt', '.json')
      .replace('-chromium', '')
      .replace('-linux', '')
      .replace('-darwin', '')

    return result
  }
  return testInfo.snapshotPath
}
