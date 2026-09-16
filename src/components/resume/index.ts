import ResumeDownloadButton from './ui/resume-download-button.astro'
import ResumeHeader from './ui/resume-header.astro'
import ResumeItem from './ui/resume-item.astro'
import ResumePositions from './ui/resume-positions.astro'

export { RESUME_FILENAMES_BY_LOCALE } from './constants'
export { getDurationTextFromMonths } from './functions/getDurationTextFromMonths'
export { getResumeMarkdown } from './functions/getResumeMarkdown'
export { getTotalDurationText } from './functions/getTotalDurationText'

export { ResumeDownloadButton, ResumeHeader, ResumeItem, ResumePositions }
