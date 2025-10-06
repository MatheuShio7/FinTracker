import './Explorar.css'
import Logo from './components/Logo'
import PageTitle from './components/PageTitle'
import SearchBar from './components/SearchBar'

function Explorar() {
  return (
    <div className="explorar-page">
      <Logo />
      <PageTitle title="Explorar" />
      <SearchBar />
    </div>
  )
}

export default Explorar 