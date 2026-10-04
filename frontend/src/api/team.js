import request from './request'

export const createTeam = (data) => {
  return request.post('/teams', data)
}

export const getMyTeams = () => {
  return request.get('/teams/my')
}

export const getTeamDetail = (id) => {
  return request.get(`/teams/${id}`)
}

export const updateTeam = (id, data) => {
  return request.put(`/teams/${id}`, data)
}

export const inviteMember = (teamId, username) => {
  return request.post(`/teams/${teamId}/invite`, { username })
}

export const getPendingInvitations = () => {
  return request.get('/teams/invitations/pending')
}

export const acceptInvitation = (id) => {
  return request.post(`/teams/invitations/${id}/accept`)
}

export const rejectInvitation = (id) => {
  return request.post(`/teams/invitations/${id}/reject`)
}

export const updateMemberRole = (teamId, userId, data) => {
  return request.put(`/teams/${teamId}/members/${userId}`, data)
}

export const removeMember = (teamId, userId) => {
  return request.delete(`/teams/${teamId}/members/${userId}`)
}
