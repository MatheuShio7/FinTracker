import { useEffect, useMemo, useState } from 'react'
import './Grupos.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import ReloadButton from './components/ReloadButton'
import NotificationsButton from './components/NotificationsButton'

const initialOwnedGroups = [
  {
    id: 'grupo-001',
    name: 'Investidores da Semana',
    description: 'Grupo para acompanhar oportunidades e organizar aportes semanais.',
    visibility: 'privado',
    membersCount: 6,
    maxMembers: 12,
    permissions: {
      view: 'lideres',
      manage: 'lideres'
    },
    members: [
      { id: 'm1', name: 'Você', role: 'Líder' },
      { id: 'm2', name: 'Carla Mendes', role: 'Líder' },
      { id: 'm3', name: 'Rafael Souza', role: 'Membro' },
      { id: 'm4', name: 'Bianca Lima', role: 'Membro' },
      { id: 'm5', name: 'Marcos Vieira', role: 'Membro' },
      { id: 'm6', name: 'Julia Reis', role: 'Membro' }
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

const permissionLabels = {
  todos: 'Todos',
  lideres: 'Apenas líderes',
  ninguem: 'Ninguém'
}

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
    setIsGroupModalOpen(true)
  }

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false)
  }

  const handleCreateGroup = (event) => {
    event.preventDefault()

    const parsedMaxMembers = hasMaxMembers ? Number(maxMembers) : null

    const newGroup = {
      id: `group-${Date.now()}`,
      name: groupName.trim() || 'Novo Grupo',
      description: groupDescription.trim() || 'Grupo criado para testes de layout.',
      visibility,
      membersCount: 1,
      maxMembers: Number.isFinite(parsedMaxMembers) && parsedMaxMembers > 0 ? parsedMaxMembers : null,
      permissions: {
        view: viewPermission,
        manage: managePermission
      },
      members: [
        { id: 'me', name: 'Você', role: 'Líder' }
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
            aria-label="Novo grupo"
          >
            <div className="grupos-modal-header">
              <h3>Novo Grupo</h3>
              <button
                type="button"
                className="grupos-close-button"
                onClick={handleCloseGroupModal}
                aria-label="Fechar modal de grupo"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="grupos-form" onSubmit={handleCreateGroup}>
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
                  <label htmlFor="group-visibility">Visibilidade</label>
                  <div className="grupos-select-wrapper">
                    <select
                      id="group-visibility"
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value)}
                    >
                      <option value="publico">Público</option>
                      <option value="privado">Privado</option>
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
                Criar Grupo
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
            <div className="grupos-modal-header">
              <h3>{detailsGroup.name}</h3>
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
                <div className="grupos-details-chip-row">
                  <span className="grupos-details-chip">{visibilityLabels[detailsGroup.visibility]}</span>
                  <span className="grupos-details-chip">{detailsGroup.maxMembers ? `${detailsGroup.membersCount}/${detailsGroup.maxMembers} membros` : `${detailsGroup.membersCount} membros`}</span>
                </div>
                <p>{detailsGroup.description}</p>
              </div>

              <div className="grupos-details-grid">
                <div className="grupos-details-panel">
                  <h4>Configurações</h4>
                  <ul>
                    <li><strong>Visibilidade:</strong> {visibilityLabels[detailsGroup.visibility]}</li>
                    <li><strong>Visualizar carteira e transações:</strong> {permissionLabels[detailsGroup.permissions.view]}</li>
                    <li><strong>Gerenciar carteira e transações:</strong> {permissionLabels[detailsGroup.permissions.manage]}</li>
                    <li><strong>Número máximo de membros:</strong> {detailsGroup.maxMembers || 'Sem limite'}</li>
                  </ul>
                </div>

                <div className="grupos-details-panel">
                  <h4>Membros</h4>
                  <div className="grupos-members-list">
                    {detailsGroup.members.map((member) => (
                      <div key={member.id} className="grupos-member-item">
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Grupos
