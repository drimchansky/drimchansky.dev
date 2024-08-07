import { differenceInMonths } from 'date-fns'

type TPositionInfo = {
  dateEnd?: Date
  dateStart: Date
  isCurrent?: boolean
}

// TODO: career breaks?
// TODO: several positions?

export const getCareerDurationInMonths = (positions: TPositionInfo[]): number => {
  let hasCurrent = false
  let workStartDate
  let workEndDate

  for (const position of positions) {
    const { dateEnd, dateStart, isCurrent } = position

    if (isCurrent) {
      hasCurrent = true
      workEndDate = new Date()
    }

    if (!workStartDate || workStartDate > dateStart) workStartDate = dateStart
    if (!hasCurrent && dateEnd && (!workEndDate || workEndDate < dateEnd)) workEndDate = dateEnd
  }

  return (workEndDate && workStartDate && differenceInMonths(workEndDate, workStartDate)) || 0
}
