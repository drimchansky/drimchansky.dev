export const getTestId = (id: string): string | undefined => {
  if (process.env.TESTING) return id
}
