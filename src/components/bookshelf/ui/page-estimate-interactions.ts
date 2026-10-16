const VIEWPORT_PADDING = 16
const TRIGGER_GAP = 8
const POINTER_EXIT_DELAY = 120

const positionPanel = (button: HTMLButtonElement, panel: HTMLElement) => {
  if (!panel.isConnected || !panel.matches(':popover-open')) return
  const viewport = window.visualViewport
  const width = viewport?.width ?? window.innerWidth
  const height = viewport?.height ?? window.innerHeight
  const left = viewport?.offsetLeft ?? 0
  const top = viewport?.offsetTop ?? 0
  const trigger = button.getBoundingClientRect()
  const below = top + height - trigger.bottom - TRIGGER_GAP - VIEWPORT_PADDING
  const above = trigger.top - top - TRIGGER_GAP - VIEWPORT_PADDING
  panel.style.maxInlineSize = `${width - VIEWPORT_PADDING * 2}px`
  panel.style.maxBlockSize = `${Math.max(1, Math.min(height - VIEWPORT_PADDING * 2, Math.max(above, below)))}px`
  panel.style.margin = '0'
  const bounds = panel.getBoundingClientRect()
  const x = Math.max(left + VIEWPORT_PADDING, Math.min(trigger.left, left + width - bounds.width - VIEWPORT_PADDING))
  const y = below >= above ? trigger.bottom + TRIGGER_GAP : trigger.top - bounds.height - TRIGGER_GAP
  const clampedY = Math.max(top + VIEWPORT_PADDING, Math.min(y, top + height - bounds.height - VIEWPORT_PADDING))
  panel.style.inset = `${clampedY}px auto auto ${x}px`
  panel.toggleAttribute('data-scrollable', panel.scrollHeight > panel.clientHeight)
}

let cleanup: () => void = () => undefined

const setupEstimates = () => {
  cleanup()
  const controller = new AbortController()
  const { signal } = controller
  const widgets = Array.from(document.querySelectorAll<HTMLElement>('[data-page-estimate]')).flatMap(wrapper => {
    const button = wrapper.querySelector<HTMLButtonElement>('button[popovertarget]')
    const panel = wrapper.querySelector<HTMLElement>('[popover]')
    if (!button || !panel) return []
    let isPinned = false
    let isDismissed = false
    let isPointerActivation = false
    let closeTimer: number | undefined
    const show = () => {
      window.clearTimeout(closeTimer)
      if (!isDismissed && !panel.matches(':popover-open')) {
        panel.showPopover()
        positionPanel(button, panel)
      }
    }
    const hide = () => {
      if (panel.matches(':popover-open')) panel.hidePopover()
    }
    wrapper.addEventListener(
      'pointerenter',
      event => {
        if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover)').matches) return
        isDismissed = false
        show()
      },
      { signal }
    )
    wrapper.addEventListener(
      'pointerleave',
      () => {
        isDismissed = false
        if (!isPinned && document.activeElement !== button) closeTimer = window.setTimeout(hide, POINTER_EXIT_DELAY)
      },
      { signal }
    )
    button.addEventListener(
      'pointerdown',
      () => {
        isPointerActivation = true
      },
      { signal }
    )
    button.addEventListener(
      'pointercancel',
      () => {
        isPointerActivation = false
      },
      { signal }
    )
    button.addEventListener(
      'focus',
      () => {
        if (!isPointerActivation && button.matches(':focus-visible')) {
          isDismissed = false
          show()
        }
      },
      { signal }
    )
    button.addEventListener(
      'blur',
      () => {
        isPointerActivation = false
        if (!wrapper.matches(':hover')) hide()
        isDismissed = false
      },
      { signal }
    )
    button.addEventListener(
      'click',
      event => {
        isPointerActivation = false
        isDismissed = false
        if (panel.matches(':popover-open') && !isPinned) event.preventDefault()
        isPinned = true
      },
      { signal }
    )
    panel.addEventListener('mousedown', event => event.preventDefault(), { signal })
    button.addEventListener(
      'keydown',
      event => {
        if (!panel.matches(':popover-open')) return
        const line = parseFloat(window.getComputedStyle(panel).lineHeight)
        const scroll: Record<string, number> = {
          ArrowDown: line,
          ArrowUp: -line,
          End: panel.scrollHeight,
          Home: -panel.scrollHeight,
          PageDown: panel.clientHeight * 0.8,
          PageUp: -panel.clientHeight * 0.8
        }
        if (scroll[event.key] !== undefined) {
          event.preventDefault()
          panel.scrollTop += scroll[event.key]
        }
      },
      { signal }
    )
    panel.addEventListener(
      'beforetoggle',
      event => {
        if (event.newState === 'open') {
          panel.scrollTop = 0
          window.requestAnimationFrame(() => positionPanel(button, panel))
        } else {
          isDismissed = true
          isPinned = false
          window.clearTimeout(closeTimer)
        }
      },
      { signal }
    )
    return [{ button, panel, release: () => window.clearTimeout(closeTimer) }]
  })
  const reposition = () => widgets.forEach(({ button, panel }) => positionPanel(button, panel))
  const observer = new MutationObserver(() => {
    for (const { button, panel } of widgets) {
      if (panel.matches(':popover-open') && button.getClientRects().length === 0) panel.hidePopover()
    }
  })
  observer.observe(document.documentElement, { attributeFilter: ['data-type-filter'], attributes: true })
  window.addEventListener('resize', reposition, { signal })
  window.visualViewport?.addEventListener('resize', reposition, { signal })
  window.visualViewport?.addEventListener('scroll', reposition, { signal })
  document.addEventListener('scroll', reposition, { capture: true, signal })
  cleanup = () => {
    controller.abort()
    observer.disconnect()
    for (const { panel, release } of widgets) {
      release()
      if (panel.matches(':popover-open')) panel.hidePopover()
    }
  }
}

document.addEventListener('astro:page-load', setupEstimates)
document.addEventListener('astro:before-swap', () => cleanup())
