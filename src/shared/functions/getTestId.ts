import { IS_TESTING } from './env'

export const getTestId = (id: string): string | undefined => {
  if (IS_TESTING) return id
}
