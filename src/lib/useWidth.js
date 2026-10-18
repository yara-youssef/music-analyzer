import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Reactive content width of an element, for charts that size to their container. */
export function useWidth(elRef, fallback = 600) {
  const width = ref(fallback)
  let ro
  onMounted(() => {
    ro = new ResizeObserver(([entry]) => {
      width.value = Math.max(200, Math.floor(entry.contentRect.width))
    })
    ro.observe(elRef.value)
  })
  onBeforeUnmount(() => ro?.disconnect())
  return width
}
