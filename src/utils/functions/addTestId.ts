const isDev = import.meta.env.DEV

export const addTestId = (name: string) => {
  return isDev && { 'data-testid': name }
}
