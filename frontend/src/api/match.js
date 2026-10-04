import request from './request'

export const createMatch = (data) => {
  return request.post('/matches', data)
}

export const getTeamMatches = (teamId) => {
  return request.get(`/matches/team/${teamId}`)
}

export const getMatchDetail = (id) => {
  return request.get(`/matches/${id}`)
}

export const updateMatch = (id, data) => {
  return request.put(`/matches/${id}`, data)
}

export const deleteMatch = (id) => {
  return request.delete(`/matches/${id}`)
}

export const addMatchNote = (id, content) => {
  return request.post(`/matches/${id}/notes`, { content })
}

export const getTeamStats = (teamId) => {
  return request.get(`/matches/${teamId}/stats`)
}
