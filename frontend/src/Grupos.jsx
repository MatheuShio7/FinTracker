import { useEffect, useMemo, useState } from 'react'
import './Grupos.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import ReloadButton from './components/ReloadButton'
import NotificationsButton from './components/NotificationsButton'

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
      { id: 'm1', name: 'Você', roles: ['Fundador', 'Líder'] },
      { id: 'm2', name: 'Matheus Silva', roles: ['Líder'] },
      { id: 'm3', name: 'Matheus Pizani', roles: [] }
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
      { id: 'm1', name: 'Você', role: 'Membro' },
      { id: 'm2', name: 'Fernanda Alves', role: 'Líder' },
      { id: 'm3', name: 'Pedro Henrique', role: 'Membro' },
      { id: 'm4', name: 'Camila Rocha', role: 'Membro' }
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
      { id: 'm1', name: 'Lucas Freitas', role: 'Líder' },
      { id: 'm2', name: 'Ana Beatriz', role: 'Membro' },
      { id: 'm3', name: 'Gustavo Pinto', role: 'Membro' }
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
      { id: 'm1', name: 'Patrícia Moraes', role: 'Líder' },
      { id: 'm2', name: 'Eduardo Santos', role: 'Membro' },
      { id: 'm3', name: 'Marina Costa', role: 'Membro' }
    ]
  }
]

const visibilityLabels = {
  publico: 'Público',
  privado: 'Privado'
}

function Grupos() {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
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
    if (!isGroupModalOpen && !isDetailsModalOpen) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsDetailsModalOpen(false)
        setIsGroupModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isDetailsModalOpen, isGroupModalOpen])

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

    populateGroupForm(selectedGroup)
    setEditingGroupId(selectedGroup.id)
    setIsDetailsModalOpen(false)
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
        setIsDetailsModalOpen(true)
      }

      return
    }

    const newGroup = {
      id: `group-${Date.now()}`,
      ...formData,
      membersCount: 1,
      members: [
        { id: 'me', name: 'Você', roles: ['Fundador', 'Líder'] }
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
  }

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

      {isGroupModalOpen && (
        <div className="grupos-modal-overlay" onClick={handleCloseGroupModal} role="presentation">
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
      )}

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
                  <button
                    type="button"
                    className="grupos-edit-button"
                    onClick={handleOpenEditGroup}
                    aria-label="Editar grupo"
                    title="Editar grupo"
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
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
                <div className="grupos-details-chip-row">
                  <span className="grupos-details-chip">{visibilityLabels[detailsGroup.visibility]}</span>
                  <span className="grupos-details-chip">
                    {detailsGroup.maxMembers
                      ? `${detailsGroup.membersCount}/${detailsGroup.maxMembers} Membros`
                      : `${detailsGroup.membersCount} Membros`}
                  </span>
                </div>
              </div>

              <div className="grupos-members-list">
                {detailsGroup.members.map((member) => (
                  <div key={member.id} className="grupos-member-item">
                    <div className="grupos-member-info">
                      <strong>{member.name}</strong>
                      <div className="grupos-member-badges">
                        {getMemberRoles(member).map((role) => (
                          <span key={role} className="grupos-member-badge">{role}</span>
                        ))}
                      </div>
                    </div>
                    {renderMemberActions(member)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Grupos
