import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Cho phép cuộn trang mượt mà khi mở dropdown/select và ngăn chặn layout shift (giật trang)
if (typeof window !== 'undefined') {
  const allowWheelScroll = (e: Event) => {
    const target = e.target as HTMLElement | null
    // Nếu cuộn bên trong danh sách popup của Select/Popover, cho phép danh sách tự cuộn
    const isInsideScrollableDropdown = target?.closest(
      '[data-radix-select-viewport], [data-slot="select-content"], [role="listbox"], [data-radix-popper-content-wrapper]'
    )
    if (!isInsideScrollableDropdown) {
      // Chặn react-remove-scroll nuốt sự kiện cuộn của trang web
      e.stopImmediatePropagation()
    }
  }

  window.addEventListener('wheel', allowWheelScroll, { capture: true, passive: true })
  window.addEventListener('touchmove', allowWheelScroll, { capture: true, passive: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
