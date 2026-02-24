import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deleteUser, hardDeleteUser } from '../api/users'

export function useUsers(params?: { skip?: number; limit?: number }) {
  return useQuery({ queryKey: ['users', params], queryFn: () => getUsers(params), staleTime: 30_000 })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useHardDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: hardDeleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
