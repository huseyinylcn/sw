import { useState, useEffect } from 'react'
import { getProducts, createProduct,getProductOptions, createProducOptions, DeleteProductOption } from '../services/productService'
import { createProductType, getProductTypes } from '../services/productTypeService'
import Modal from '../components/Modal'
import './Products.css'

const PHOTO_BASE_URL = 'http://192.168.150.220:5001/uploads'

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

function Products() {
  const [products, setProducts] = useState([])
  const [productTypes, setProductTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState(null) // null = All

  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)

  const [typeName, setTypeName] = useState('')
  const [productName, setProductName] = useState('')
  const [productTypeId, setProductTypeId] = useState('')
  const [productPhoto, setProductPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)

  // Product options (per-product): opened by clicking a product card
  const [optionsProduct, setOptionsProduct] = useState(null) // the product whose options are shown
  const [options, setOptions] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionName, setOptionName] = useState('')
  const [optionSaving, setOptionSaving] = useState(false)
  const [optionError, setOptionError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null) // option awaiting delete confirmation
  const [deletingOptionId, setDeletingOptionId] = useState(null)

  async function loadData() {
    const [productsRes, typesRes] = await Promise.all([getProducts(), getProductTypes()])
    setProducts(productsRes)
    setProductTypes(typesRes)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetProductForm() {
    setProductName('')
    setProductTypeId('')
    setProductPhoto(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview('')
  }

  function onPhotoChange(e) {
    const file = e.target.files[0] ?? null
    setProductPhoto(file)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(file ? URL.createObjectURL(file) : '')
  }

  async function handleAddType(e) {
    e.preventDefault()
    if (!typeName.trim()) return
    setSaving(true)
    await createProductType({ Name: typeName })
    setTypeName('')
    setTypeModalOpen(false)
    await loadData()
    setSaving(false)
  }

  async function handleAddProduct(e) {
    e.preventDefault()
    if (!productName.trim() || !productTypeId) return
    const formData = new FormData()
    formData.append('Name', productName)
    formData.append('Type_ID', productTypeId)
    if (productPhoto) formData.append('Photo', productPhoto)
    setSaving(true)
    await createProduct(formData)
    resetProductForm()
    setProductModalOpen(false)
    await loadData()
    setSaving(false)
  }

  // Click a product card -> open its options modal and load the options for that product ID
  async function openOptions(product) {
    setOptionsProduct(product)
    setOptionName('')
    setOptions([])
    setOptionError('')
    setConfirmDeleteId(null)
    setOptionsLoading(true)
    try {
      const res = await getProductOptions(product.ID)
      setOptions(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error('could not load product options:', err)
      setOptions([])
    } finally {
      setOptionsLoading(false)
    }
  }

  function closeOptions() {
    setOptionsProduct(null)
    setConfirmDeleteId(null)
    setOptionError('')
  }

  // Add a new option to the currently opened product
  async function handleAddOption(e) {
    e.preventDefault()
    if (!optionName.trim() || !optionsProduct) return
    setOptionSaving(true)
    setOptionError('')
    try {
      await createProducOptions({ Name: optionName.trim(), Product_ID: optionsProduct.ID })
      setOptionName('')
      const res = await getProductOptions(optionsProduct.ID)
      setOptions(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error('could not add product option:', err)
      setOptionError('Could not add the option.')
    } finally {
      setOptionSaving(false)
    }
  }

  // Delete an option, then re-read the list so the UI shows what the server actually has
  async function handleDeleteOption(opt) {
    if (!optionsProduct) return
    setDeletingOptionId(opt.ID)
    setOptionError('')
    try {
      await DeleteProductOption(opt.ID)
      const res = await getProductOptions(optionsProduct.ID)
      setOptions(Array.isArray(res) ? res : [])
      setConfirmDeleteId(null)
    } catch (err) {
      console.error('could not delete product option:', err)
      setOptionError('Could not delete the option.')
    } finally {
      setDeletingOptionId(null)
    }
  }

  function typeNameOf(typeId) {
    return productTypes.find((t) => t.ID === typeId)?.Name ?? 'Unknown'
  }

  function countOf(typeId) {
    return products.filter((p) => p.Type_ID === typeId).length
  }

  const filteredProducts =
    selectedType === null ? products : products.filter((p) => p.Type_ID === selectedType)

  return (
    <div className="products-page">


      <div className="products-shell">
        {/* Left: types */}
        <aside className="types-panel">
          <div className="types-panel__head">
            <h2>Types</h2>
            <button className="icon-add" onClick={() => setTypeModalOpen(true)} aria-label="Add type">
              <PlusIcon />
            </button>
          </div>

          <div className="types-list">
            <button
              className={selectedType === null ? 'type-item type-item--active' : 'type-item'}
              onClick={() => setSelectedType(null)}
            >
              <span className="type-item__name">All</span>
              <span className="type-item__count">{products.length}</span>
            </button>

            {productTypes.map((type) => (
              <button
                key={type.ID}
                className={selectedType === type.ID ? 'type-item type-item--active' : 'type-item'}
                onClick={() => setSelectedType(type.ID)}
              >
                <span className="type-item__name">{type.Name}</span>
                <span className="type-item__count">{countOf(type.ID)}</span>
              </button>
            ))}

            {!loading && productTypes.length === 0 && (
              <span className="types-list__empty">No types yet</span>
            )}
          </div>
        </aside>

        {/* Right: products */}
        <main className="products-main">
          <div className="products-main__head">
            <div className="products-main__heading">
              <h2>{selectedType === null ? 'All Products' : typeNameOf(selectedType)}</h2>
              <span className="count-pill">{filteredProducts.length}</span>
            </div>
            <button className="btn btn--primary btn--sm" onClick={() => setProductModalOpen(true)}>
              <PlusIcon />
              New Product
            </button>
          </div>

          {loading ? (
            <div className="state-text state-text--pad">Loading…</div>
          ) : filteredProducts.length === 0 ? (
            <div className="state-text state-text--pad">No products in this view.</div>
          ) : (
            <div className="product-cards">
              {filteredProducts.map((product) => (
                <div
                  key={product.ID}
                  className="product-card"
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openOptions(product)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOptions(product) } }}
                  title="Seçenekleri görüntüle / ekle"
                >
                  <div className="product-card__image">
                    {product.Photo ? (
                      <img src={`${PHOTO_BASE_URL}/${product.Photo}`} alt={product.Name} />
                    ) : (
                      <span className="product-card__placeholder">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="product-card__body">
                    <div className="product-card__name">{product.Name}</div>
                    <span className="tag">{typeNameOf(product.Type_ID)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Modal
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        title="New Product Type"
        description="Create a new type to classify products."
      >
        <form className="form" onSubmit={handleAddType}>
          <label className="field">
            <span className="field__label">Type Name</span>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Automation"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
            />
          </label>
          <div className="form__footer">
            <button type="button" className="btn btn--ghost" onClick={() => setTypeModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={productModalOpen}
        onClose={() => {
          resetProductForm()
          setProductModalOpen(false)
        }}
        title="New Product"
        description="Enter the product details and pick a type."
      >
        <form className="form" onSubmit={handleAddProduct}>
          <label className="field">
            <span className="field__label">Product Name</span>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Smartline C"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Type</span>
            <select value={productTypeId} onChange={(e) => setProductTypeId(e.target.value)}>
              <option value="">Select a type</option>
              {productTypes.map((type) => (
                <option key={type.ID} value={type.ID}>
                  {type.Name}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span className="field__label">Photo</span>
            <label className="dropzone">
              <input type="file" accept="image/*" onChange={onPhotoChange} />
              {photoPreview ? (
                <img className="dropzone__preview" src={photoPreview} alt="Preview" />
              ) : (
                <span className="dropzone__hint">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M17 8l-5-5-5 5" />
                    <path d="M12 3v12" />
                  </svg>
                  Click to upload an image
                </span>
              )}
            </label>
            {productPhoto && <span className="field__hint">{productPhoto.name}</span>}
          </div>

          <div className="form__footer">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                resetProductForm()
                setProductModalOpen(false)
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!optionsProduct}
        onClose={closeOptions}
        title={optionsProduct ? `${optionsProduct.Name} — Options` : 'Options'}
        description="View this product's options, add new ones or remove them."
      >
        <form className="form" onSubmit={handleAddOption}>
          <div className="field">
            <span className="field__label">New Option</span>
            <div className="option-add">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Automation COM"
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
              />
              <button type="submit" className="btn btn--primary" disabled={optionSaving || !optionName.trim()}>
                {optionSaving ? 'Saving…' : 'Add'}
              </button>
            </div>
          </div>
        </form>

        {optionError && <div className="form__error">{optionError}</div>}

        <div className="option-section">
          <span className="field__label">Existing options</span>
          {optionsLoading ? (
            <div className="state-text option-section__state">Loading…</div>
          ) : options.length === 0 ? (
            <div className="state-text option-section__state">No options yet.</div>
          ) : (
            <ul className="option-list">
              {options.map((opt) => {
                const confirming = confirmDeleteId === opt.ID
                const busy = deletingOptionId === opt.ID
                return (
                  <li key={opt.ID} className="option-row">
                    <span className="option-row__name">{opt.Name}</span>

                    {confirming ? (
                      <span className="option-row__actions">
                        <span className="option-row__confirm">Delete?</span>
                        <button
                          type="button"
                          className="btn btn--danger btn--xs"
                          onClick={() => handleDeleteOption(opt)}
                          disabled={busy}
                        >
                          {busy ? 'Deleting…' : 'Yes'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--xs"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={busy}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="option-row__actions">
                        <span className="option-row__id">#{opt.ID}</span>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setConfirmDeleteId(opt.ID)}
                          aria-label={`Delete option ${opt.Name}`}
                          title="Delete option"
                        >
                          <TrashIcon />
                        </button>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="form__footer option-section__footer">
          <button type="button" className="btn btn--ghost" onClick={closeOptions}>
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Products
