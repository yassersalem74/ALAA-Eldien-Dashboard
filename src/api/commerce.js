import { ApiError } from './client.js'
import { field, queryPath, readPage } from './pagination.js'

const categoryPath = '/api/v1/product-categories'
const subcategoryPath = '/api/v1/product-subcategories'
const formPath = '/api/v1/product-forms'
const productPath = '/api/v1/product'
const storePath = '/api/v1/stores'
const byCategory = id => `${subcategoryPath}/product-category/${encodeURIComponent(id)}`
const withId = (path, id) => `${path}/${encodeURIComponent(id)}`
const ratingsPath = id => `${withId(productPath, id)}/ratings`

export function createCommerceApi(request, salesChannel) {
  const orderChannel = salesChannel.toLowerCase()
  async function getOrders({ page, pageSize, status, scope }, options) {
    const data = await request(queryPath(`/api/v1/orders/${scope === 'customer' ? 'customer' : 'partner'}`, { page, pageSize, status }), options)
    const result = readPage(data, 'orders', page, pageSize)
    return { ...result, rows: result.rows.map(orderRow) }
  }
  return {
    getCategories: options => request(queryPath(categoryPath, { salesChannel }), options),
    getSubcategories: (id, options) => request(byCategory(id), options),
    async getProducts({ page, pageSize, categoryId, subcategoryId, search, minPrice, maxPrice }, options) {
      const data = await request(queryPath(productPath, {
        page, pageSize, categoryId, subcategoryId, search, minPrice, maxPrice, salesChannel: salesChannel || undefined,
      }), options)
      const result = readPage(data, 'products', page, pageSize)
      return { ...result, rows: result.rows.map(productRow) }
    },
    async getPartnerOrders({ page, pageSize, status }, options) {
      const result = await getOrders({ page, pageSize, status, scope: 'partner' }, options)
      return {
        hasNext: result.hasNext,
        rows: result.rows.filter(order => order.salesChannel === orderChannel),
        hasUnclassifiedOrders: result.rows.some(order => !order.salesChannel),
      }
    },
    getOrders,
    createOrder: body => request('/api/v1/orders', { method: 'POST', body }),
    changeOrderStatus: (id, body) => request(`${withId('/api/v1/orders', id)}/status`, { method: 'PUT', body }),
    async getProduct(id, options) {
      const data = await request(withId(productPath, id), options)
      return productRow(field(data, 'product') ?? data)
    },
    saveProduct(formId, id, body) {
      const path = withId(`${productPath}/product-form`, formId)
      return request(id == null ? path : withId(path, id), { method: id == null ? 'POST' : 'PUT', body })
    },
    deleteProduct: id => request(withId(productPath, id), { method: 'DELETE' }),
    async getRatings(id, options) {
      const data = await request(ratingsPath(id), options)
      return readPage(data, 'ratings', 1, 10).rows.map(rating => ({
        id: field(rating, 'id'),
        userId: field(rating, 'userId') ?? field(rating, 'customerId'),
        user: field(rating, 'userName') ?? recordName(field(rating, 'user')),
        isMine: field(rating, 'isMine') === true,
        rating: field(rating, 'rating') ?? field(rating, 'star'),
        feedback: field(rating, 'feedback'),
        concurrencyStamp: field(rating, 'concurrencyStamp'),
      }))
    },
    saveRating: (id, body, updating) => request(ratingsPath(id), { method: updating ? 'PUT' : 'POST', body }),
    async getStores(options) {
      const data = await request(storePath, options)
      return readPage(data, 'stores', 1, 10).rows.map(storeRow)
    },
    async getStore(id, options) {
      try {
        const data = await request(withId(storePath, id), options)
        return data == null ? null : storeRow(field(data, 'store') ?? data)
      } catch (error) {
        if (id === 'me' && error.status === 404) return null
        throw error
      }
    },
    saveStore(id, body) {
      return request(id == null ? storePath : withId(storePath, id), { method: id == null ? 'POST' : 'PUT', body })
    },
    deleteStore: id => request(withId(storePath, id), { method: 'DELETE' }),
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
      if (!categoryId) body.set('salesChannel', salesChannel)
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

function recordName(record) {
  return typeof record === 'string' ? record : field(record, 'name') ?? field(record, 'fullName')
}

function recordImage(image) {
  return typeof image === 'string' ? image : field(image, 'url') ?? field(image, 'imageUrl')
}

function productRow(product) {
  let attributes = field(product, 'keyValuePairs') ?? field(product, 'keyValuePairsJson')
  if (typeof attributes === 'string') {
    try { attributes = JSON.parse(attributes) } catch { attributes = undefined }
  }
  const values = Array.isArray(attributes)
    ? Object.fromEntries(attributes.filter(item => typeof field(item, 'key') === 'string').map(item => [field(item, 'key'), field(item, 'value')]))
    : attributes && typeof attributes === 'object' ? attributes : {}
  const productName = Object.entries(values).find(([key]) => ['productname', 'productnamee'].includes(key.toLowerCase()))?.[1]
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
    images: imageEntries(field(product, 'images') ?? field(product, 'imageUrls')),
    description: field(product, 'description'),
    values,
    formId: field(product, 'productFormId') ?? field(product, 'formId') ?? field(field(product, 'productForm'), 'id'),
    concurrencyStamp: field(product, 'concurrencyStamp'),
  }
}

function imageEntries(value) {
  return Array.isArray(value) ? value.map(recordImage).filter(Boolean) : []
}

function storeRow(store) {
  const categories = field(store, 'categories') ?? field(store, 'productCategories')
  const ids = field(store, 'categoryIds')
  return {
    id: field(store, 'id') ?? field(store, 'storeId'),
    name: field(store, 'name') ?? field(store, 'storeName'),
    image: recordImage(field(store, 'imageUrl') ?? field(store, 'image')),
    categoryIds: Array.isArray(ids) ? ids : Array.isArray(categories) ? categories.map(item => field(item, 'id') ?? field(item, 'categoryId')).filter(Boolean) : [],
    categoryNames: Array.isArray(categories) ? categories.map(recordName).filter(Boolean) : [],
    concurrencyStamp: field(store, 'concurrencyStamp'),
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
    concurrencyStamp: field(order, 'concurrencyStamp'),
    lineItems: Array.isArray(items) ? items.map(item => ({
      name: field(item, 'productName') ?? recordName(field(item, 'product')),
      quantity: field(item, 'quantity'),
      id: field(item, 'id') ?? field(item, 'productId'),
    })) : [],
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
