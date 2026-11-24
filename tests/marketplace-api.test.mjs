import test from 'node:test'
import assert from 'node:assert/strict'
import { createMarketplaceApi } from '../src/api/marketplace.js'

test('products use the Marketplace channel, search, taxonomy filters, and server pagination', async () => {
  const signal = new AbortController().signal
  const api = createMarketplaceApi(async (path, options) => {
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
  })

  const result = await api.getProducts({
    page: 2, pageSize: 10, categoryId: 'category/1', subcategoryId: 'sub/1', search: 'Bag & strap',
  }, { signal })
  assert.equal(result.total, 21)
  assert.equal(result.hasNext, true)
  assert.equal(result.rows[0].name, 'Canvas bag')
  assert.equal(result.rows[0].quantity, 0)
})

test('orders keep the partner scope and can advance past a page without Marketplace rows', async () => {
  const api = createMarketplaceApi(async path => {
    assert.equal(path, '/api/v1/orders/partner?page=1&pageSize=3&status=Confirmed')
    return {
      orders: [
        { id: 'store', salesChannel: 'Store' },
        { id: 'unknown' },
        { id: 'mixed', items: [{ salesChannel: 'Marketplace' }, { salesChannel: 'Store' }] },
      ],
      hasNextPage: true,
    }
  })

  const result = await api.getPartnerOrders({ page: 1, pageSize: 3, status: 'Confirmed' })
  assert.deepEqual(result, { rows: [], hasNext: true, hasUnclassifiedOrders: true })
})

test('orders display records identified as Marketplace by the order or all of its items', async () => {
  const api = createMarketplaceApi(async () => ({
    Orders: [
      { Id: 'direct', SalesChannel: 'Marketplace', Status: 'Delivered' },
      { Id: 'items', OrderItems: [{ Product: { SalesChannel: 'Marketplace' } }] },
    ],
    Pagination: { TotalPages: 2 },
  }))
  const result = await api.getPartnerOrders({ page: 2, pageSize: 10 })
  assert.equal(result.hasNext, false)
  assert.equal(result.hasUnclassifiedOrders, false)
  assert.deepEqual(result.rows.map(({ id, status, items }) => ({ id, status, items })), [
    { id: 'direct', status: 'Delivered', items: undefined },
    { id: 'items', status: undefined, items: 1 },
  ])
})
