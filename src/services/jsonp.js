let jsonpId = 0

/**
 * Load a JSONP endpoint through a <script> tag. Used for catalog APIs that
 * don't send CORS headers. Rejects on network/HTTP failure or timeout.
 */
export function jsonp(url, params = {}, { callbackParam = 'callback', timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const cb = `__jsonp_cb_${Date.now()}_${jsonpId++}`
    const qs = new URLSearchParams({ ...params, [callbackParam]: cb })
    const script = document.createElement('script')
    const timer = setTimeout(() => finish(new Error('timed out')), timeout)
    function finish(err, data) {
      clearTimeout(timer)
      // A late response after a timeout would call a missing global, so leave a no-op behind.
      window[cb] = () => {}
      script.remove()
      err ? reject(err) : resolve(data)
    }
    window[cb] = (data) => finish(null, data)
    script.onerror = () => finish(new Error('request blocked or failed'))
    script.src = `${url}?${qs}`
    document.head.appendChild(script)
  })
}
