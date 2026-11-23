import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'

export default function MarketplaceCategoryDialog({ mode, row, kind, onSave, onDelete, onClose }) {
  const ref = useRef(null)
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const deleting = mode === 'delete'
  const title = `${deleting ? 'Delete' : row.id ? 'Edit' : 'Add'} ${kind}`

  useEffect(() => { ref.current.showModal() }, [])

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    if (!deleting && (!data.get('nameEn').trim() || !data.get('nameAr').trim())) {
      setError('Enter the English and Arabic names.')
      return
    }

    setBusy(true)
    setError('')
    try {
      if (deleting) await onDelete(row)
      else await onSave({
        ...row,
        nameEn: data.get('nameEn').trim(),
        nameAr: data.get('nameAr').trim(),
        image: data.get('imageFile'),
      })
      onClose()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={event => {
      event.preventDefault()
      if (!busy) onClose()
    }}>
      <div className="modal-box max-w-lg rounded-lg bg-white p-6">
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-[#172b46]">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </header>
        <form className="space-y-4" onSubmit={submit}>
          {deleting ? <p className="break-words text-sm">Delete <strong>{row.name}</strong>?</p> : (
            <fieldset disabled={busy} className="grid min-w-0 gap-4">
              <label className="grid gap-2 text-xs font-medium">English name
                <input className="field w-full" name="nameEn" defaultValue={row.nameEn} required />
              </label>
              <label className="grid gap-2 text-xs font-medium">Arabic name
                <input className="field w-full" name="nameAr" defaultValue={row.nameAr} lang="ar" dir="rtl" required />
              </label>
              <label className="grid gap-2 text-xs font-medium">{row.image ? 'Replace image' : 'Image'}
                <input className="field w-full min-w-0" type="file" name="imageFile" accept="image/*" />
              </label>
            </fieldset>
          )}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className={deleting ? 'btn-primary !bg-red-700 hover:!bg-red-800' : 'btn-primary'} type="submit" disabled={busy}>
              {busy ? (deleting ? 'Deleting...' : 'Saving...') : deleting ? title : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
