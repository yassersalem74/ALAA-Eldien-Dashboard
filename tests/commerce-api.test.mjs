import test from 'node:test'
import assert from 'node:assert/strict'
import { createCommerceApi } from '../src/api/commerce.js'

test('products use the Marketplace channel, search, taxonomy filters, and server pagination', async () => {
  const signal = new AbortController().signal
  const api = createCommerceApi(async (path, options) => {
    const url = new URL(path, 'https://backend.example')
    assert.equal(url.pathname, '/api/v1/product')
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      page: '2', pageSize: '10', categoryId: 'category/1', subcategoryId: 'sub/1',
      search: 'Bag & strap', salesChannel: 'Marketplace',
    })
    assert.equal(options.signal, signal)
    return {
      items: [{ id: 'p1', keyValuePairs: [{ key: 'productName', value: 'Canvas bag' }], totalQuantity: 0, price: 120 }],
      totalCount: 21,
    }
  }, 'Marketplace')

  const result = await api.getProducts({
    page: 2, pageSize: 10, categoryId: 'category/1', subcategoryId: 'sub/1', search: 'Bag & strap',
  }, { signal })
  assert.equal(result.total, 21)
  assert.equal(result.hasNext, true)
  assert.equal(result.rows[0].name, 'Canvas bag')
  assert.equal(result.rows[0].quantity, 0)
})

test('orders keep the partner scope and can advance past a page without Marketplace rows', async () => {
  const api = createCommerceApi(async path => {
    assert.equal(path, '/api/v1/orders/partner?page=1&pageSize=3&status=Confirmed')
    return {
      orders: [
        { id: 'store', salesChannel: 'Store' },
        { id: 'unknown' },
        { id: 'mixed', items: [{ salesChannel: 'Marketplace' }, { salesChannel: 'Store' }] },
      ],
      hasNextPage: true,
    }
  }, 'Marketplace')

  const result = await api.getPartnerOrders({ page: 1, pageSize: 3, status: 'Confirmed' })
  assert.deepEqual(result, { rows: [], hasNext: true, hasUnclassifiedOrders: true })
})

test('orders display records identified as Marketplace by the order or all of its items', async () => {
  const api = createCommerceApi(async () => ({
    Orders: [
      { Id: 'direct', SalesChannel: 'Marketplace', Status: 'Delivered' },
      { Id: 'items', OrderItems: [{ Product: { SalesChannel: 'Marketplace' } }] },
    ],
    Pagination: { TotalPages: 2 },
  }), 'Marketplace')
  const result = await api.getPartnerOrders({ page: 2, pageSize: 10 })
  assert.equal(result.hasNext, false)
  assert.equal(result.hasUnclassifiedOrders, false)
  assert.deepEqual(result.rows.map(({ id, status, items }) => ({ id, status, items })), [
    { id: 'direct', status: 'Delivered', items: undefined },
    { id: 'items', status: undefined, items: 1 },
  ])
})

test('Store category reads and writes keep the Store channel and subcategories use their parent', async () => {
  const calls = []
  const api = createCommerceApi(async (path, options) => { calls.push({ path, ...options }) }, 'Store')
  const names = { nameEn: 'Kitchen', nameAr: 'مطبخ' }
  await api.getCategories({ language: 'ar' })
  await api.saveCategory(names)
  await api.saveCategory({ ...names, id: 'store/1', concurrencyStamp: 'stamp-1' })
  await api.saveCategory({ ...names, categoryId: 'store/1' })
  assert.deepEqual(calls[0], { path: '/api/v1/product-categories?salesChannel=Store', language: 'ar' })
  assert.deepEqual(calls.slice(1).map(({ path, method, body }) => ({ path, method, fields: Object.fromEntries(body) })), [
    { path: '/api/v1/admin/product-categories', method: 'POST', fields: { ...names, salesChannel: 'Store' } },
    { path: '/api/v1/admin/product-categories/store%2F1', method: 'PUT', fields: { ...names, salesChannel: 'Store', concurrencyStamp: 'stamp-1' } },
    { path: '/api/v1/admin/product-subcategories/category/store%2F1', method: 'POST', fields: names },
  ])
})

test('Store products request the Store channel and order rows stay on their respective pages', async () => {
  const requested = []
  const request = async path => {
    requested.push(path)
    return path.startsWith('/api/v1/product?') ? { items: [] } : {
      items: [
        { id: 'store', items: [{ product: { salesChannel: 'Store' } }] },
        { id: 'marketplace', salesChannel: 'Marketplace' },
        { id: 'unknown' },
      ],
      totalCount: 20,
    }
  }
  const store = createCommerceApi(request, 'Store')
  const marketplace = createCommerceApi(request, 'Marketplace')
  await store.getProducts({ page: 1, pageSize: 10, categoryId: 'store-category' })
  const storeOrders = await store.getPartnerOrders({ page: 1, pageSize: 10 })
  const marketplaceOrders = await marketplace.getPartnerOrders({ page: 1, pageSize: 10 })
  assert.deepEqual(requested, [
    '/api/v1/product?page=1&pageSize=10&categoryId=store-category&salesChannel=Store',
    '/api/v1/orders/partner?page=1&pageSize=10',
    '/api/v1/orders/partner?page=1&pageSize=10',
  ])
  assert.deepEqual(storeOrders.rows.map(row => row.id), ['store'])
  assert.deepEqual(marketplaceOrders.rows.map(row => row.id), ['marketplace'])
  assert.equal(storeOrders.hasNext, true)
  assert.equal(storeOrders.hasUnclassifiedOrders, true)
})

test('product details preserve form values, and product and rating writes use the documented paths', async () => {
  const calls = []
  const api = createCommerceApi(async (path, options) => {
    calls.push({ path, ...options })
    if (path === '/api/v1/product/p%2F1') return { product: {
      id: 'p/1', productFormId: 'form/1', concurrencyStamp: 'product-rev',
      keyValuePairsJson: JSON.stringify([{ Key: 'productName', Value: 'Bag' }, { Key: 'extras', Value: '["blue"]' }]),
    } }
    if (path.endsWith('/ratings')) return [{ userId: 'u1', rating: 4, concurrencyStamp: 'rating-rev' }]
    return null
  }, 'Store')
  const product = await api.getProduct('p/1')
  assert.equal(product.formId, 'form/1')
  assert.equal(product.values.extras, '["blue"]')
  assert.equal(product.name, 'Bag')
  const multipart = new FormData()
  multipart.set('price', '0')
  await api.saveProduct(product.formId, null, multipart)
  await api.saveProduct(product.formId, product.id, multipart)
  const [rating] = await api.getRatings(product.id)
  await api.saveRating(product.id, { rating: 5, concurrencyStamp: rating.concurrencyStamp }, true)
  await api.deleteProduct(product.id)
  assert.deepEqual(calls.map(({ path, method }) => [method ?? 'GET', path]), [
    ['GET', '/api/v1/product/p%2F1'],
    ['POST', '/api/v1/product/product-form/form%2F1'],
    ['PUT', '/api/v1/product/product-form/form%2F1/p%2F1'],
    ['GET', '/api/v1/product/p%2F1/ratings'],
    ['PUT', '/api/v1/product/p%2F1/ratings'],
    ['DELETE', '/api/v1/product/p%2F1'],
  ])
})

test('store directory and all-orders endpoints preserve account scope and concurrency values', async () => {
  const calls = []
  const api = createCommerceApi(async (path, options) => {
    calls.push({ path, ...options })
    if (path === '/api/v1/stores/me') return { id: 's1', categories: [{ id: 'c1', name: 'Home' }] }
    if (path === '/api/v1/stores' && !options?.body) return { stores: [{ id: 's1', name: 'Home goods' }] }
    if (path.startsWith('/api/v1/orders/customer?')) return { orders: [{ id: 'o1', concurrencyStamp: 'order-rev' }], totalCount: 1 }
    return null
  }, '')
  assert.equal((await api.getStores())[0].name, 'Home goods')
  assert.deepEqual((await api.getStore('me')).categoryIds, ['c1'])
  const orders = await api.getOrders({ scope: 'customer', page: 2, pageSize: 5, status: 'Pending' })
  assert.equal(orders.rows[0].salesChannel, '')
  await api.changeOrderStatus('o1', { status: 'CancelledByCustomer', concurrencyStamp: orders.rows[0].concurrencyStamp })
  await api.createOrder({ items: [{ productId: 'p1', quantity: 2, productConcurrencyStamp: 'product-rev' }] })
  assert.equal(calls[2].path, '/api/v1/orders/customer?page=2&pageSize=5&status=Pending')
  assert.deepEqual(calls[3], { path: '/api/v1/orders/o1/status', method: 'PUT', body: { status: 'CancelledByCustomer', concurrencyStamp: 'order-rev' } })
  assert.equal(calls[4].path, '/api/v1/orders')
})
