import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import userService from '@/services/userService'
import { useAuth } from '@/context/AuthContext'

const UsersContext = createContext(null)

export function UsersProvider({ children }) {
  const { isAuthenticated, user: authUser } = useAuth()

  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated || authUser?.role !== 'administrador') return
    setLoading(true)
    setError(null)
    try {
      setUsers(await userService.getAll())
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, authUser?.role])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addUser = useCallback(async (data) => {
    const created = await userService.create(data)
    setUsers((prev) => [created, ...prev])
    return created
  }, [])

  const updateUser = useCallback(async (id, data) => {
    const updated = await userService.update(id, data)
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    return updated
  }, [])

  const deleteUser = useCallback(async (id) => {
    await userService.delete(id)
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: false } : u)))
  }, [])

  const toggleUser = useCallback(async (id, currentlyActive) => {
    const updated = await userService.update(id, { status: currentlyActive ? 0 : 1 })
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
  }, [])

  return (
    <UsersContext.Provider
      value={{ users, loading, error, refetch: fetchAll, addUser, updateUser, deleteUser, toggleUser }}
    >
      {children}
    </UsersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUsers() {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used within UsersProvider')
  return ctx
}
