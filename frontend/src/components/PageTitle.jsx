import './PageTitle.css'

function PageTitle({ title }) {
  return (
    <div className="page-title">
      <h1 className="page-title-text">{title}</h1>
    </div>
  )
}

export default PageTitle 