import { ApiError } from './client.js'

const categoryPath = '/api/v1/product-categories'
const subcategoryPath = '/api/v1/product-subcategories'
const formPath = '/api/v1/product-forms'
const byCategory = id => `${subcategoryPath}/product-category/${encodeURIComponent(id)}`

function listPath(path, values) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value != null && value !== '') query.set(key, value)
  }
  return `${path}?${query}`
}

export function createMarketplaceApi(request) {
  return {
    getCategories: options => request(`${categoryPath}?salesChannel=Marketplace`, options),
    getSubcategories: (id, options) => request(byCategory(id), options),
    async getProducts({ page, pageSize, categoryId, subcategoryId, search }, options) {
      const data = await request(listPath('/api/v1/product', {
        page, pageSize, categoryId, subcategoryId, search, salesChannel: 'Marketplace',
      }), options)
      const result = readPage(data, 'products', page, pageSize)
      return { ...result, rows: result.rows.map(productRow) }
    },
    async getPartnerOrders({ page, pageSize, status }, options) {
      const data = await request(listPath('/api/v1/orders/partner', { page, pageSize, status }), options)
      const result = readPage(data, 'orders', page, pageSize)
      const orders = result.rows.map(orderRow)
      return {
        hasNext: result.hasNext,
        rows: orders.filter(order => order.salesChannel === 'marketplace'),
        hasUnclassifiedOrders: orders.some(order => !order.salesChannel),
      }
    },
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

function readPage(data, entity, page, pageSize) {
  const rows = [data, ...['items', entity, 'results', 'data'].map(key => field(data, key))].find(Array.isArray)
  if (!rows) throw new ApiError(`The API did not return a list of ${entity}.`)

  const pagination = field(data, 'pagination') ?? data
  const count = field(pagination, 'totalCount') ?? field(pagination, 'totalItems') ?? field(pagination, 'totalRecords')
  const total = count != null && Number.isInteger(Number(count)) && Number(count) >= 0 ? Number(count) : undefined
  const totalPages = field(pagination, 'totalPages')
  const next = field(pagination, 'hasNextPage')
  const limit = Number(field(pagination, 'pageSize')) || pageSize
  const hasNext = typeof next === 'boolean' ? next : totalPages != null ? page < totalPages : total != null ? page * limit < total : rows.length >= limit
  return { rows, total, hasNext, pageSize: limit }
}

function recordName(record) {
  return typeof record === 'string' ? record : field(record, 'name') ?? field(record, 'fullName')
}

function recordImage(image) {
  return typeof image === 'string' ? image : field(image, 'url') ?? field(image, 'imageUrl')
}

function productRow(product) {
  const attributes = field(product, 'keyValuePairs')
  const productName = Array.isArray(attributes)
    ? field(attributes.find(item => ['productname', 'productnamee'].includes(String(field(item, 'key')).toLowerCase())), 'value')
    : field(attributes, 'productName')
  const category = field(product, 'category') ?? field(product, 'productCategory')
  const subcategory = field(product, 'subcategory') ?? field(product, 'productSubcategory')

  return {
    id: field(product, 'id') ?? field(product, 'productId'),
    name: field(product, 'name') || field(product, 'productName') || productName,
    categoryId: field(product, 'categoryId') ?? field(product, 'productCategoryId') ?? field(category, 'id'),
    category: field(product, 'categoryName') ?? recordName(category),
    subcategoryId: field(product, 'subcategoryId') ?? field(product, 'productSubcategoryId') ?? field(subcategory, 'id'),
    subcategory: field(product, 'subcategoryName') ?? recordName(subcategory),
    price: field(product, 'price'),
    currency: field(product, 'currency'),
    quantity: field(product, 'totalQuantity') ?? field(product, 'quantity'),
    image: recordImage(field(product, 'mainImageUrl') ?? field(product, 'mainImage') ?? field(product, 'imageUrl')),
  }
}

function channel(record) {
  const value = String(field(record, 'salesChannel') ?? '').trim().toLowerCase()
  return value === 'marketplace' || value === 'store' ? value : ''
}

function orderRow(order) {
  const items = field(order, 'items') ?? field(order, 'orderItems')
  const itemChannels = Array.isArray(items) ? items.map(item => channel(item) || channel(field(item, 'product'))) : []
  const salesChannel = channel(order) || (itemChannels.length && itemChannels.every(value => value === itemChannels[0]) ? itemChannels[0] : '')
  return {
    id: field(order, 'id') ?? field(order, 'orderId'),
    number: field(order, 'orderNumber'),
    customer: field(order, 'customerName') ?? recordName(field(order, 'customer')),
    date: field(order, 'createdAt') ?? field(order, 'orderDate') ?? field(order, 'createdOn'),
    items: field(order, 'itemCount') ?? (Array.isArray(items) ? items.length : undefined),
    amount: field(order, 'totalAmount') ?? field(order, 'totalPrice'),
    currency: field(order, 'currency'),
    payment: field(order, 'paymentMethod'),
    status: field(order, 'status'),
    salesChannel,
  }
}

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
      image: recordImage(image),
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
