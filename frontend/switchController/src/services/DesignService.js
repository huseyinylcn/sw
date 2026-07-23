import request from "./api";



export function createDesign(formData) {
  return request('/v1/post/design', {
    method: 'POST',
    body: formData,   
  })
}


export function getDesigns() {
  return request('/v1/get/designs', {
    method: 'GET'  
  })
}


export function deleteDesign(data) {
  return request('/v1/delete/design', {
    method: 'DELETE',
    body: JSON.stringify(data),   
  })
}


export function getDesign(data) {
  return request(`/v1/get/design/${data.id}`, {
    method: 'GET'  
  })
}




export function updateDesign(data) {
  return request('/v1/update/design', {
    method: 'POST',
    body: JSON.stringify(data),   
  })
}



export function updateSwitch(data) {
  return request('/v1/update/switch', {
    method: 'POST',
    body: JSON.stringify(data),   
  })
}



export function createScript(data) {
  return request('/v1/post/script', {
    method: 'POST',
    body: JSON.stringify(data),   
  })
}



export function getScripts(data) {
  return request(`/v1/get/scripts/${data.id}`, {
    method: 'GET'  
  })
}


export function getScript(data) {
  return request(`/v1/get/script/${data.id}`, {
    method: 'GET'  
  })
}



export function getSerialStatus() {
  return request(`/v1/get/serial/status`, {
    method: 'GET'  
  })
}


export function getSerial() {
  return request(`/v1/get/serial`, {
    method: 'GET'  
  })
}

export function updateSerial(data) {
  return request('/v1/post/serial', {
    method: 'POST',
    body: JSON.stringify(data),   
  })
}


export function connectSerial() {
  return request('/v1/post/serial/connect', {
    method: 'POST',
    body: JSON.stringify({}),   
  })
}


export function disconnectSerial() {
  return request('/v1/post/serial/close', {
    method: 'POST',
    body: JSON.stringify({}),   
  })
}


export function updateScript(data) {
  return request('/v1/update/script', {
    method: 'POST',
    body: JSON.stringify(data),   
  })
}


