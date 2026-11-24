import { useCallback, useState } from 'react'
import { categoryRows, formRecord } from '../api/commerce'
import useApiData from '../hooks/useApiData'
import { isProductPriceField } from './marketplaceFormRules'
import { ServiceField, ServiceMutation, ServiceResourceError } from './ServiceControls'

function defaultValue(value) {
  if (Array.isArray(value)) return value.map(String)
  if (value != null) return String(value)
  return ''
}

function optionsSelected(value) {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' && value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      return [value]
    }
  }
  return value ? [String(value)] : []
}

function ProductField({ field, value, index }) {
  const name = `attribute-${index}`
  const required = field.validations.some(rule => rule.type === 'Required')
  const values = optionsSelected(value)
  const optionList = [...new Set([...field.options, ...values])]
  if (field.type === 'Radio' || (field.type === 'Checkbox' && field.options.length)) {
    return (
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-xs font-semibold text-slate-700">{field.label}{required && ' (required)'}</legend>
        {optionList.map(option => <label key={option} className="flex items-center gap-2 text-sm">
          <input type={field.type === 'Radio' ? 'radio' : 'checkbox'} name={name} value={option}
            required={required && field.type === 'Radio'} defaultChecked={values.includes(option)} />{option}
        </label>)}
      </fieldset>
    )
  }
  let input
  if (['Boolean', 'Checkbox', 'Dropdown'].includes(field.type)) {
    const options = field.type === 'Dropdown' ? optionList.map(item => [item, item]) : [['true', 'Yes'], ['false', 'No']]
    input = <select className="field" name={name} defaultValue={defaultValue(value)} required={required}>
      <option value="">Choose an option</option>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
    </select>
  } else if (field.type === 'TextArea') {
    input = <textarea className="field" name={name} rows={3} placeholder={field.placeholder} defaultValue={defaultValue(value)} required={required} />
  } else {
    const type = { Number: 'number', Date: 'date', Email: 'email', Phone: 'tel' }[field.type] ?? 'text'
    input = <input className="field" name={name} type={type} step={type === 'number' ? 'any' : undefined}
      placeholder={field.placeholder} defaultValue={defaultValue(value)} required={required} />
  }
  return <ServiceField label={field.label}>{input}</ServiceField>
}

function validationError(field, value) {
  const text = Array.isArray(value) ? value.join(', ') : value
  function fails(rule) {
    if (rule.type === 'Required') return !text.trim()
    if (!text) return false
    if (rule.type === 'MinLength') return text.length < Number(rule.value)
    if (rule.type === 'MaxLength') return text.length > Number(rule.value)
    if (rule.type === 'MinValue') return Number(text) < Number(rule.value)
    if (rule.type === 'MaxValue') return Number(text) > Number(rule.value)
    if (rule.type === 'Regex') {
      try { return !new RegExp(rule.value).test(text) } catch { return false }
    }
    return false
  }
  const rule = field.validations.find(fails)
  return rule ? rule.messageEn || `Check ${field.label} (${rule.type}).` : ''
}

export default function CommerceProductEditor({ api, product, onClose, onSaved }) {
  const [categoryId, setCategoryId] = useState(String(product?.categoryId ?? ''))
  const [subcategoryId, setSubcategoryId] = useState(String(product?.subcategoryId ?? ''))
  const loadCategories = useCallback(async signal => categoryRows(await api.getCategories({ signal })), [api])
  const loadSubcategories = useCallback(async signal => categoryRows(await api.getSubcategories(categoryId, { signal }), true), [api, categoryId])
  const loadForm = useCallback(async signal => formRecord(await api.getForm(subcategoryId, { signal })), [api, subcategoryId])
  const categories = useApiData(loadCategories)
  const subcategories = useApiData(loadSubcategories, Boolean(categoryId))
  const formResource = useApiData(loadForm, Boolean(subcategoryId))
  const form = formResource.data
  const fields = form?.fields ?? []
  const priceIndex = fields.findIndex(isProductPriceField)

  async function submit(data) {
    if (!form || !categoryId || !subcategoryId) throw new Error('Choose a subcategory with a product form.')
    const attributes = new Map(Object.entries(product?.values ?? {}))
    fields.forEach((field, index) => {
      const name = `attribute-${index}`
      const value = field.type === 'Checkbox' && field.options.length ? data.getAll(name) : String(data.get(name) ?? '').trim()
      const error = validationError(field, value)
      if (error) throw new Error(error)
      attributes.set(field.key, Array.isArray(value) ? JSON.stringify(value) : value)
    })
    const price = data.get(priceIndex >= 0 ? `attribute-${priceIndex}` : 'price') || data.get('price')
    if (price == null || price === '' || !Number.isFinite(Number(price)) || Number(price) < 0) throw new Error('Enter a valid listing price.')
    const body = new FormData()
    body.set('description', data.get('description').trim())
    body.set('price', price)
    body.set('totalQuantity', data.get('totalQuantity'))
    body.set('keyValuePairsJson', JSON.stringify([...attributes].map(([Key, value]) => ({
      Key, Value: typeof value === 'string' ? value : JSON.stringify(value ?? ''),
    }))))
    if (product?.concurrencyStamp) body.set('concurrencyStamp', product.concurrencyStamp)
    for (const key of ['mainImageFile', 'imageFiles', 'deletedImages']) {
      for (const value of data.getAll(key)) if (typeof value === 'string' || value.size) body.append(key, value)
    }
    await api.saveProduct(form.id, product?.id, body)
    onSaved(product ? 'Product updated.' : 'Product added.')
  }

  return (
    <ServiceMutation title={product ? 'Edit product' : 'Add product'} onClose={onClose} onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <ServiceField label="Category">
          <select className="field" value={categoryId} onChange={event => { setCategoryId(event.target.value); setSubcategoryId('') }} required>
            <option value="">Choose a category</option>
            {categoryId && !categories.data?.some(row => row.id === categoryId) && <option value={categoryId}>{product?.category ?? categoryId}</option>}
            {categories.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </ServiceField>
        <ServiceField label="Subcategory">
          <select className="field" value={subcategoryId} onChange={event => setSubcategoryId(event.target.value)} disabled={!categoryId} required>
            <option value="">Choose a subcategory</option>
            {subcategoryId && !subcategories.data?.some(row => row.id === subcategoryId) && <option value={subcategoryId}>{product?.subcategory ?? subcategoryId}</option>}
            {subcategories.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </ServiceField>
      </div>
      <ServiceResourceError resource={categories} />
      <ServiceResourceError resource={subcategories} />
      <ServiceResourceError resource={formResource} />
      {subcategoryId && form === null && <p role="status" className="text-sm text-slate-600">Configure a product form for this subcategory before adding products.</p>}
      {form && <>
        <fieldset className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2" key={form.id}>
          <legend className="px-1 text-xs font-semibold text-slate-600">{form.name || 'Product attributes'}</legend>
          {fields.map((field, index) => (
            <ProductField key={field.key} index={index} field={field} value={product?.values[field.key] ?? (index === priceIndex ? product?.price : undefined)} />
          ))}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          {priceIndex < 0 && <ServiceField label="Price"><input type="number" className="field" name="price" min="0" step="any" defaultValue={product?.price} required /></ServiceField>}
          <ServiceField label="Stock quantity"><input type="number" className="field" name="totalQuantity" min="0" defaultValue={product?.quantity ?? 1} required /></ServiceField>
        </div>
        <ServiceField label="Description"><textarea className="field" name="description" rows={3} defaultValue={product?.description} /></ServiceField>
        <ServiceField label="Main image"><input className="field" type="file" name="mainImageFile" accept="image/*" /></ServiceField>
        <ServiceField label="Additional images"><input className="field" type="file" name="imageFiles" multiple accept="image/*" /></ServiceField>
        {product?.images.map((url, index) => <label key={url} className="flex items-center gap-3 text-xs">
          <img src={url} alt="" className="size-10 rounded object-cover" /><input type="checkbox" name="deletedImages" value={url} /> Remove image {index + 1}
        </label>)}
      </>}
    </ServiceMutation>
  )
}
