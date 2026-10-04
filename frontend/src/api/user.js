import request from './request'

export const login = (data) => {
  return request.post('/user/login', data)
}

export const register = (data) => {
  return request.post('/user/register', data)
}

export const getProfile = () => {
  return request.get('/user/profile')
}

export const updateProfile = (data) => {
  return request.put('/user/profile', data)
}

export const searchUsers = (q) => {
  return request.get('/user/search', { params: { q } })
}
