import apiClient from './client'

export const violationApi = {
  getValues: (params) => apiClient.get('/violations/values', { params }),
  getNotes:  (params) => apiClient.get('/violations/notes',  { params }),
  createValue: (data) => apiClient.post('/violations/values', data),
  createNote:  (data) => apiClient.post('/violations/notes',  data),
  deleteNote:  (id)   => apiClient.delete(`/violations/notes/${id}`),
}
