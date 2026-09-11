import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { cn } from '@/utils/cn'

export default function Tabs({ tabs, activeTab, onChange }) {
  const indicatorRef = useRef(null)
  const tabsRef = useRef({})
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
  }, [])

  useEffect(() => {
    if (!mountedRef.current) return
    const activeEl = tabsRef.current[activeTab]
    if (!activeEl || !indicatorRef.current) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      indicatorRef.current.style.width = `${activeEl.offsetWidth}px`
      indicatorRef.current.style.left = `${activeEl.offsetLeft}px`
    } else {
      gsap.to(indicatorRef.current, {
        width: activeEl.offsetWidth,
        left: activeEl.offsetLeft,
        duration: 0.3,
        ease: 'power3.out',
      })
    }
  }, [activeTab])

  return (
    <div className="relative">
      <div
        className="-mx-1 flex gap-0 overflow-x-auto border-b border-gray-200 px-1 scrollbar-none dark:border-gray-700"
        role="tablist"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            ref={(el) => (tabsRef.current[tab.value] = el)}
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative flex cursor-pointer items-center whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-surface-dark-elevated',
              activeTab === tab.value
                ? 'text-primary-700 dark:text-primary'
                : 'text-text-muted hover:text-text-primary dark:hover:text-text-dark-primary'
            )}
            style={{ scrollSnapAlign: 'start' }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                  activeTab === tab.value
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-700/30 dark:text-primary'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <span
        ref={indicatorRef}
        className="absolute bottom-0 h-0.5 rounded-full bg-primary transition-none"
      />
    </div>
  )
}
