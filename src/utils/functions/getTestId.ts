export const getTestId = (id: string): string | undefined => {
  return import.meta.env.PROD ? undefined : id
}
