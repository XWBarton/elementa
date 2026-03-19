import client from './client'
import type { Project, ProjectCreate, ProjectMember, ProjectUpdate } from '../types'

export async function getProjects(): Promise<Project[]> {
  const { data } = await client.get('/projects/')
  return data
}

export async function createProject(payload: ProjectCreate): Promise<Project> {
  const { data } = await client.post('/projects/', payload)
  return data
}

export async function updateProject(id: number, payload: ProjectUpdate): Promise<Project> {
  const { data } = await client.put(`/projects/${id}`, payload)
  return data
}

export async function deleteProject(id: number): Promise<void> {
  await client.delete(`/projects/${id}`)
}

export async function addProjectMember(projectId: number, userId: number): Promise<ProjectMember[]> {
  const { data } = await client.post(`/projects/${projectId}/members/${userId}`)
  return data
}

export async function removeProjectMember(projectId: number, userId: number): Promise<ProjectMember[]> {
  const { data } = await client.delete(`/projects/${projectId}/members/${userId}`)
  return data
}
