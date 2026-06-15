import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import './Grupos.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import ReloadButton from './components/ReloadButton'
import NotificationsButton from './components/NotificationsButton'
import { useAuth } from './contexts/AuthContext'
import { useNotifications } from './contexts/NotificationsContext'
import { authFetch } from './lib/authFetch'
import { supabase } from './lib/supabase'

const getMemberRoles = (member) => {
  if (member.roles?.length) {
    return member.roles
  }

  const roles = []
  if (member.is_founder) roles.push('Fundador')
  if (member.is_leader) roles.push('Líder')
  return roles
}


const isMemberFounder = (member) => member.is_founder || getMemberRoles(member).includes('Fundador')

const formatUserDisplayName = (user) => `${user.name} ${user.last_name}`.trim()

const sanitizeSearchTerm = (term) => term.trim().replace(/[,()]/g, '')

const visibilityLabels = {
  publico: 'Público',
  restrito: 'Público | Aprovação',
  privado: 'Privado',
}

const permissionLabels = {
  todos: 'Todos os membros',
  lideres: 'Apenas líderes',
  ninguem: 'Ninguém',
}

const groupRequiresConsent = (group) => {
  if (!group?.permissions) {
    return false
  }

  const { view, manage } = group.permissions
  return !(view === 'ninguem' && manage === 'ninguem')
}

function Grupos() {
  const { user } = useAuth()
  const { loadNotifications } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)
  const [selectedTransferUserId, setSelectedTransferUserId] = useState('')
  const [inviteSearchTerm, setInviteSearchTerm] = useState('')
  const [inviteSearchResults, setInviteSearchResults] = useState([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [inviteSearchError, setInviteSearchError] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [visibility, setVisibility] = useState('publico')
  const [viewPermission, setViewPermission] = useState('todos')
  const [managePermission, setManagePermission] = useState('todos')
  const [hasMaxMembers, setHasMaxMembers] = useState(false)
  const [maxMembers, setMaxMembers] = useState('')
  const [ownedGroups, setOwnedGroups] = useState([])
  const [publicGroups, setPublicGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [detailsError, setDetailsError] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [memberActionLoadingId, setMemberActionLoadingId] = useState(null)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)
  const [isTransferringFounder, setIsTransferringFounder] = useState(false)
  const [actionError, setActionError] = useState('')
  const [transferError, setTransferError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [joinRequestLoadingId, setJoinRequestLoadingId] = useState(null)
  const [inviteLinkFeedback, setInviteLinkFeedback] = useState('')
  const [inviteLinkError, setInviteLinkError] = useState('')
  const [isCreatingInviteLink, setIsCreatingInviteLink] = useState(false)
  const [inviteSendingUserId, setInviteSendingUserId] = useState(null)
  const [invitePreview, setInvitePreview] = useState(null)
  const [inviteToken, setInviteToken] = useState('')
  const [consentMode, setConsentMode] = useState('join')

  const fetchGroups = useCallback(async (showRefreshSpinner = false) => {
    if (!user) {
      setOwnedGroups([])
      setPublicGroups([])
      setIsLoading(false)
      return
    }

    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const [mineResponse, publicResponse] = await Promise.all([
        authFetch('api/groups/mine'),
        authFetch('api/groups/public'),
      ])

      const mineData = await mineResponse.json()
      const publicData = await publicResponse.json()

      if (!mineResponse.ok || mineData.status !== 'success') {
        throw new Error(mineData.message || 'Erro ao carregar seus grupos')
      }

      if (!publicResponse.ok || publicData.status !== 'success') {
        throw new Error(publicData.message || 'Erro ao carregar grupos públicos')
      }

      setOwnedGroups(mineData.data || [])
      setPublicGroups(publicData.data || [])
    } catch (fetchError) {
      console.error('Erro ao carregar grupos:', fetchError)
      setError(fetchError.message || 'Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  useEffect(() => {
    const token = searchParams.get('convite')

    if (!token || !user) {
      return
    }

    const loadInvitePreview = async () => {
      try {
        const response = await authFetch(`api/groups/invites/${encodeURIComponent(token)}`)
        const data = await response.json()

        if (!response.ok || data.status !== 'success') {
          setError(data.message || 'Convite inválido ou expirado')
          setSearchParams({}, { replace: true })
          return
        }

        setInviteToken(token)
        setInvitePreview(data.data)
        setConsentMode('invite')

        if (data.data.requiresConsent) {
          setIsConsentModalOpen(true)
        } else {
          const acceptResponse = await authFetch(`api/groups/invites/${encodeURIComponent(token)}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consented: false }),
          })
          const acceptData = await acceptResponse.json()

          if (acceptResponse.ok && acceptData.status === 'success') {
            await fetchGroups(true)
            await loadNotifications()
            setSelectedGroup(acceptData.data)
            setIsDetailsModalOpen(true)
          } else {
            setError(acceptData.message || 'Erro ao aceitar convite')
          }

          setInviteToken('')
          setInvitePreview(null)
          setConsentMode('join')
        }

        setSearchParams({}, { replace: true })
      } catch (inviteErr) {
        console.error('Erro ao carregar convite:', inviteErr)
        setError('Erro ao carregar convite')
        setSearchParams({}, { replace: true })
      }
    }

    loadInvitePreview()
  }, [searchParams, user, fetchGroups, loadNotifications, setSearchParams])

  const resetGroupForm = () => {
    setGroupName('')
    setGroupDescription('')
    setVisibility('publico')
    setViewPermission('todos')
    setManagePermission('todos')
    setHasMaxMembers(false)
    setMaxMembers('')
    setSubmitError('')
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedGroup(null)
    setDetailsError(null)
    setIsDetailsLoading(false)
    setIsInviteModalOpen(false)
    setIsDeleteModalOpen(false)
    setIsTransferModalOpen(false)
    setIsConsentModalOpen(false)
    setSelectedTransferUserId('')
    setInvitePreview(null)
    setInviteToken('')
    setConsentMode('join')
    setInviteLinkFeedback('')
    setInviteLinkError('')
    setActionError('')
    setTransferError('')
    setMemberActionLoadingId(null)
    setIsGroupModalOpen(false)
    setEditingGroupId(null)
    resetGroupForm()
    setInviteSearchTerm('')
    setInviteSearchResults([])
    setInviteSearchError('')
  }

  useEffect(() => {
    if (!isGroupModalOpen && !isDetailsModalOpen && !isInviteModalOpen && !isDeleteModalOpen && !isTransferModalOpen && !isConsentModalOpen) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (isDeleteModalOpen) {
          setIsDeleteModalOpen(false)
          return
        }

        if (isConsentModalOpen) {
          handleCloseConsentModal()
          return
        }

        if (isTransferModalOpen) {
          setIsTransferModalOpen(false)
          setSelectedTransferUserId('')
          setTransferError('')
          return
        }

        if (isInviteModalOpen) {
          setIsInviteModalOpen(false)
          setInviteSearchTerm('')
          setInviteSearchResults([])
          setInviteSearchError('')
          return
        }

        if (isGroupModalOpen && editingGroupId) {
          setIsGroupModalOpen(false)
          setEditingGroupId(null)
          resetGroupForm()
          return
        }

        if (isDetailsModalOpen) {
          handleCloseDetailsModal()
          return
        }

        setIsGroupModalOpen(false)
        setEditingGroupId(null)
        resetGroupForm()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isDetailsModalOpen, isGroupModalOpen, isInviteModalOpen, isDeleteModalOpen, isTransferModalOpen, isConsentModalOpen, editingGroupId])

  const handleOpenGroupModal = () => {
    resetGroupForm()
    setEditingGroupId(null)
    setIsGroupModalOpen(true)
  }

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false)
    setEditingGroupId(null)
    resetGroupForm()
  }

  const populateGroupForm = (group) => {
    setGroupName(group.name)
    setGroupDescription(group.description || '')
    setVisibility(group.visibility)
    setViewPermission(group.permissions.view)
    setManagePermission(group.permissions.manage)

    if (group.maxMembers) {
      setHasMaxMembers(true)
      setMaxMembers(String(group.maxMembers))
    } else {
      setHasMaxMembers(false)
      setMaxMembers('')
    }
  }

  const buildGroupPayload = () => {
    const parsedMaxMembers = hasMaxMembers ? Number(maxMembers) : null

    return {
      name: groupName.trim(),
      description: groupDescription.trim(),
      visibility,
      view: viewPermission,
      manage: managePermission,
      maxMembers: Number.isFinite(parsedMaxMembers) && parsedMaxMembers > 0 ? parsedMaxMembers : null,
    }
  }

  const handleOpenEditGroup = () => {
    if (!selectedGroup) {
      return
    }

    setIsInviteModalOpen(false)
    setIsDeleteModalOpen(false)
    populateGroupForm(selectedGroup)
    setEditingGroupId(selectedGroup.id)
    setIsGroupModalOpen(true)
  }

  const handleSubmitGroup = async (event) => {
    event.preventDefault()

    const payload = buildGroupPayload()

    if (!payload.name) {
      setSubmitError('Nome do grupo é obrigatório')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const endpoint = editingGroupId ? `api/groups/${editingGroupId}` : 'api/groups'
      const method = editingGroupId ? 'PATCH' : 'POST'

      const response = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setSubmitError(data.message || 'Erro ao salvar grupo')
        return
      }

      const savedGroup = data.data

      if (editingGroupId) {
        setSelectedGroup(savedGroup)
        setOwnedGroups((currentGroups) => currentGroups.map((group) => (
          group.id === editingGroupId ? { ...group, ...savedGroup } : group
        )))
      } else {
        setSelectedGroup(savedGroup)
        setIsDetailsModalOpen(true)
      }

      await fetchGroups(true)
      setIsGroupModalOpen(false)
      setEditingGroupId(null)
      resetGroupForm()
    } catch (submitErr) {
      console.error('Erro ao salvar grupo:', submitErr)
      setSubmitError('Erro ao conectar com o servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchGroupDetails = async (groupId) => {
    setIsDetailsLoading(true)
    setDetailsError(null)

    try {
      const response = await authFetch(`api/groups/${groupId}`)
      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Erro ao carregar detalhes do grupo')
      }

      setSelectedGroup(data.data)
    } catch (detailsErr) {
      console.error('Erro ao carregar detalhes do grupo:', detailsErr)
      setDetailsError(detailsErr.message || 'Erro ao carregar detalhes do grupo')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleOpenGroupDetails = (group) => {
    setSelectedGroup(group)
    setDetailsError(null)
    setIsDetailsModalOpen(true)
    fetchGroupDetails(group.id)
  }

  const handleOpenInviteModal = () => {
    setInviteSearchTerm('')
    setInviteSearchResults([])
    setInviteSearchError('')
    setInviteLinkFeedback('')
    setInviteLinkError('')
    setIsDeleteModalOpen(false)
    setIsGroupModalOpen(false)
    setEditingGroupId(null)
    resetGroupForm()
    setIsInviteModalOpen(true)
  }

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false)
    setInviteSearchTerm('')
    setInviteSearchResults([])
    setInviteSearchError('')
    setInviteLinkFeedback('')
    setInviteLinkError('')
  }

  const handleOpenDeleteModal = () => {
    setIsInviteModalOpen(false)
    setIsGroupModalOpen(false)
    setEditingGroupId(null)
    resetGroupForm()
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setActionError('')
  }

  const applyGroupUpdate = (updatedGroup) => {
    setSelectedGroup(updatedGroup)
    setOwnedGroups((currentGroups) => currentGroups.map((group) => (
      group.id === updatedGroup.id ? { ...group, ...updatedGroup } : group
    )))
  }

  const handleMemberAction = async (memberUserId, action) => {
    if (!selectedGroup?.id || memberActionLoadingId) {
      return
    }

    const actionPaths = {
      promote: `api/groups/${selectedGroup.id}/members/${memberUserId}/promote`,
      demote: `api/groups/${selectedGroup.id}/members/${memberUserId}/demote`,
      remove: `api/groups/${selectedGroup.id}/members/${memberUserId}`,
    }

    const methods = {
      promote: 'PATCH',
      demote: 'PATCH',
      remove: 'DELETE',
    }

    setMemberActionLoadingId(memberUserId)
    setActionError('')

    try {
      const response = await authFetch(actionPaths[action], { method: methods[action] })
      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || 'Erro ao atualizar membro')
        return
      }

      applyGroupUpdate(data.data)
      await fetchGroups(true)
    } catch (actionErr) {
      console.error('Erro na ação de membro:', actionErr)
      setActionError('Erro ao conectar com o servidor')
    } finally {
      setMemberActionLoadingId(null)
    }
  }

  const handleConfirmDeleteGroup = async () => {
    if (!selectedGroup?.id || isDeletingGroup) {
      return
    }

    setIsDeletingGroup(true)
    setActionError('')

    try {
      const response = await authFetch(`api/groups/${selectedGroup.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || 'Erro ao excluir grupo')
        return
      }

      handleCloseDetailsModal()
      await fetchGroups(true)
    } catch (deleteErr) {
      console.error('Erro ao excluir grupo:', deleteErr)
      setActionError('Erro ao conectar com o servidor')
    } finally {
      setIsDeletingGroup(false)
    }
  }

  const handleOpenTransferModal = () => {
    setSelectedTransferUserId('')
    setTransferError('')
    setIsDeleteModalOpen(false)
    setIsInviteModalOpen(false)
    setIsGroupModalOpen(false)
    setEditingGroupId(null)
    resetGroupForm()
    setIsTransferModalOpen(true)
  }

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false)
    setSelectedTransferUserId('')
    setTransferError('')
  }

  const handleConfirmTransferFounder = async () => {
    if (!selectedGroup?.id || !selectedTransferUserId || isTransferringFounder) {
      setTransferError('Selecione um membro para transferir a fundação')
      return
    }

    setIsTransferringFounder(true)
    setTransferError('')

    try {
      const response = await authFetch(`api/groups/${selectedGroup.id}/transfer-founder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedTransferUserId }),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setTransferError(data.message || 'Erro ao transferir fundação')
        return
      }

      applyGroupUpdate(data.data)
      await fetchGroups(true)
      handleCloseTransferModal()
    } catch (transferErr) {
      console.error('Erro ao transferir fundação:', transferErr)
      setTransferError('Erro ao conectar com o servidor')
    } finally {
      setIsTransferringFounder(false)
    }
  }

  const handleConfirmJoin = async () => {
    if (!selectedGroup?.id || isJoining) {
      return
    }

    setIsJoining(true)
    setActionError('')

    const payload = groupRequiresConsent(selectedGroup)
      ? {
          consented: true,
          consented_view: selectedGroup.permissions.view,
          consented_manage: selectedGroup.permissions.manage,
        }
      : { consented: false }

    try {
      const response = await authFetch(`api/groups/${selectedGroup.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || 'Erro ao entrar no grupo')
        return
      }

      applyGroupUpdate(data.data)
      await fetchGroups(true)
      await loadNotifications()
      setIsConsentModalOpen(false)
      setConsentMode('join')
    } catch (joinErr) {
      console.error('Erro ao entrar no grupo:', joinErr)
      setActionError('Erro ao conectar com o servidor')
    } finally {
      setIsJoining(false)
    }
  }

  const handleConfirmInviteAccept = async () => {
    if (!inviteToken || isJoining) {
      return
    }

    const previewGroup = invitePreview?.group
    if (!previewGroup) {
      return
    }

    setIsJoining(true)
    setActionError('')

    const payload = invitePreview.requiresConsent
      ? {
          consented: true,
          consented_view: previewGroup.permissions.view,
          consented_manage: previewGroup.permissions.manage,
        }
      : { consented: false }

    try {
      const response = await authFetch(`api/groups/invites/${encodeURIComponent(inviteToken)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || 'Erro ao aceitar convite')
        return
      }

      setSelectedGroup(data.data)
      setIsDetailsModalOpen(true)
      setIsConsentModalOpen(false)
      setInviteToken('')
      setInvitePreview(null)
      setConsentMode('join')
      await fetchGroups(true)
      await loadNotifications()
    } catch (inviteErr) {
      console.error('Erro ao aceitar convite:', inviteErr)
      setActionError('Erro ao conectar com o servidor')
    } finally {
      setIsJoining(false)
    }
  }

  const handleConfirmConsent = () => {
    if (consentMode === 'invite') {
      handleConfirmInviteAccept()
      return
    }

    handleConfirmJoin()
  }

  const handleCloseConsentModal = () => {
    setIsConsentModalOpen(false)
    setActionError('')
    setInviteToken('')
    setInvitePreview(null)
    setConsentMode('join')
  }

  const handleOpenJoinFlow = () => {
    if (!selectedGroup) {
      return
    }

    setActionError('')
    setConsentMode('join')

    if (groupRequiresConsent(selectedGroup)) {
      setIsConsentModalOpen(true)
      return
    }

    handleConfirmJoin()
  }

  const handleSendDirectInvite = async (targetUserId) => {
    if (!selectedGroup?.id || inviteSendingUserId) {
      return
    }

    setInviteSendingUserId(targetUserId)
    setInviteSearchError('')

    try {
      const response = await authFetch(`api/groups/${selectedGroup.id}/invites/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId }),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setInviteSearchError(data.message || 'Erro ao enviar convite')
        return
      }

      setInviteSearchError('')
      setInviteLinkFeedback(data.message || 'Convite enviado com sucesso.')
    } catch (inviteErr) {
      console.error('Erro ao enviar convite:', inviteErr)
      setInviteSearchError('Erro ao conectar com o servidor')
    } finally {
      setInviteSendingUserId(null)
    }
  }

  const handleCreateInviteLink = async () => {
    if (!selectedGroup?.id || isCreatingInviteLink) {
      return
    }

    setIsCreatingInviteLink(true)
    setInviteLinkFeedback('')
    setInviteLinkError('')

    try {
      const response = await authFetch(`api/groups/${selectedGroup.id}/invites/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: false }),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setInviteLinkError(data.message || 'Erro ao gerar link de convite')
        return
      }

      const token = data.data?.token
      const inviteUrl = `${window.location.origin}/grupos?convite=${encodeURIComponent(token)}`

      await navigator.clipboard.writeText(inviteUrl)
      setInviteLinkFeedback('Link de convite copiado para a área de transferência.')
    } catch (linkErr) {
      console.error('Erro ao gerar link de convite:', linkErr)
      setInviteLinkError('Erro ao gerar ou copiar o link de convite')
    } finally {
      setIsCreatingInviteLink(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!selectedGroup?.id || isLeaving) {
      return
    }

    setIsLeaving(true)
    setActionError('')

    try {
      const response = await authFetch(`api/groups/${selectedGroup.id}/leave`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || 'Erro ao sair do grupo')
        return
      }

      handleCloseDetailsModal()
      await fetchGroups(true)
    } catch (leaveErr) {
      console.error('Erro ao sair do grupo:', leaveErr)
      setActionError('Erro ao conectar com o servidor')
    } finally {
      setIsLeaving(false)
    }
  }

  const handleJoinRequestAction = async (requestId, action) => {
    if (!selectedGroup?.id || joinRequestLoadingId) {
      return
    }

    setJoinRequestLoadingId(requestId)
    setActionError('')

    try {
      const response = await authFetch(
        `api/groups/${selectedGroup.id}/join-requests/${requestId}/${action}`,
        { method: 'POST' }
      )

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || 'Erro ao processar solicitação')
        return
      }

      if (data.data) {
        applyGroupUpdate(data.data)
      }

      await fetchGroups(true)
      await loadNotifications()
    } catch (requestErr) {
      console.error('Erro ao processar solicitação:', requestErr)
      setActionError('Erro ao conectar com o servidor')
    } finally {
      setJoinRequestLoadingId(null)
    }
  }

  useEffect(() => {
    if (!isInviteModalOpen) {
      return undefined
    }

    const searchUsers = async () => {
      const query = sanitizeSearchTerm(inviteSearchTerm)

      if (!query) {
        setInviteSearchResults([])
        setInviteSearchError('')
        setIsSearchingUsers(false)
        return
      }

      setIsSearchingUsers(true)
      setInviteSearchError('')

      try {
        const { data, error: searchError } = await supabase
          .from('users')
          .select('id, name, last_name, email')
          .or(`name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10)

        if (searchError) {
          throw searchError
        }

        const excludedUserIds = new Set(
          (selectedGroup?.members || []).map((member) => member.user_id)
        )

        const filteredResults = (data || []).filter((foundUser) => {
          if (user?.id && foundUser.id === user.id) {
            return false
          }

          return !excludedUserIds.has(foundUser.id)
        })

        setInviteSearchResults(filteredResults)
      } catch (searchErr) {
        console.error('Erro ao buscar usuários:', searchErr)
        setInviteSearchResults([])
        setInviteSearchError('Não foi possível buscar usuários. Tente novamente.')
      } finally {
        setIsSearchingUsers(false)
      }
    }

    const timeoutId = setTimeout(() => {
      searchUsers()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [inviteSearchTerm, isInviteModalOpen, selectedGroup, user?.id])

  const renderSectionFeedback = (message, isError = false) => (
    <p className={`grupos-section-feedback${isError ? ' grupos-section-feedback-error' : ''}`}>
      {message}
    </p>
  )

  const renderGroupCard = (group) => {
    const memberLabel = group.maxMembers
      ? `${group.membersCount}/${group.maxMembers} membros`
      : `${group.membersCount} membros`

    return (
      <button
        type="button"
        key={group.id}
        className="grupos-card"
        onClick={() => handleOpenGroupDetails(group)}
      >
        <div className="grupos-card-header">
          <div>
            <h3>{group.name}</h3>
            <p className="grupos-card-visibility">{visibilityLabels[group.visibility] || group.visibility}</p>
          </div>
          <span className="grupos-card-badge">{memberLabel}</span>
        </div>
        <p className="grupos-card-description">{group.description || 'Sem descrição.'}</p>
      </button>
    )
  }

  const detailsGroup = selectedGroup
  const isEditingGroup = Boolean(editingGroupId)
  const currentUserMembership = detailsGroup?.currentUserMembership
  const currentUserJoinRequest = detailsGroup?.currentUserJoinRequest
  const isActiveMember = currentUserMembership?.status === 'active'
  const hasPendingJoin = currentUserJoinRequest?.status === 'pending'
  const canJoin = !isActiveMember
    && !hasPendingJoin
    && detailsGroup?.visibility !== 'privado'
  const canLeave = isActiveMember && !currentUserMembership?.is_founder
  const canManageMembers = isActiveMember && Boolean(
    currentUserMembership?.is_founder || currentUserMembership?.is_leader
  )
  const canDeleteGroup = Boolean(currentUserMembership?.is_founder)
  const isFounder = Boolean(currentUserMembership?.is_founder)

  const transferCandidates = (detailsGroup?.members || []).filter(
    (member) => member.status === 'active' && member.user_id !== user?.id && !member.is_founder
  )

  const consentGroup = consentMode === 'invite' ? invitePreview?.group : detailsGroup

  const renderMemberActions = (member) => {
    if (member.user_id === user?.id || isMemberFounder(member) || !canManageMembers) {
      return null
    }

    const isLoading = memberActionLoadingId === member.user_id
    const isLeaderMember = member.is_leader && !member.is_founder

    if (isLeaderMember) {
      if (!isFounder) {
        return null
      }

      return (
        <div className="grupos-member-actions">
          <button
            type="button"
            className="grupos-member-action grupos-member-action-danger"
            disabled={isLoading}
            onClick={() => handleMemberAction(member.user_id, 'demote')}
          >
            {isLoading ? '...' : 'Rebaixar'}
          </button>
          <button
            type="button"
            className="grupos-member-action grupos-member-action-danger"
            disabled={isLoading}
            onClick={() => handleMemberAction(member.user_id, 'remove')}
          >
            {isLoading ? '...' : 'Expulsar'}
          </button>
        </div>
      )
    }

    return (
      <div className="grupos-member-actions">
        {isFounder && (
          <button
            type="button"
            className="grupos-member-action grupos-member-action-success"
            disabled={isLoading}
            onClick={() => handleMemberAction(member.user_id, 'promote')}
          >
            {isLoading ? '...' : 'Promover'}
          </button>
        )}
        <button
          type="button"
          className="grupos-member-action grupos-member-action-danger"
          disabled={isLoading}
          onClick={() => handleMemberAction(member.user_id, 'remove')}
        >
          {isLoading ? '...' : 'Expulsar'}
        </button>
      </div>
    )
  }

  const renderGroupFormModal = (overlayClassName = '') => (
    <div
      className={`grupos-modal-overlay ${overlayClassName}`.trim()}
      onClick={handleCloseGroupModal}
      role="presentation"
    >
      <div
        className="grupos-modal-card grupos-create-modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEditingGroup ? 'Editar grupo' : 'Novo grupo'}
      >
        <div className="grupos-modal-header">
          <h3>{isEditingGroup ? 'Editar Grupo' : 'Novo Grupo'}</h3>
          <button
            type="button"
            className="grupos-close-button"
            onClick={handleCloseGroupModal}
            aria-label="Fechar modal de grupo"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form className="grupos-form" onSubmit={handleSubmitGroup}>
          <div className="grupos-field">
            <label htmlFor="group-name">Nome</label>
            <input
              id="group-name"
              type="text"
              placeholder="Nome do grupo"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              required
            />
          </div>

          <div className="grupos-field">
            <label htmlFor="group-description">Descrição</label>
            <textarea
              id="group-description"
              rows="4"
              placeholder="Descreva o propósito do grupo"
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
            />
          </div>

          <div className="grupos-main-grid">
            <div className="grupos-field">
              <label htmlFor="group-visibility">Visibilidade e Acesso</label>
              <div className="grupos-select-wrapper">
                <select
                  id="group-visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value)}
                >
                  <option value="restrito">Público | Aprovação necessária</option>
                  <option value="publico">Público | Acesso imediato</option>
                  <option value="privado">Privado | Acesso mediante convite</option>
                </select>
                <i className="bi bi-chevron-down grupos-select-arrow"></i>
              </div>
            </div>

            <div className="grupos-field">
              <label htmlFor="group-max-members-toggle">Número máximo de membros</label>
              <label className="grupos-toggle-row" htmlFor="group-max-members-toggle">
                <input
                  id="group-max-members-toggle"
                  type="checkbox"
                  checked={hasMaxMembers}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setHasMaxMembers(checked)
                    if (!checked) {
                      setMaxMembers('')
                    }
                  }}
                />
                <span>Ativar limite de membros</span>
              </label>
              {hasMaxMembers && (
                <input
                  className="grupos-number-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex.: 25"
                  value={maxMembers}
                  onChange={(event) => setMaxMembers(event.target.value)}
                />
              )}
            </div>
          </div>

          <div className="grupos-permissions-card">
            <div className="grupos-permissions-header">
              <h4>Permissões</h4>
              <p>Defina quem pode visualizar e gerenciar a carteira e as transações do grupo.</p>
            </div>

            <div className="grupos-permissions-grid">
              <div className="grupos-field">
                <label htmlFor="group-view-permission">Visualizar carteira e transações</label>
                <div className="grupos-select-wrapper">
                  <select
                    id="group-view-permission"
                    value={viewPermission}
                    onChange={(event) => setViewPermission(event.target.value)}
                  >
                    <option value="todos">Todos</option>
                    <option value="lideres">Apenas líderes</option>
                    <option value="ninguem">Ninguém</option>
                  </select>
                  <i className="bi bi-chevron-down grupos-select-arrow"></i>
                </div>
              </div>

              <div className="grupos-field">
                <label htmlFor="group-manage-permission">Gerenciar carteira e transações</label>
                <div className="grupos-select-wrapper">
                  <select
                    id="group-manage-permission"
                    value={managePermission}
                    onChange={(event) => setManagePermission(event.target.value)}
                  >
                    <option value="todos">Todos</option>
                    <option value="lideres">Apenas líderes</option>
                    <option value="ninguem">Ninguém</option>
                  </select>
                  <i className="bi bi-chevron-down grupos-select-arrow"></i>
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <p className="grupos-form-error">{submitError}</p>
          )}

          <button type="submit" className="grupos-submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : (isEditingGroup ? 'Salvar alterações' : 'Criar Grupo')}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="grupos-page">
      <Logo />
      <PageTitle title="Grupos" />
      <button
        type="button"
        className="reload-button transaction-button grupos-group-button"
        onClick={handleOpenGroupModal}
        title="Novo grupo"
        aria-label="Novo grupo"
      >
        <i className="bi bi-plus-lg"></i>
        <span>Grupo</span>
      </button>
      <NotificationsButton className="grupos-notifications-button" />
      <ReloadButton
        onClick={() => fetchGroups(true)}
        isLoading={isRefreshing}
        className="grupos-reload-button"
      />

      <div className="grupos-content">
        <section className="grupos-section">
          <h2 className="grupos-section-title">Grupos que você pertence</h2>
          <div className="grupos-card-grid">
            {isLoading && renderSectionFeedback('Carregando grupos...')}
            {!isLoading && error && renderSectionFeedback(error, true)}
            {!isLoading && !error && ownedGroups.length === 0 && renderSectionFeedback('Você ainda não participa de nenhum grupo.')}
            {!isLoading && !error && ownedGroups.map(renderGroupCard)}
          </div>
        </section>

        <section className="grupos-section">
          <h2 className="grupos-section-title">Grupos públicos</h2>
          <div className="grupos-card-grid">
            {isLoading && renderSectionFeedback('Carregando grupos...')}
            {!isLoading && error && renderSectionFeedback(error, true)}
            {!isLoading && !error && publicGroups.length === 0 && renderSectionFeedback('Nenhum grupo público disponível no momento.')}
            {!isLoading && !error && publicGroups.map(renderGroupCard)}
          </div>
        </section>
      </div>

      {isGroupModalOpen && !isEditingGroup && renderGroupFormModal()}

      {isDetailsModalOpen && detailsGroup && (
        <div className="grupos-modal-overlay" onClick={handleCloseDetailsModal} role="presentation">
          <div
            className="grupos-modal-card grupos-details-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes do grupo ${detailsGroup.name}`}
          >
            <div className="grupos-details-header">
              <div className="grupos-details-title-row">
                <h3>{detailsGroup.name}</h3>
                {canManageMembers && (
                  <>
                    <button
                      type="button"
                      className="grupos-details-icon-button"
                      onClick={handleOpenEditGroup}
                      aria-label="Editar grupo"
                      title="Editar grupo"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      type="button"
                      className="grupos-details-icon-button"
                      onClick={handleOpenInviteModal}
                      aria-label="Convidar membros"
                      title="Convidar membros"
                    >
                      <i className="bi bi-envelope"></i>
                    </button>
                    {canDeleteGroup && (
                      <button
                        type="button"
                        className="grupos-details-icon-button"
                        onClick={handleOpenTransferModal}
                        aria-label="Transferir fundação"
                        title="Transferir fundação"
                      >
                        <i className="bi bi-arrow-left-right"></i>
                      </button>
                    )}
                    {canDeleteGroup && (
                      <button
                        type="button"
                        className="grupos-details-icon-button grupos-details-icon-button-danger"
                        onClick={handleOpenDeleteModal}
                        aria-label="Excluir grupo"
                        title="Excluir grupo"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                className="grupos-close-button"
                onClick={handleCloseDetailsModal}
                aria-label="Fechar detalhes do grupo"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="grupos-details-body">
              {isDetailsLoading && renderSectionFeedback('Carregando detalhes...')}
              {!isDetailsLoading && detailsError && renderSectionFeedback(detailsError, true)}

              {!isDetailsLoading && !detailsError && (
                <>
                  <div className="grupos-details-summary">
                    <p className="grupos-details-description">{detailsGroup.description || 'Sem descrição.'}</p>
                    <div className="grupos-details-meta-row">
                      <div className="grupos-details-chip-row">
                        <span className="grupos-details-chip">
                          {visibilityLabels[detailsGroup.visibility] || detailsGroup.visibility}
                        </span>
                        <span className="grupos-details-chip">
                          {detailsGroup.maxMembers
                            ? `${detailsGroup.membersCount}/${detailsGroup.maxMembers} Membros`
                            : `${detailsGroup.membersCount} Membros`}
                        </span>
                      </div>
                      {canJoin && (
                        <button
                          type="button"
                          className="grupos-member-action grupos-member-action-success"
                          onClick={handleOpenJoinFlow}
                          disabled={isJoining}
                        >
                          {isJoining ? 'Entrando...' : 'Entrar'}
                        </button>
                      )}
                      {hasPendingJoin && (
                        <button
                          type="button"
                          className="grupos-member-action grupos-member-action-pending"
                          disabled
                        >
                          Aguardando aprovação
                        </button>
                      )}
                      {canLeave && (
                        <button
                          type="button"
                          className="grupos-member-action grupos-member-action-danger"
                          onClick={handleLeaveGroup}
                          disabled={isLeaving}
                        >
                          {isLeaving ? 'Saindo...' : 'Sair do grupo'}
                        </button>
                      )}
                    </div>
                  </div>

                  {actionError && (
                    <p className="grupos-form-error">{actionError}</p>
                  )}

                  {canManageMembers && (detailsGroup.pendingJoinRequests || []).length > 0 && (
                    <div className="grupos-pending-requests">
                      <h4 className="grupos-pending-requests-title">Solicitações pendentes</h4>
                      {(detailsGroup.pendingJoinRequests || []).map((request) => (
                        <div key={request.id} className="grupos-pending-request-item">
                          <div className="grupos-pending-request-info">
                            <strong>{request.name}</strong>
                            {request.email && <span>{request.email}</span>}
                          </div>
                          <div className="grupos-member-actions">
                            <button
                              type="button"
                              className="grupos-member-action grupos-member-action-success"
                              disabled={joinRequestLoadingId === request.id}
                              onClick={() => handleJoinRequestAction(request.id, 'approve')}
                            >
                              {joinRequestLoadingId === request.id ? '...' : 'Aprovar'}
                            </button>
                            <button
                              type="button"
                              className="grupos-member-action grupos-member-action-danger"
                              disabled={joinRequestLoadingId === request.id}
                              onClick={() => handleJoinRequestAction(request.id, 'reject')}
                            >
                              {joinRequestLoadingId === request.id ? '...' : 'Rejeitar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grupos-members-list">
                    {(detailsGroup.members || []).map((member) => (
                      <div key={member.id} className="grupos-member-item">
                        <div className="grupos-member-info">
                          <div className="grupos-member-name-row">
                            <strong>
                              {member.user_id === user?.id ? `${member.name} (Você)` : member.name}
                            </strong>
                            <div className="grupos-member-badges">
                              {getMemberRoles(member).map((role) => (
                                <span key={role} className="grupos-member-badge">{role}</span>
                              ))}
                            </div>
                          </div>
                          {member.email && (
                            <span className="grupos-member-email">{member.email}</span>
                          )}
                        </div>
                        {renderMemberActions(member)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {isGroupModalOpen && isEditingGroup && renderGroupFormModal('grupos-edit-overlay')}

          {isInviteModalOpen && (
            <div
              className="grupos-modal-overlay grupos-invite-overlay"
              onClick={handleCloseInviteModal}
              role="presentation"
            >
              <div
                className="grupos-modal-card grupos-invite-modal-card"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Convidar membros"
              >
                <div className="grupos-details-header grupos-invite-header">
                  <h3>Convidar membros</h3>
                  <button
                    type="button"
                    className="grupos-close-button"
                    onClick={handleCloseInviteModal}
                    aria-label="Fechar convite de membros"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="grupos-invite-link-section">
                  {detailsGroup?.visibility === 'privado' && (
                    <button
                      type="button"
                      className="grupos-invite-link-button"
                      onClick={handleCreateInviteLink}
                      disabled={isCreatingInviteLink}
                    >
                      <i className="bi bi-link-45deg"></i>
                      <span>
                        {isCreatingInviteLink ? 'Gerando link...' : 'Criar e copiar link de convite'}
                      </span>
                    </button>
                  )}

                  {inviteLinkFeedback && (
                    <p className="grupos-invite-feedback grupos-invite-feedback-success">{inviteLinkFeedback}</p>
                  )}

                  {inviteLinkError && (
                    <p className="grupos-invite-feedback grupos-invite-feedback-error">{inviteLinkError}</p>
                  )}
                </div>

                <div className="grupos-invite-body">
                  <div className="grupos-invite-search">
                    <i className="bi bi-search grupos-invite-search-icon"></i>
                    <input
                      type="text"
                      className="grupos-invite-search-input"
                      placeholder="Pesquisar por nome ou email"
                      value={inviteSearchTerm}
                      onChange={(event) => setInviteSearchTerm(event.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="grupos-invite-results">
                    {isSearchingUsers && (
                      <p className="grupos-invite-feedback">Buscando usuários...</p>
                    )}

                    {!isSearchingUsers && inviteSearchError && (
                      <p className="grupos-invite-feedback grupos-invite-feedback-error">{inviteSearchError}</p>
                    )}

                    {!isSearchingUsers && !inviteSearchError && sanitizeSearchTerm(inviteSearchTerm) === '' && (
                      <p className="grupos-invite-feedback">Digite um nome ou email para buscar usuários.</p>
                    )}

                    {!isSearchingUsers && !inviteSearchError && sanitizeSearchTerm(inviteSearchTerm) !== '' && inviteSearchResults.length === 0 && (
                      <p className="grupos-invite-feedback">Nenhum usuário encontrado.</p>
                    )}

                    {!isSearchingUsers && inviteSearchResults.map((foundUser) => (
                      <div key={foundUser.id} className="grupos-invite-result-item">
                        <div className="grupos-invite-result-info">
                          <strong>{formatUserDisplayName(foundUser)}</strong>
                          <span>{foundUser.email}</span>
                        </div>
                        <button
                          type="button"
                          className="grupos-details-icon-button"
                          aria-label={`Enviar convite para ${formatUserDisplayName(foundUser)}`}
                          title="Enviar convite"
                          disabled={inviteSendingUserId === foundUser.id}
                          onClick={() => handleSendDirectInvite(foundUser.id)}
                        >
                          <i className="bi bi-envelope"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isDeleteModalOpen && (
            <div
              className="grupos-modal-overlay grupos-delete-overlay"
              onClick={handleCloseDeleteModal}
              role="presentation"
            >
              <div
                className="grupos-modal-card grupos-delete-modal-card"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Confirmar exclusão do grupo"
              >
                <div className="grupos-details-header grupos-delete-header">
                  <h3>Excluir grupo</h3>
                  <button
                    type="button"
                    className="grupos-close-button"
                    onClick={handleCloseDeleteModal}
                    aria-label="Fechar confirmação de exclusão"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="grupos-delete-body">
                  <p className="grupos-delete-message">
                    Tem certeza de que deseja excluir o grupo <strong>{detailsGroup.name}</strong>?
                    Essa ação não pode ser revertida.
                  </p>

                  {actionError && (
                    <p className="grupos-form-error">{actionError}</p>
                  )}

                  <div className="grupos-delete-actions">
                    <button
                      type="button"
                      className="grupos-delete-cancel-button"
                      onClick={handleCloseDeleteModal}
                      disabled={isDeletingGroup}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="grupos-delete-confirm-button"
                      onClick={handleConfirmDeleteGroup}
                      disabled={isDeletingGroup}
                    >
                      {isDeletingGroup ? 'Excluindo...' : 'Excluir grupo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isTransferModalOpen && (
            <div
              className="grupos-modal-overlay grupos-transfer-overlay"
              onClick={handleCloseTransferModal}
              role="presentation"
            >
              <div
                className="grupos-modal-card grupos-transfer-modal-card"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Transferir fundação do grupo"
              >
                <div className="grupos-details-header grupos-transfer-header">
                  <h3>Transferir fundação</h3>
                  <button
                    type="button"
                    className="grupos-close-button"
                    onClick={handleCloseTransferModal}
                    aria-label="Fechar transferência de fundação"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="grupos-transfer-body">
                  <p className="grupos-delete-message">
                    Escolha o membro que passará a ser o fundador do grupo. Você continuará como membro comum.
                  </p>

                  <div className="grupos-field">
                    <label htmlFor="transfer-founder-member">Novo fundador</label>
                    <div className="grupos-select-wrapper">
                      <select
                        id="transfer-founder-member"
                        value={selectedTransferUserId}
                        onChange={(event) => setSelectedTransferUserId(event.target.value)}
                      >
                        <option value="">Selecione um membro</option>
                        {transferCandidates.map((member) => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                      <i className="bi bi-chevron-down grupos-select-arrow"></i>
                    </div>
                  </div>

                  {transferCandidates.length === 0 && (
                    <p className="grupos-section-feedback">
                      É necessário ter pelo menos outro membro ativo no grupo.
                    </p>
                  )}

                  {transferError && (
                    <p className="grupos-form-error">{transferError}</p>
                  )}

                  <div className="grupos-delete-actions">
                    <button
                      type="button"
                      className="grupos-delete-cancel-button"
                      onClick={handleCloseTransferModal}
                      disabled={isTransferringFounder}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="grupos-submit-button"
                      onClick={handleConfirmTransferFounder}
                      disabled={isTransferringFounder || transferCandidates.length === 0}
                    >
                      {isTransferringFounder ? 'Transferindo...' : 'Transferir fundação'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isConsentModalOpen && consentGroup && (
        <div
          className="grupos-modal-overlay grupos-consent-overlay"
          onClick={handleCloseConsentModal}
          role="presentation"
        >
          <div
            className="grupos-modal-card grupos-consent-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Consentimento de permissões"
          >
            <div className="grupos-details-header grupos-consent-header">
              <h3>Consentimento de permissões</h3>
              <button
                type="button"
                className="grupos-close-button"
                onClick={handleCloseConsentModal}
                aria-label="Fechar consentimento"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="grupos-consent-body">
              <p className="grupos-delete-message">
                {consentMode === 'invite' ? (
                  <>
                    Ao aceitar o convite para <strong>{consentGroup.name}</strong>, você concorda com as
                    permissões abaixo sobre sua carteira e transações:
                  </>
                ) : (
                  <>
                    Ao entrar em <strong>{consentGroup.name}</strong>, você concorda com as permissões abaixo
                    sobre sua carteira e transações:
                  </>
                )}
              </p>

              <ul className="grupos-consent-list">
                <li>
                  <strong>Visualizar:</strong>{' '}
                  {permissionLabels[consentGroup.permissions.view] || consentGroup.permissions.view}
                </li>
                <li>
                  <strong>Gerenciar:</strong>{' '}
                  {permissionLabels[consentGroup.permissions.manage] || consentGroup.permissions.manage}
                </li>
              </ul>

              {consentMode === 'join' && detailsGroup?.visibility === 'restrito' && (
                <p className="grupos-consent-note">
                  Este grupo exige aprovação de um líder após o consentimento.
                </p>
              )}

              {actionError && (
                <p className="grupos-form-error">{actionError}</p>
              )}

              <div className="grupos-delete-actions">
                <button
                  type="button"
                  className="grupos-delete-cancel-button"
                  onClick={handleCloseConsentModal}
                  disabled={isJoining}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="grupos-submit-button"
                  onClick={handleConfirmConsent}
                  disabled={isJoining}
                >
                  {isJoining ? 'Confirmando...' : 'Concordo e continuar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Grupos
