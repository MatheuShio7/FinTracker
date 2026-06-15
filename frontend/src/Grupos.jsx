import { useEffect, useMemo, useState } from 'react'
import './Grupos.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import ReloadButton from './components/ReloadButton'
import NotificationsButton from './components/NotificationsButton'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'

const getMemberRoles = (member) => {
  if (member.roles?.length) {
    return member.roles
  }

  if (member.role === 'Líder') {
    return ['Líder']
  }

  return []
}

const isMemberLeader = (member) => getMemberRoles(member).includes('Líder')

const getMemberEmail = (member) => {
  if (member.email) {
    return member.email
  }

  const slug = member.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')

  return `${slug || 'membro'}@email.com`
}

const formatUserDisplayName = (user) => `${user.name} ${user.last_name}`.trim()

const sanitizeSearchTerm = (term) => term.trim().replace(/[,()]/g, '')

const initialOwnedGroups = [
  {
    id: 'grupo-001',
    name: 'Grupo #000',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    visibility: 'publico',
    membersCount: 14,
    maxMembers: null,
    permissions: {
      view: 'todos',
      manage: 'lideres'
    },
    members: [
      { id: 'm1', name: 'Você', email: 'voce@fintracker.app', roles: ['Fundador', 'Líder'] },
      { id: 'm2', name: 'Matheus Silva', email: 'matheus.silva@email.com', roles: ['Líder'] },
      { id: 'm3', name: 'Matheus Pizani', email: 'matheus.pizani@email.com', roles: [] }
    ]
  },
  {
    id: 'grupo-002',
    name: 'Carteira de Dividendos',
    description: 'Discussões sobre empresas pagadoras e reinvestimento de proventos.',
    visibility: 'publico',
    membersCount: 14,
    maxMembers: null,
    permissions: {
      view: 'todos',
      manage: 'lideres'
    },
    members: [
      { id: 'm1', name: 'Você', email: 'voce@fintracker.app', role: 'Membro' },
      { id: 'm2', name: 'Fernanda Alves', email: 'fernanda.alves@email.com', role: 'Líder' },
      { id: 'm3', name: 'Pedro Henrique', email: 'pedro.henrique@email.com', role: 'Membro' },
      { id: 'm4', name: 'Camila Rocha', email: 'camila.rocha@email.com', role: 'Membro' }
    ]
  }
]

const initialPublicGroups = [
  {
    id: 'publico-001',
    name: 'Ações Brasileiras',
    description: 'Espaço aberto para análise de ações, setor e valuation.',
    visibility: 'publico',
    membersCount: 128,
    maxMembers: 200,
    permissions: {
      view: 'todos',
      manage: 'lideres'
    },
    members: [
      { id: 'm1', name: 'Lucas Freitas', email: 'lucas.freitas@email.com', role: 'Líder' },
      { id: 'm2', name: 'Ana Beatriz', email: 'ana.beatriz@email.com', role: 'Membro' },
      { id: 'm3', name: 'Gustavo Pinto', email: 'gustavo.pinto@email.com', role: 'Membro' }
    ]
  },
  {
    id: 'publico-002',
    name: 'Renda Passiva',
    description: 'Compartilhamento de estratégias focadas em fluxo de caixa recorrente.',
    visibility: 'publico',
    membersCount: 84,
    maxMembers: null,
    permissions: {
      view: 'todos',
      manage: 'todos'
    },
    members: [
      { id: 'm1', name: 'Patrícia Moraes', email: 'patricia.moraes@email.com', role: 'Líder' },
      { id: 'm2', name: 'Eduardo Santos', email: 'eduardo.santos@email.com', role: 'Membro' },
      { id: 'm3', name: 'Marina Costa', email: 'marina.costa@email.com', role: 'Membro' }
    ]
  }
]

const visibilityLabels = {
  publico: 'Público',
  privado: 'Privado'
}

function Grupos() {
  const { user } = useAuth()
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
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
  const [ownedGroups, setOwnedGroups] = useState(initialOwnedGroups)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [editingGroupId, setEditingGroupId] = useState(null)

  const publicGroups = useMemo(() => initialPublicGroups, [])

  useEffect(() => {
    if (!isGroupModalOpen && !isDetailsModalOpen && !isInviteModalOpen && !isDeleteModalOpen) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (isDeleteModalOpen) {
          setIsDeleteModalOpen(false)
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
          setIsDetailsModalOpen(false)
          setSelectedGroup(null)
          setIsInviteModalOpen(false)
          setIsDeleteModalOpen(false)
          setIsGroupModalOpen(false)
          setEditingGroupId(null)
          resetGroupForm()
          setInviteSearchTerm('')
          setInviteSearchResults([])
          setInviteSearchError('')
          return
        }

        setIsGroupModalOpen(false)
        setEditingGroupId(null)
        resetGroupForm()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isDetailsModalOpen, isGroupModalOpen, isInviteModalOpen, isDeleteModalOpen, editingGroupId])

  const resetGroupForm = () => {
    setGroupName('')
    setGroupDescription('')
    setVisibility('publico')
    setViewPermission('todos')
    setManagePermission('todos')
    setHasMaxMembers(false)
    setMaxMembers('')
  }

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
    setGroupDescription(group.description)
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

  const buildGroupFormData = () => {
    const parsedMaxMembers = hasMaxMembers ? Number(maxMembers) : null

    return {
      name: groupName.trim() || 'Novo Grupo',
      description: groupDescription.trim() || 'Grupo criado para testes de layout.',
      visibility,
      maxMembers: Number.isFinite(parsedMaxMembers) && parsedMaxMembers > 0 ? parsedMaxMembers : null,
      permissions: {
        view: viewPermission,
        manage: managePermission
      }
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

  const handleSubmitGroup = (event) => {
    event.preventDefault()

    const formData = buildGroupFormData()

    if (editingGroupId) {
      let updatedGroup = null

      setOwnedGroups((currentGroups) => currentGroups.map((group) => {
        if (group.id !== editingGroupId) {
          return group
        }

        updatedGroup = {
          ...group,
          ...formData
        }

        return updatedGroup
      }))

      if (updatedGroup) {
        setSelectedGroup(updatedGroup)
        setIsGroupModalOpen(false)
        setEditingGroupId(null)
        resetGroupForm()
      }

      return
    }

    const newGroup = {
      id: `group-${Date.now()}`,
      ...formData,
      membersCount: 1,
      members: [
        { id: 'me', name: 'Você', email: 'voce@fintracker.app', roles: ['Fundador', 'Líder'] }
      ]
    }

    setOwnedGroups((currentGroups) => [newGroup, ...currentGroups])
    setSelectedGroup(newGroup)
    setIsGroupModalOpen(false)
    setIsDetailsModalOpen(true)
    resetGroupForm()
  }

  const handleOpenGroupDetails = (group) => {
    setSelectedGroup(group)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedGroup(null)
    setIsInviteModalOpen(false)
    setIsDeleteModalOpen(false)
    setIsGroupModalOpen(false)
    setEditingGroupId(null)
    resetGroupForm()
    setInviteSearchTerm('')
    setInviteSearchResults([])
    setInviteSearchError('')
  }

  const handleOpenInviteModal = () => {
    setInviteSearchTerm('')
    setInviteSearchResults([])
    setInviteSearchError('')
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
        const { data, error } = await supabase
          .from('users')
          .select('id, name, last_name, email')
          .or(`name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10)

        if (error) {
          throw error
        }

        const excludedEmails = new Set(
          (selectedGroup?.members || []).map((member) => getMemberEmail(member).toLowerCase())
        )

        const filteredResults = (data || []).filter((foundUser) => {
          if (user?.id && foundUser.id === user.id) {
            return false
          }

          return !excludedEmails.has(foundUser.email.toLowerCase())
        })

        setInviteSearchResults(filteredResults)
      } catch (error) {
        console.error('Erro ao buscar usuários:', error)
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

  const renderGroupCard = (group) => {
    const memberLabel = group.maxMembers ? `${group.membersCount}/${group.maxMembers} membros` : `${group.membersCount} membros`

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
            <p className="grupos-card-visibility">{visibilityLabels[group.visibility]}</p>
          </div>
          <span className="grupos-card-badge">{memberLabel}</span>
        </div>
        <p className="grupos-card-description">{group.description}</p>
      </button>
    )
  }

  const detailsGroup = selectedGroup
  const isEditingGroup = Boolean(editingGroupId)
  const currentUserMember = detailsGroup?.members.find((member) => member.name === 'Você')
  const canManageMembers = currentUserMember
    ? getMemberRoles(currentUserMember).some((role) => role === 'Líder' || role === 'Fundador')
    : false

  const renderMemberActions = (member) => {
    if (!canManageMembers || member.name === 'Você') {
      return null
    }

    if (isMemberLeader(member)) {
      return (
        <div className="grupos-member-actions">
          <button type="button" className="grupos-member-action grupos-member-action-danger">
            Rebaixar
          </button>
          <button type="button" className="grupos-member-action grupos-member-action-danger">
            Expulsar
          </button>
        </div>
      )
    }

    return (
      <div className="grupos-member-actions">
        <button type="button" className="grupos-member-action grupos-member-action-success">
          Promover
        </button>
        <button type="button" className="grupos-member-action grupos-member-action-danger">
          Expulsar
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

          <button type="submit" className="grupos-submit-button">
            {isEditingGroup ? 'Salvar alterações' : 'Criar Grupo'}
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
      <ReloadButton onClick={() => {}} className="grupos-reload-button" />

      <div className="grupos-content">
        <section className="grupos-section">
          <h2 className="grupos-section-title">Grupos que você pertence</h2>
          <div className="grupos-card-grid">
            {ownedGroups.map(renderGroupCard)}
          </div>
        </section>

        <section className="grupos-section">
          <h2 className="grupos-section-title">Grupos públicos</h2>
          <div className="grupos-card-grid">
            {publicGroups.map(renderGroupCard)}
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
                    <button
                      type="button"
                      className="grupos-details-icon-button grupos-details-icon-button-danger"
                      onClick={handleOpenDeleteModal}
                      aria-label="Excluir grupo"
                      title="Excluir grupo"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
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
              <div className="grupos-details-summary">
                <p className="grupos-details-description">{detailsGroup.description}</p>
                <div className="grupos-details-meta-row">
                  <div className="grupos-details-chip-row">
                    <span className="grupos-details-chip">{visibilityLabels[detailsGroup.visibility]}</span>
                    <span className="grupos-details-chip">
                      {detailsGroup.maxMembers
                        ? `${detailsGroup.membersCount}/${detailsGroup.maxMembers} Membros`
                        : `${detailsGroup.membersCount} Membros`}
                    </span>
                  </div>
                  <button type="button" className="grupos-member-action grupos-member-action-success">
                    Entrar
                  </button>
                </div>
              </div>

              <div className="grupos-members-list">
                {detailsGroup.members.map((member) => (
                  <div key={member.id} className="grupos-member-item">
                    <div className="grupos-member-info">
                      <div className="grupos-member-name-row">
                        <strong>{member.name}</strong>
                        <div className="grupos-member-badges">
                          {getMemberRoles(member).map((role) => (
                            <span key={role} className="grupos-member-badge">{role}</span>
                          ))}
                        </div>
                      </div>
                      <span className="grupos-member-email">{getMemberEmail(member)}</span>
                    </div>
                    {renderMemberActions(member)}
                  </div>
                ))}
              </div>
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
                  <button type="button" className="grupos-invite-link-button">
                    <i className="bi bi-link-45deg"></i>
                    <span>Criar e copiar link de convite</span>
                  </button>
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

                  <div className="grupos-delete-actions">
                    <button
                      type="button"
                      className="grupos-delete-cancel-button"
                      onClick={handleCloseDeleteModal}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="grupos-delete-confirm-button"
                    >
                      Excluir grupo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Grupos
