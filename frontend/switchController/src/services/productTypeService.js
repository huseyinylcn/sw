import request from "./api";

export function createProductType(data) {
  return request('/v1/post/product-type', {
    method: 'POST',
    body: JSON.stringify(data),   
  })
}


export function getProductType(data) {
  return request(`/v1/get/product-type/${data.id}`, {
    method: 'GET', 
  })
}

export function getProductTypes() {
  return request(`/v1/get/product-types`, {
    method: 'GET',
  })
}