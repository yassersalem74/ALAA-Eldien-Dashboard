import { ApiError } from './client.js'

const categoryPath = '/api/v1/product-categories'
const subcategoryPath = '/api/v1/product-subcategories'
const formPath = '/api/v1/product-forms'
const byCategory = id => `${subcategoryPath}/product-category/${encodeURIComponent(id)}`

export function createMarketplaceApi(request) {
  return {
    getCategories: options => request(`${categoryPath}?salesChannel=Marketplace`, options),
    getSubcategories: (id, options) => request(byCategory(id), options),
    async getForm(id, options) {
      try {
        return await request(`${formPath}/product-subcategory/${encodeURIComponent(id)}`, options)
      } catch (error) {
        if (error.status === 404 || ['ProductFormNotFound', 'ProductFormNotExist'].includes(error.code)) return null
        throw error
      }
    },
    saveCategory({ id, categoryId, nameEn, nameAr, image, concurrencyStamp }) {
      const base = `/api/v1/admin/product-${categoryId ? 'subcategories' : 'categories'}`
      const body = new FormData()
      body.set('nameEn', nameEn)
      body.set('nameAr', nameAr)
      if (!categoryId) body.set('salesChannel', 'Marketplace')
      if (image?.size) body.set('imageFile', image)
      if (id && concurrencyStamp) body.set('concurrencyStamp', concurrencyStamp)
      const path = id ? `${base}/${encodeURIComponent(id)}` : categoryId ? `${base}/category/${encodeURIComponent(categoryId)}` : base
      return request(path, { method: id ? 'PUT' : 'POST', body })
    },
    deleteCategory(id, categoryId) {
      const entity = categoryId ? 'subcategories' : 'categories'
      return request(`/api/v1/admin/product-${entity}/${encodeURIComponent(id)}`, { method: 'DELETE' })
    },
    saveForm(id, body) {
      const base = '/api/v1/admin/product-forms'
      return request(id ? `${base}/${encodeURIComponent(id)}` : base, { method: id ? 'PUT' : 'POST', body })
    },
    deleteForm(id) {
      return request(`/api/v1/admin/product-forms/${encodeURIComponent(id)}`, { method: 'DELETE' })
    },
  }
}

const field = (data, key) => data?.[key] ?? data?.[key[0].toUpperCase() + key.slice(1)]

export function categoryRows(data, subcategories = false) {
  const keys = subcategories ? ['subcategories', 'productSubcategories'] : ['categories', 'productCategories']
  const records = [data, ...['items', 'results', 'result', ...keys].map(key => field(data, key))].find(Array.isArray)
  if (data == null) return []
  if (!records) throw new ApiError('The API did not return a category list.')
  return records.map(row => {
    const nameEn = field(row, 'nameEn') ?? ''
    const nameAr = field(row, 'nameAr') ?? ''
    const image = field(row, 'imageUrl') ?? field(row, 'image')
    const entityId = subcategories
      ? field(row, 'subcategoryId') ?? field(row, 'productSubcategoryId')
      : field(row, 'categoryId') ?? field(row, 'productCategoryId')
    return {
      id: field(row, 'id') ?? entityId,
      name: field(row, 'name') || nameEn || nameAr || 'Unnamed category',
      nameEn, nameAr,
      image: typeof image === 'string' ? image : field(image, 'url') ?? field(image, 'imageUrl'),
      concurrencyStamp: field(row, 'concurrencyStamp'),
    }
  }).filter(row => row.id != null && row.id !== '').map(row => ({ ...row, id: String(row.id) }))
}

export function formRecord(data) {
  if (data == null) return null
  const form = field(data, 'productForm') ?? field(data, 'form') ?? data
  const id = field(form, 'id') ?? field(form, 'formId') ?? field(form, 'productFormId')
  if (!id) throw new ApiError('The API did not return a product form ID.')
  const fields = (field(form, 'fields') ?? []).map(item => ({
    label: field(item, 'label') ?? '',
    key: field(item, 'key') ?? '',
    placeholder: field(item, 'placeholder') ?? '',
    type: field(item, 'type') ?? '',
    options: field(item, 'options') ?? [],
    order: field(item, 'order') ?? 0,
    validations: (field(item, 'validations') ?? []).map(rule => ({
      type: field(rule, 'type') ?? '',
      value: field(rule, 'value') ?? '',
      description: field(rule, 'description') ?? '',
      messageEn: field(rule, 'messageEn') ?? '',
      messageAr: field(rule, 'messageAr') ?? '',
    })),
  })).sort((left, right) => left.order - right.order)
  return { id, name: field(form, 'name'), concurrencyStamp: field(form, 'concurrencyStamp'), fields }
}
