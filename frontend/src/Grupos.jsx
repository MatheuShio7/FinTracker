import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import './Grupos.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import ReloadButton from './components/ReloadButton'
import NotificationsButton from './components/NotificationsButton'
import MemberWalletModal from './components/MemberWalletModal'
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

const PERMISSION_LEVELS = {
  ninguem: 0,
  lideres: 1,
  todos: 2,
}

const validateGroupPermissions = (view, manage) => (
  PERMISSION_LEVELS[manage] <= PERMISSION_LEVELS[view]
)

const translateMemberRole = (role, t) => {
  if (role === 'Fundador' || role === 'founder') {
    return t('role.founder')
  }
  if (role === 'Líder' || role === 'leader') {
    return t('role.leader')
  }
  return role
}

const isGroupAtCapacity = (group) => (
  Boolean(group?.maxMembers && group.membersCount >= group.maxMembers)
)

const groupRequiresConsent = (group) => {
  if (!group?.permissions) {
    return false
  }

  const { view, manage } = group.permissions
  return !(view === 'ninguem' && manage === 'ninguem')
}

function Grupos() {
  const { t } = useTranslation(['groups', 'common'])
  const { user } = useAuth()
  const { loadNotifications } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()

  const getVisibilityLabel = (key) => (key ? t(`visibility.${key}`, { defaultValue: key }) : key)
  const getPermissionLabel = (key) => (key ? t(`permission.${key}`, { defaultValue: key }) : key)
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
  const [walletMember, setWalletMember] = useState(null)
  const [isDetailsMenuOpen, setIsDetailsMenuOpen] = useState(false)
  const detailsMenuRef = useRef(null)

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
        throw new Error(mineData.message || t('errors.loadMine'))
      }

      if (!publicResponse.ok || publicData.status !== 'success') {
        throw new Error(publicData.message || t('errors.loadPublic'))
      }

      setOwnedGroups(mineData.data || [])
      setPublicGroups(publicData.data || [])
    } catch (fetchError) {
      console.error('Erro ao carregar grupos:', fetchError)
      setError(fetchError.message || t('common:serverError'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user, t])

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
          setError(data.message || t('errors.invalidInvite'))
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
            setError(acceptData.message || t('errors.acceptInvite'))
          }

          setInviteToken('')
          setInvitePreview(null)
          setConsentMode('join')
        }

        setSearchParams({}, { replace: true })
      } catch (inviteErr) {
        console.error('Erro ao carregar convite:', inviteErr)
        setError(t('errors.loadInvite'))
        setSearchParams({}, { replace: true })
      }
    }

    loadInvitePreview()
  }, [searchParams, user, fetchGroups, loadNotifications, setSearchParams, t])

  useEffect(() => {
    const groupId = searchParams.get('grupo')

    if (!groupId || !user) {
      return
    }

    const openGroupFromNotification = async () => {
      setIsDetailsModalOpen(true)
      setDetailsError(null)
      setIsDetailsLoading(true)

      try {
        const response = await authFetch(`api/groups/${groupId}`)
        const data = await response.json()

        if (!response.ok || data.status !== 'success') {
          setError(data.message || t('errors.loadGroup'))
          return
        }

        setSelectedGroup(data.data)

        if (data.data.currentUserMembership?.status === 'pending_reconsent') {
          setConsentMode('reconsent')
          setIsConsentModalOpen(true)
        }
      } catch (groupErr) {
        console.error('Erro ao abrir grupo:', groupErr)
        setError(t('errors.loadGroup'))
      } finally {
        setIsDetailsLoading(false)
        setSearchParams({}, { replace: true })
      }
    }

    openGroupFromNotification()
  }, [searchParams, user, setSearchParams, t])

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
    setWalletMember(null)
    setIsDetailsMenuOpen(false)
  }

  useEffect(() => {
    if (!isDetailsMenuOpen) {
      return undefined
    }

    const handleClickOutside = (event) => {
      if (detailsMenuRef.current && !detailsMenuRef.current.contains(event.target)) {
        setIsDetailsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDetailsMenuOpen])

  useEffect(() => {
    if (!isGroupModalOpen && !isDetailsModalOpen && !isInviteModalOpen && !isDeleteModalOpen && !isTransferModalOpen && !isConsentModalOpen) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (isDetailsMenuOpen) {
          setIsDetailsMenuOpen(false)
          return
        }

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
  }, [isDetailsModalOpen, isGroupModalOpen, isInviteModalOpen, isDeleteModalOpen, isTransferModalOpen, isConsentModalOpen, isDetailsMenuOpen, editingGroupId])

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
      setSubmitError(t('errors.nameRequired'))
      return
    }

    if (!validateGroupPermissions(viewPermission, managePermission)) {
      setSubmitError(t('errors.permissionOrder'))
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
        setSubmitError(data.message || t('errors.save'))
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
      if (editingGroupId && isDetailsModalOpen) {
        await fetchGroupDetails(editingGroupId)
      }
      setIsGroupModalOpen(false)
      setEditingGroupId(null)
      resetGroupForm()
    } catch (submitErr) {
      console.error('Erro ao salvar grupo:', submitErr)
      setSubmitError(t('common:serverError'))
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
        throw new Error(data.message || t('errors.loadDetails'))
      }

      setSelectedGroup(data.data)

      if (data.data.currentUserMembership?.status === 'pending_reconsent') {
        setConsentMode('reconsent')
        setIsConsentModalOpen(true)
      }
    } catch (detailsErr) {
      console.error('Erro ao carregar detalhes do grupo:', detailsErr)
      setDetailsError(detailsErr.message || t('errors.loadDetails'))
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
        setActionError(data.message || t('errors.updateMember'))
        return
      }

      applyGroupUpdate(data.data)
      await fetchGroups(true)
    } catch (actionErr) {
      console.error('Erro na ação de membro:', actionErr)
      setActionError(t('common:serverError'))
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
        setActionError(data.message || t('errors.delete'))
        return
      }

      handleCloseDetailsModal()
      await fetchGroups(true)
    } catch (deleteErr) {
      console.error('Erro ao excluir grupo:', deleteErr)
      setActionError(t('common:serverError'))
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
      setTransferError(t('errors.transferSelect'))
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
        setTransferError(data.message || t('errors.transfer'))
        return
      }

      applyGroupUpdate(data.data)
      await fetchGroups(true)
      handleCloseTransferModal()
    } catch (transferErr) {
      console.error('Erro ao transferir fundação:', transferErr)
      setTransferError(t('common:serverError'))
    } finally {
      setIsTransferringFounder(false)
    }
  }

  const handleConfirmJoin = async () => {
    const joinTargetGroup = detailsGroup || selectedGroup

    if (!joinTargetGroup?.id || isJoining) {
      return
    }

    setIsJoining(true)
    setActionError('')

    const payload = groupRequiresConsent(joinTargetGroup)
      ? {
          consented: true,
          consented_view: joinTargetGroup.permissions.view,
          consented_manage: joinTargetGroup.permissions.manage,
        }
      : { consented: false }

    try {
      const response = await authFetch(`api/groups/${joinTargetGroup.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || t('errors.join'))
        return
      }

      applyGroupUpdate(data.data)
      await fetchGroups(true)
      await loadNotifications()
      setIsConsentModalOpen(false)
      setConsentMode('join')
    } catch (joinErr) {
      console.error('Erro ao entrar no grupo:', joinErr)
      setActionError(t('common:serverError'))
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
        setActionError(data.message || t('errors.acceptInvite'))
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
      setActionError(t('common:serverError'))
    } finally {
      setIsJoining(false)
    }
  }

  const handleConfirmReconsent = async () => {
    if (!selectedGroup?.id || isJoining) {
      return
    }

    setIsJoining(true)
    setActionError('')

    try {
      const response = await authFetch(`api/groups/${selectedGroup.id}/reconsent/accept`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || t('errors.reconsentAccept'))
        return
      }

      applyGroupUpdate(data.data)
      await fetchGroups(true)
      await loadNotifications()
      setIsConsentModalOpen(false)
      setConsentMode('join')
    } catch (reconsentErr) {
      console.error('Erro ao confirmar re-consentimento:', reconsentErr)
      setActionError(t('common:serverError'))
    } finally {
      setIsJoining(false)
    }
  }

  const handleDeclineReconsent = async () => {
    if (!selectedGroup?.id || isJoining) {
      return
    }

    setIsJoining(true)
    setActionError('')

    try {
      const response = await authFetch(`api/groups/${selectedGroup.id}/reconsent/decline`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        setActionError(data.message || t('errors.reconsentDecline'))
        return
      }

      handleCloseDetailsModal()
      await fetchGroups(true)
      await loadNotifications()
    } catch (reconsentErr) {
      console.error('Erro ao recusar re-consentimento:', reconsentErr)
      setActionError(t('common:serverError'))
    } finally {
      setIsJoining(false)
    }
  }

  const handleConfirmConsent = () => {
    if (consentMode === 'invite') {
      handleConfirmInviteAccept()
      return
    }

    if (consentMode === 'reconsent') {
      handleConfirmReconsent()
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

  const handleOpenReconsentModal = () => {
    setActionError('')
    setConsentMode('reconsent')
    setIsConsentModalOpen(true)
  }

  const handleOpenJoinFlow = () => {
    const joinTargetGroup = detailsGroup || selectedGroup

    if (!joinTargetGroup) {
      return
    }

    setActionError('')
    setConsentMode('join')

    if (groupRequiresConsent(joinTargetGroup)) {
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
        setInviteSearchError(data.message || t('errors.sendInvite'))
        return
      }

      setInviteSearchError('')
      setInviteLinkFeedback(data.message || t('invite.sent'))
    } catch (inviteErr) {
      console.error('Erro ao enviar convite:', inviteErr)
      setInviteSearchError(t('common:serverError'))
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
        setInviteLinkError(data.message || t('errors.inviteLink'))
        return
      }

      const token = data.data?.token
      const inviteUrl = `${window.location.origin}/grupos?convite=${encodeURIComponent(token)}`

      await navigator.clipboard.writeText(inviteUrl)
      setInviteLinkFeedback(t('invite.copied'))
    } catch (linkErr) {
      console.error('Erro ao gerar link de convite:', linkErr)
      setInviteLinkError(t('errors.inviteLinkCopy'))
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
        setActionError(data.message || t('errors.leave'))
        return
      }

      handleCloseDetailsModal()
      await fetchGroups(true)
    } catch (leaveErr) {
      console.error('Erro ao sair do grupo:', leaveErr)
      setActionError(t('common:serverError'))
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
        setActionError(data.message || t('errors.joinRequest'))
        return
      }

      if (data.data) {
        applyGroupUpdate(data.data)
      }

      await fetchGroups(true)
      await loadNotifications()
    } catch (requestErr) {
      console.error('Erro ao processar solicitação:', requestErr)
      setActionError(t('common:serverError'))
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
        setInviteSearchError(t('errors.searchUsers'))
      } finally {
        setIsSearchingUsers(false)
      }
    }

    const timeoutId = setTimeout(() => {
      searchUsers()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [inviteSearchTerm, isInviteModalOpen, selectedGroup, user?.id, t])

  const renderSectionFeedback = (message, isError = false) => (
    <p className={`grupos-section-feedback${isError ? ' grupos-section-feedback-error' : ''}`}>
      {message}
    </p>
  )

  const renderGroupCard = (group) => {
    const memberLabel = group.maxMembers
      ? t('card.membersCapped', { count: group.membersCount, max: group.maxMembers })
      : t('card.members', { count: group.membersCount })
    const needsReconsentOnCard = group.currentUserMembership?.status === 'pending_reconsent'
    const groupIsFull = isGroupAtCapacity(group)

    return (
      <button
        type="button"
        key={group.id}
        className={`grupos-card${needsReconsentOnCard ? ' grupos-card-pending-reconsent' : ''}`}
        onClick={() => handleOpenGroupDetails(group)}
      >
        <div className="grupos-card-header">
          <div>
            <h3>
              {group.name}
              {needsReconsentOnCard && (
                <i
                  className="bi bi-clock-history grupos-card-reconsent-icon"
                  title={t('card.reconsentTitle')}
                  aria-label={t('card.reconsentAria')}
                ></i>
              )}
            </h3>
            <p className="grupos-card-visibility">{getVisibilityLabel(group.visibility)}</p>
          </div>
          <div className="grupos-card-badges">
            {groupIsFull && (
              <span className="grupos-card-badge grupos-card-badge-full">{t('card.full')}</span>
            )}
            <span className="grupos-card-badge">{memberLabel}</span>
          </div>
        </div>
        <p className="grupos-card-description">{group.description || t('card.noDescription')}</p>
      </button>
    )
  }

  const detailsGroup = selectedGroup
  const isEditingGroup = Boolean(editingGroupId)
  const currentUserMembership = detailsGroup?.currentUserMembership
  const currentUserJoinRequest = detailsGroup?.currentUserJoinRequest
  const hasMembership = Boolean(currentUserMembership)
  const isActiveMember = currentUserMembership?.status === 'active'
  const needsReconsent = currentUserMembership?.status === 'pending_reconsent'
  const hasPendingJoin = currentUserJoinRequest?.status === 'pending'
  const isGroupFull = isGroupAtCapacity(detailsGroup)
  const canJoin = !hasMembership
    && !hasPendingJoin
    && detailsGroup?.visibility !== 'privado'
    && !isGroupFull
  const canLeave = isActiveMember && !currentUserMembership?.is_founder
  const canManageMembers = isActiveMember && Boolean(
    currentUserMembership?.is_founder || currentUserMembership?.is_leader
  )
  const canDeleteGroup = Boolean(currentUserMembership?.is_founder)
  const isFounder = Boolean(currentUserMembership?.is_founder)

  const canViewMemberWallet = (member) => {
    if (!isActiveMember || needsReconsent) {
      return false
    }

    if (member.status !== 'active') {
      return false
    }

    if (member.user_id === user?.id) {
      return false
    }

    const viewPermission = detailsGroup?.permissions?.view

    if (viewPermission === 'ninguem') {
      return false
    }

    if (viewPermission === 'lideres') {
      return canManageMembers
    }

    return viewPermission === 'todos'
  }

  const handleOpenMemberWallet = (member) => {
    setWalletMember(member)
  }

  const handleDetailsMenuAction = (action) => {
    setIsDetailsMenuOpen(false)

    if (action === 'edit') {
      handleOpenEditGroup()
      return
    }

    if (action === 'invite') {
      handleOpenInviteModal()
      return
    }

    if (action === 'transfer') {
      handleOpenTransferModal()
      return
    }

    if (action === 'delete') {
      handleOpenDeleteModal()
    }
  }

  const handleCloseMemberWallet = () => {
    setWalletMember(null)
  }

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
            {isLoading ? t('common:ellipsis') : t('details.demote')}
          </button>
          <button
            type="button"
            className="grupos-member-action grupos-member-action-danger"
            disabled={isLoading}
            onClick={() => handleMemberAction(member.user_id, 'remove')}
          >
            {isLoading ? t('common:ellipsis') : t('details.expel')}
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
            {isLoading ? t('common:ellipsis') : t('details.promote')}
          </button>
        )}
        <button
          type="button"
          className="grupos-member-action grupos-member-action-danger"
          disabled={isLoading}
          onClick={() => handleMemberAction(member.user_id, 'remove')}
        >
          {isLoading ? t('common:ellipsis') : t('details.expel')}
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
        aria-label={isEditingGroup ? t('form.ariaEdit') : t('form.ariaNew')}
      >
        <div className="grupos-modal-header">
          <h3>{isEditingGroup ? t('form.titleEdit') : t('form.titleNew')}</h3>
          <button
            type="button"
            className="grupos-close-button"
            onClick={handleCloseGroupModal}
            aria-label={t('form.closeAria')}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form className="grupos-form" onSubmit={handleSubmitGroup}>
          <div className="grupos-field">
            <label htmlFor="group-name">{t('form.name')}</label>
            <input
              id="group-name"
              type="text"
              placeholder={t('form.namePlaceholder')}
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              required
            />
          </div>

          <div className="grupos-field">
            <label htmlFor="group-description">{t('form.description')}</label>
            <textarea
              id="group-description"
              rows="4"
              placeholder={t('form.descriptionPlaceholder')}
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
            />
          </div>

          <div className="grupos-main-grid">
            <div className="grupos-field">
              <label htmlFor="group-visibility">{t('form.visibility')}</label>
              <div className="grupos-select-wrapper">
                <select
                  id="group-visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value)}
                >
                  <option value="restrito">{t('form.vis.restrito')}</option>
                  <option value="publico">{t('form.vis.publico')}</option>
                  <option value="privado">{t('form.vis.privado')}</option>
                </select>
                <i className="bi bi-chevron-down grupos-select-arrow"></i>
              </div>
            </div>

            <div className="grupos-field">
              <label htmlFor="group-max-members-toggle">{t('form.maxMembers')}</label>
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
                <span>{t('form.maxMembersToggle')}</span>
              </label>
              {hasMaxMembers && (
                <input
                  className="grupos-number-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={t('form.maxMembersPlaceholder')}
                  value={maxMembers}
                  onChange={(event) => setMaxMembers(event.target.value)}
                />
              )}
            </div>
          </div>

          <div className="grupos-permissions-card">
            <div className="grupos-permissions-header">
              <h4>{t('form.permissionsTitle')}</h4>
              <p>{t('form.permissionsDesc')}</p>
            </div>

            <div className="grupos-permissions-grid">
              <div className="grupos-field">
                <label htmlFor="group-view-permission">{t('form.viewLabel')}</label>
                <div className="grupos-select-wrapper">
                  <select
                    id="group-view-permission"
                    value={viewPermission}
                    onChange={(event) => {
                      const nextView = event.target.value
                      setViewPermission(nextView)

                      if (PERMISSION_LEVELS[managePermission] > PERMISSION_LEVELS[nextView]) {
                        setManagePermission(nextView)
                      }
                    }}
                  >
                    <option value="todos">{t('form.opt.all')}</option>
                    <option value="lideres">{t('form.opt.leaders')}</option>
                    <option value="ninguem">{t('form.opt.nobody')}</option>
                  </select>
                  <i className="bi bi-chevron-down grupos-select-arrow"></i>
                </div>
              </div>

              <div className="grupos-field">
                <label htmlFor="group-manage-permission">{t('form.manageLabel')}</label>
                <div className="grupos-select-wrapper">
                  <select
                    id="group-manage-permission"
                    value={managePermission}
                    onChange={(event) => setManagePermission(event.target.value)}
                  >
                    <option value="todos">{t('form.opt.all')}</option>
                    <option value="lideres">{t('form.opt.leaders')}</option>
                    <option value="ninguem">{t('form.opt.nobody')}</option>
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
            {isSubmitting ? t('common:saving') : (isEditingGroup ? t('form.save') : t('form.create'))}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="grupos-page">
      <Logo />
      <PageTitle title={t('title')} />
      <button
        type="button"
        className="reload-button transaction-button grupos-group-button"
        onClick={handleOpenGroupModal}
        title={t('newButtonTitle')}
        aria-label={t('newButtonAria')}
      >
        <i className="bi bi-plus-lg"></i>
        <span>{t('newButton')}</span>
      </button>
      <NotificationsButton className="grupos-notifications-button" />
      <ReloadButton
        onClick={() => fetchGroups(true)}
        isLoading={isRefreshing}
        className="grupos-reload-button"
      />

      <div className="grupos-content">
        <section className="grupos-section">
          <h2 className="grupos-section-title">{t('section.mine')}</h2>
          <div className="grupos-card-grid">
            {isLoading && renderSectionFeedback(t('loading'))}
            {!isLoading && error && renderSectionFeedback(error, true)}
            {!isLoading && !error && ownedGroups.length === 0 && renderSectionFeedback(t('empty.mine'))}
            {!isLoading && !error && ownedGroups.map(renderGroupCard)}
          </div>
        </section>

        <section className="grupos-section">
          <h2 className="grupos-section-title">{t('section.public')}</h2>
          <div className="grupos-card-grid">
            {isLoading && renderSectionFeedback(t('loading'))}
            {!isLoading && error && renderSectionFeedback(error, true)}
            {!isLoading && !error && publicGroups.length === 0 && renderSectionFeedback(t('empty.public'))}
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
            aria-label={t('details.aria', { name: detailsGroup.name })}
          >
            <div className="grupos-details-header">
              <div className="grupos-details-title-row">
                <h3>{detailsGroup.name}</h3>
                {canManageMembers && (
                  <div className="grupos-details-menu" ref={detailsMenuRef}>
                    <button
                      type="button"
                      className="grupos-details-menu-trigger"
                      onClick={() => setIsDetailsMenuOpen((current) => !current)}
                      aria-label={t('details.menuAria')}
                      aria-expanded={isDetailsMenuOpen}
                      aria-haspopup="menu"
                    >
                      <i className="bi bi-three-dots"></i>
                    </button>
                    {isDetailsMenuOpen && (
                      <div className="grupos-details-menu-popover" role="menu">
                        <button
                          type="button"
                          className="grupos-details-menu-item"
                          role="menuitem"
                          onClick={() => handleDetailsMenuAction('edit')}
                        >
                          <i className="bi bi-pencil-square"></i>
                          <span>{t('details.menu.edit')}</span>
                        </button>
                        <button
                          type="button"
                          className="grupos-details-menu-item"
                          role="menuitem"
                          disabled={isGroupFull}
                          onClick={() => handleDetailsMenuAction('invite')}
                        >
                          <i className="bi bi-envelope"></i>
                          <span>{t('details.menu.invite')}</span>
                        </button>
                        {canDeleteGroup && (
                          <button
                            type="button"
                            className="grupos-details-menu-item"
                            role="menuitem"
                            onClick={() => handleDetailsMenuAction('transfer')}
                          >
                            <i className="bi bi-arrow-left-right"></i>
                            <span>{t('details.menu.transfer')}</span>
                          </button>
                        )}
                        {canDeleteGroup && (
                          <button
                            type="button"
                            className="grupos-details-menu-item grupos-details-menu-item-danger"
                            role="menuitem"
                            onClick={() => handleDetailsMenuAction('delete')}
                          >
                            <i className="bi bi-trash"></i>
                            <span>{t('details.menu.delete')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="grupos-close-button"
                onClick={handleCloseDetailsModal}
                aria-label={t('details.closeAria')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="grupos-details-body">
              {isDetailsLoading && renderSectionFeedback(t('details.loading'))}
              {!isDetailsLoading && detailsError && renderSectionFeedback(detailsError, true)}

              {!isDetailsLoading && !detailsError && (
                <>
                  <div className="grupos-details-summary">
                    <p className="grupos-details-description">{detailsGroup.description || t('card.noDescription')}</p>
                    <div className="grupos-details-meta-row">
                      <div className="grupos-details-meta-info">
                        <div className="grupos-details-chip-row">
                          <span className="grupos-details-chip">
                            {getVisibilityLabel(detailsGroup.visibility)}
                          </span>
                          <span className="grupos-details-chip">
                            {detailsGroup.maxMembers
                              ? t('details.membersCapped', { count: detailsGroup.membersCount, max: detailsGroup.maxMembers })
                              : t('details.members', { count: detailsGroup.membersCount })}
                          </span>
                          {isGroupFull && (
                            <span className="grupos-details-chip grupos-details-chip-warning">
                              {t('card.full')}
                            </span>
                          )}
                        </div>
                        {detailsGroup.permissions && (
                          <div className="grupos-details-chip-row">
                            <span className="grupos-details-chip">
                              {t('details.viewChip', { label: getPermissionLabel(detailsGroup.permissions.view) })}
                            </span>
                            <span className="grupos-details-chip">
                              {t('details.manageChip', { label: getPermissionLabel(detailsGroup.permissions.manage) })}
                            </span>
                          </div>
                        )}
                      </div>
                      {needsReconsent && (
                        <button
                          type="button"
                          className="grupos-member-action grupos-member-action-reconsent"
                          onClick={handleOpenReconsentModal}
                          disabled={isJoining}
                        >
                          <i className="bi bi-clock-history"></i>
                          {t('details.reviewPermissions')}
                        </button>
                      )}
                      {canJoin && (
                        <button
                          type="button"
                          className="grupos-member-action grupos-member-action-success"
                          onClick={handleOpenJoinFlow}
                          disabled={isJoining}
                        >
                          {isJoining ? t('details.joining') : t('details.join')}
                        </button>
                      )}
                      {hasPendingJoin && (
                        <button
                          type="button"
                          className="grupos-member-action grupos-member-action-pending"
                          disabled
                        >
                          {t('details.pendingApproval')}
                        </button>
                      )}
                      {isGroupFull && !hasMembership && !hasPendingJoin && detailsGroup?.visibility !== 'privado' && (
                        <button
                          type="button"
                          className="grupos-member-action grupos-member-action-pending"
                          disabled
                        >
                          {t('details.groupFull')}
                        </button>
                      )}
                      {canLeave && (
                        <button
                          type="button"
                          className="grupos-member-action grupos-member-action-danger"
                          onClick={handleLeaveGroup}
                          disabled={isLeaving}
                        >
                          {isLeaving ? t('details.leaving') : t('details.leave')}
                        </button>
                      )}
                    </div>
                  </div>

                  {actionError && (
                    <p className="grupos-form-error">{actionError}</p>
                  )}

                  {canManageMembers && (detailsGroup.pendingJoinRequests || []).length > 0 && (
                    <div className="grupos-pending-requests">
                      <h4 className="grupos-pending-requests-title">{t('details.pendingRequests')}</h4>
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
                              {joinRequestLoadingId === request.id ? t('common:ellipsis') : t('details.approve')}
                            </button>
                            <button
                              type="button"
                              className="grupos-member-action grupos-member-action-danger"
                              disabled={joinRequestLoadingId === request.id}
                              onClick={() => handleJoinRequestAction(request.id, 'reject')}
                            >
                              {joinRequestLoadingId === request.id ? t('common:ellipsis') : t('details.reject')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grupos-members-list">
                    {(detailsGroup.members || []).length === 0 && (
                      <p className="grupos-section-feedback">{t('details.noMembers')}</p>
                    )}
                    {(detailsGroup.members || []).map((member) => (
                      <div key={member.id} className="grupos-member-item">
                        <div className="grupos-member-info">
                          <div className="grupos-member-name-row">
                            <strong>
                              {member.user_id === user?.id
                                ? t('details.memberYou', { name: member.name })
                                : member.name}
                            </strong>
                            <div className="grupos-member-badges">
                              {member.needsReconsent && (
                                <i
                                  className="bi bi-clock-history grupos-member-reconsent-icon"
                                  title={t('details.reconsentMemberAria')}
                                  aria-label={t('details.reconsentMemberAria')}
                                ></i>
                              )}
                              {getMemberRoles(member).map((role) => (
                                <span key={role} className="grupos-member-badge">
                                  {translateMemberRole(role, t)}
                                </span>
                              ))}
                            </div>
                          </div>
                          {member.email && (
                            <span className="grupos-member-email">{member.email}</span>
                          )}
                        </div>
                        <div className="grupos-member-actions">
                          {canViewMemberWallet(member) && (
                            <button
                              type="button"
                              className="grupos-details-icon-button grupos-member-wallet-button"
                              aria-label={t('details.viewWalletAria', { name: member.name })}
                              title={t('details.viewWalletTitle')}
                              onClick={() => handleOpenMemberWallet(member)}
                            >
                              <i className="bi bi-wallet2"></i>
                            </button>
                          )}
                          {renderMemberActions(member)}
                        </div>
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
                aria-label={t('invite.aria')}
              >
                <div className="grupos-details-header grupos-invite-header">
                  <h3>{t('invite.title')}</h3>
                  <button
                    type="button"
                    className="grupos-close-button"
                    onClick={handleCloseInviteModal}
                    aria-label={t('invite.closeAria')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="grupos-invite-link-section">
                  <button
                    type="button"
                    className="grupos-invite-link-button"
                    onClick={handleCreateInviteLink}
                    disabled={isCreatingInviteLink}
                  >
                    <i className="bi bi-link-45deg"></i>
                    <span>
                      {isCreatingInviteLink ? t('invite.generating') : t('invite.copyLink')}
                    </span>
                  </button>

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
                      placeholder={t('invite.searchPlaceholder')}
                      value={inviteSearchTerm}
                      onChange={(event) => setInviteSearchTerm(event.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="grupos-invite-results">
                    {isSearchingUsers && (
                      <p className="grupos-invite-feedback">{t('invite.searching')}</p>
                    )}

                    {!isSearchingUsers && inviteSearchError && (
                      <p className="grupos-invite-feedback grupos-invite-feedback-error">{inviteSearchError}</p>
                    )}

                    {!isSearchingUsers && !inviteSearchError && sanitizeSearchTerm(inviteSearchTerm) === '' && (
                      <p className="grupos-invite-feedback">{t('invite.searchHint')}</p>
                    )}

                    {!isSearchingUsers && !inviteSearchError && sanitizeSearchTerm(inviteSearchTerm) !== '' && inviteSearchResults.length === 0 && (
                      <p className="grupos-invite-feedback">{t('invite.noUsers')}</p>
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
                          aria-label={t('invite.sendAria', { name: formatUserDisplayName(foundUser) })}
                          title={t('invite.sendTitle')}
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
                aria-label={t('delete.aria')}
              >
                <div className="grupos-details-header grupos-delete-header">
                  <h3>{t('delete.title')}</h3>
                  <button
                    type="button"
                    className="grupos-close-button"
                    onClick={handleCloseDeleteModal}
                    aria-label={t('delete.closeAria')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="grupos-delete-body">
                  <p className="grupos-delete-message">
                    <Trans
                      ns="groups"
                      i18nKey="delete.message"
                      values={{ name: detailsGroup.name }}
                      components={{ strong: <strong /> }}
                    />
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
                      {t('common:cancel')}
                    </button>
                    <button
                      type="button"
                      className="grupos-delete-confirm-button"
                      onClick={handleConfirmDeleteGroup}
                      disabled={isDeletingGroup}
                    >
                      {isDeletingGroup ? t('common:deleting') : t('delete.confirm')}
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
                aria-label={t('transfer.aria')}
              >
                <div className="grupos-details-header grupos-transfer-header">
                  <h3>{t('transfer.title')}</h3>
                  <button
                    type="button"
                    className="grupos-close-button"
                    onClick={handleCloseTransferModal}
                    aria-label={t('transfer.closeAria')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="grupos-transfer-body">
                  <p className="grupos-delete-message">
                    {t('transfer.message')}
                  </p>

                  <div className="grupos-field">
                    <label htmlFor="transfer-founder-member">{t('transfer.label')}</label>
                    <div className="grupos-select-wrapper">
                      <select
                        id="transfer-founder-member"
                        value={selectedTransferUserId}
                        onChange={(event) => setSelectedTransferUserId(event.target.value)}
                      >
                        <option value="">{t('transfer.placeholder')}</option>
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
                      {t('transfer.noCandidates')}
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
                      {t('common:cancel')}
                    </button>
                    <button
                      type="button"
                      className="grupos-submit-button"
                      onClick={handleConfirmTransferFounder}
                      disabled={isTransferringFounder || transferCandidates.length === 0}
                    >
                      {isTransferringFounder ? t('transfer.transferring') : t('transfer.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {walletMember && detailsGroup?.id && (
        <MemberWalletModal
          groupId={detailsGroup.id}
          member={walletMember}
          currentUserId={user?.id}
          isOpen={Boolean(walletMember)}
          onClose={handleCloseMemberWallet}
        />
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
            aria-label={t('consent.aria')}
          >
            <div className="grupos-details-header grupos-consent-header">
              <h3>
                {consentMode === 'reconsent' ? t('consent.titleReconsent') : t('consent.title')}
              </h3>
              <button
                type="button"
                className="grupos-close-button"
                onClick={handleCloseConsentModal}
                aria-label={t('consent.closeAria')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="grupos-consent-body">
              <p className="grupos-delete-message">
                {consentMode === 'reconsent' ? (
                  <Trans
                    ns="groups"
                    i18nKey="consent.reconsentBody"
                    values={{ name: consentGroup.name }}
                    components={{ strong: <strong /> }}
                  />
                ) : consentMode === 'invite' ? (
                  <Trans
                    ns="groups"
                    i18nKey="consent.inviteBody"
                    values={{ name: consentGroup.name }}
                    components={{ strong: <strong /> }}
                  />
                ) : (
                  <Trans
                    ns="groups"
                    i18nKey="consent.joinBody"
                    values={{ name: consentGroup.name }}
                    components={{ strong: <strong /> }}
                  />
                )}
              </p>

              {consentMode === 'reconsent' && (
                <ul className="grupos-consent-list grupos-consent-list-previous">
                  <li>
                    <strong>{t('consent.viewPrevious')}</strong>{' '}
                    {getPermissionLabel(currentUserMembership?.consentedView) || currentUserMembership?.consentedView}
                  </li>
                  <li>
                    <strong>{t('consent.managePrevious')}</strong>{' '}
                    {getPermissionLabel(currentUserMembership?.consentedManage) || currentUserMembership?.consentedManage}
                  </li>
                </ul>
              )}

              {consentMode === 'reconsent' && (
                <p className="grupos-consent-note">{t('consent.newPermissionsNote')}</p>
              )}

              <ul className="grupos-consent-list">
                <li>
                  <strong>{consentMode === 'reconsent' ? t('consent.viewNew') : t('consent.view')}</strong>{' '}
                  {getPermissionLabel(consentGroup.permissions.view) || consentGroup.permissions.view}
                </li>
                <li>
                  <strong>{consentMode === 'reconsent' ? t('consent.manageNew') : t('consent.manage')}</strong>{' '}
                  {getPermissionLabel(consentGroup.permissions.manage) || consentGroup.permissions.manage}
                </li>
              </ul>

              {consentMode === 'reconsent' && (
                <p className="grupos-consent-note">
                  {t('consent.declineNote')}
                </p>
              )}

              {consentMode === 'join' && detailsGroup?.visibility === 'restrito' && (
                <p className="grupos-consent-note">
                  {t('consent.approvalNote')}
                </p>
              )}

              {actionError && (
                <p className="grupos-form-error">{actionError}</p>
              )}

              <div className="grupos-delete-actions">
                <button
                  type="button"
                  className="grupos-delete-cancel-button"
                  onClick={consentMode === 'reconsent' ? handleDeclineReconsent : handleCloseConsentModal}
                  disabled={isJoining}
                >
                  {consentMode === 'reconsent' ? t('consent.decline') : t('common:cancel')}
                </button>
                <button
                  type="button"
                  className="grupos-submit-button"
                  onClick={handleConfirmConsent}
                  disabled={isJoining}
                >
                  {isJoining ? t('consent.confirming') : t('consent.agree')}
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
