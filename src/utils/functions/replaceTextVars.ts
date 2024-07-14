export const replaceTextVars = (text: string, vars: { [key: string]: string }) => {
  let result = text

  for (const replace in vars) {
    result = result.replaceAll(replace, vars[replace])
  }

  return result
}
