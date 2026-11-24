import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { formRecord } from '../api/commerce'
import useCommerceData from '../hooks/useCommerceData'
import { CHOICE_TYPES, FIELD_TYPES, VALIDATION_TYPES, configurationError, prepareProductFields } from './marketplaceFormRules'
import './marketplaceForm.css'

const blankRule = { type: "Required", value: "", description: "", messageEn: "", messageAr: "" };
const blankField = { label: "", key: "", placeholder: "", type: "Text", optionsText: "", validations: [] };
const duplicateFormName = "DuplicateFormName";

function RuleEditor({ rule, onChange, onDelete }) {
  return (
    <fieldset className="market-rule">
      <div className="market-grid">
        <label>Validation
          <select aria-label="Validation" value={rule.type} onChange={(event) => onChange({ type: event.target.value, value: "" })}>
            {VALIDATION_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        {rule.type !== "Required" && (
          <label>{rule.type === "Regex" ? "Pattern" : "Limit"}
            <input value={rule.value} onChange={(event) => onChange({ value: event.target.value })} required />
          </label>
        )}
        <label>Description <input value={rule.description} onChange={(event) => onChange({ description: event.target.value })} /></label>
        <label>English error message <input value={rule.messageEn} onChange={(event) => onChange({ messageEn: event.target.value })} /></label>
        <label>Arabic error message <input value={rule.messageAr} lang="ar" dir="rtl" onChange={(event) => onChange({ messageAr: event.target.value })} /></label>
      </div>
      <button type="button" className="icon-button !text-red-700" aria-label="Remove validation" title="Remove validation" onClick={onDelete}>
        <Icon name="trash" size={16} />
      </button>
    </fieldset>
  );
}

function FieldEditor({ field, position, count, update, move, remove }) {
  return (
    <fieldset className="market-field-editor">
      <legend>{field.label || `Field ${position + 1}`}</legend>
      <div className="market-actions market-field-tools">
        <button type="button" className="icon-button" aria-label="Move field up" title="Move field up" disabled={!position} onClick={() => move(-1)}><Icon name="up" size={16} /></button>
        <button type="button" className="icon-button" aria-label="Move field down" title="Move field down" disabled={position === count - 1} onClick={() => move(1)}><Icon name="down" size={16} /></button>
        <button type="button" className="icon-button !text-red-700" aria-label="Remove field" title="Remove field" onClick={remove}><Icon name="trash" size={16} /></button>
      </div>
      <div className="market-grid">
        <label>Label <input value={field.label} onChange={(event) => update({ label: event.target.value })} required /></label>
        <label>Key <input value={field.key} onChange={(event) => update({ key: event.target.value })} required /></label>
        <label>Field type
          <select aria-label="Field type" value={field.type || ""} onChange={(event) => update({ type: event.target.value })} required>
            {!FIELD_TYPES.includes(field.type) && <option value="">Select a field type</option>}
            {FIELD_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label>Placeholder <input value={field.placeholder} onChange={(event) => update({ placeholder: event.target.value })} /></label>
        {CHOICE_TYPES.includes(field.type) && (
          <label>Options (one per line)
            <textarea rows={3} value={field.optionsText} onChange={(event) => update({ optionsText: event.target.value })} />
          </label>
        )}
      </div>
      {field.validations.map((rule) => (
        <RuleEditor key={rule.localId} rule={rule}
          onChange={(changes) => update({ validations: field.validations.map((item) => item.localId === rule.localId ? { ...item, ...changes } : item) })}
          onDelete={() => update({ validations: field.validations.filter((item) => item.localId !== rule.localId) })} />
      ))}
      <button type="button" className="btn-secondary" onClick={() => update({
        validations: [...field.validations, { ...blankRule, localId: crypto.randomUUID() }],
      })}><Icon name="plus" size={16} /> Add validation</button>
    </fieldset>
  );
}

function FormEditor({ api, form, subcategoryId, defaultName, onSaved }) {
  const [name, setName] = useState(form?.name || defaultName);
  const [fields, setFields] = useState(() => (form?.fields || []).map((field, index) => ({
    ...field,
    localId: `field-${index}`,
    optionsText: field.options.join("\n"),
    validations: field.validations.map((rule, ruleIndex) => ({ ...rule, localId: `rule-${ruleIndex}` })),
  })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameInput = useRef(null);
  const nameTaken = error === duplicateFormName;

  useEffect(() => {
    if (nameTaken) nameInput.current?.focus();
  }, [nameTaken]);

  async function save(event) {
    event.preventDefault();
    if (busy || confirmDelete) return;
    const nextFields = fields.map((field) => ({
      ...field,
      options: [...new Set(field.optionsText.split(/\r?\n/).map((option) => option.trim()).filter(Boolean))],
    }));
    const validation = !name.trim() ? "Enter a form name." : configurationError(nextFields);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.saveForm(form?.id, {
        subcategoryId,
        name: name.trim(),
        fields: prepareProductFields(nextFields),
        ...(form && { concurrencyStamp: form.concurrencyStamp ?? null }),
      });
      onSaved("Form saved.");
    } catch (failure) {
      setError(failure.code === duplicateFormName ? duplicateFormName : failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteForm(form.id);
      onSaved("Form deleted.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="market-stack" onSubmit={save}>
      <fieldset className="market-stack" disabled={busy || confirmDelete}>
        <div className="market-form-name grid gap-1.5">
          <label>Form name
            <input ref={nameInput} value={name} onChange={(event) => {
              setName(event.target.value);
              if (nameTaken) setError("");
            }} aria-invalid={nameTaken || undefined} aria-describedby={nameTaken ? "product-form-name-error" : undefined} required />
          </label>
          {nameTaken && <p id="product-form-name-error" className="market-error" role="alert">This form name is already in use. Enter a different name.</p>}
        </div>
        {fields.map((field, index) => (
          <FieldEditor key={field.localId} field={field} position={index} count={fields.length}
            update={(changes) => setFields((items) => items.map((item) => item.localId === field.localId ? { ...item, ...changes } : item))}
            move={(offset) => setFields((items) => {
              const next = [...items];
              [next[index], next[index + offset]] = [next[index + offset], next[index]];
              return next;
            })}
            remove={() => setFields((items) => items.filter((item) => item.localId !== field.localId))} />
        ))}
        <div><button className="btn-secondary" type="button" onClick={() =>
          setFields((items) => [...items, { ...blankField, localId: crypto.randomUUID() }])
        }><Icon name="plus" size={17} /> Add field</button></div>
      </fieldset>
      {error && !nameTaken && <p className="market-error" role="alert">{error}</p>}
      {confirmDelete ? (
        <div className="market-editor">
          <p>Delete this product form?</p>
          <div className="market-actions">
            <button type="button" className="btn-primary !bg-red-700" disabled={busy} onClick={remove}>Delete form</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="market-actions">
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save form"}</button>
          {form && <button type="button" className="btn-secondary !text-red-700" disabled={busy} onClick={() => setConfirmDelete(true)}><Icon name="trash" size={17} /> Delete form</button>}
        </div>
      )}
    </form>
  );
}

export default function ProductFormEditor({ api, subcategoryId, defaultName }) {
  const load = useCallback(async signal => formRecord(await api.getForm(subcategoryId, { signal })), [api, subcategoryId])
  const resource = useCommerceData(load)
  const [notice, setNotice] = useState('')

  return (
    <section className="market-workspace market-stack">
      {notice && <p className="market-notice" role="status">{notice}</p>}
      {resource.loading && <p className="market-status" role="status">Loading product form...</p>}
      {resource.error && <div className="market-status">
        <p className="market-error" role="alert">{resource.error.message}</p>
        <button className="btn-secondary mt-2" type="button" onClick={resource.reload}>Retry</button>
      </div>}
      {!resource.loading && !resource.error && <FormEditor api={api} form={resource.data} subcategoryId={subcategoryId} defaultName={defaultName}
        onSaved={message => { setNotice(message); resource.reload() }} />}
    </section>
  )
}
