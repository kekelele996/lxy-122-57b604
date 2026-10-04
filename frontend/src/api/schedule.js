import request from './request'

export const createSchedule = (data) => {
  return request.post('/schedules', data)
}

export const getTeamSchedules = (teamId) => {
  return request.get(`/schedules/team/${teamId}`)
}

export const getMyUpcomingSchedules = () => {
  return request.get('/schedules/my/upcoming')
}

export const getScheduleDetail = (id) => {
  return request.get(`/schedules/${id}`)
}

export const updateAttendance = (id, data) => {
  return request.post(`/schedules/${id}/attendance`, data)
}

export const getAttendanceStats = (teamId) => {
  return request.get(`/schedules/${teamId}/attendance/stats`)
}

export const updateSchedule = (id, data) => {
  return request.put(`/schedules/${id}`, data)
}

export const deleteSchedule = (id) => {
  return request.delete(`/schedules/${id}`)
}
