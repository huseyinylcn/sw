import request from "./api";



export function createProduct(formData) {
  return request('/v1/post/product', {
    method: 'POST',
    body: formData,   
  })
}

export function getProduct(data) {
  return request(`/v1/get/product/${data.id}`, {
    method: 'GET', 
  })
}

export function getProducts(data) {
  return request(`/v1/get/products`, {
    method: 'GET', 
  })
}


export function getProductOptions(id) {
  return request(`/v1/get/product_options/${id}`, {
    method: 'GET', 
  })
}


export function createProducOptions(data) {
  return request('/v1/post/product-options', {
    method: 'POST',
    body: JSON.stringify(data),   
  })
}


export function DeleteProductOption(id) {
  return request(`/v1/delete/product_options/${id}`, {
    method: 'DELETE', 
  })
}

