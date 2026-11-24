import { useEffect, useState } from 'react'

export default function useCommerceData(load, enabled = true) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState(null)
  const current = result?.load === load && result.version === version ? result : null

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    load(controller.signal).then(
      data => {
        if (!controller.signal.aborted) setResult({ load, version, data })
      },
      error => {
        if (!controller.signal.aborted) setResult({ load, version, error })
      },
    )
    return () => controller.abort()
  }, [enabled, load, version])

  return {
    data: enabled ? current?.data : undefined,
    error: enabled ? current?.error : undefined,
    loading: enabled && !current,
    reload: () => setVersion(value => value + 1),
  }
}
