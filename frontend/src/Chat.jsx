import Logo from './components/Logo'
import ChatWidget from './components/ChatWidget'
import './Chat.css'

function Chat() {
  return (
    <div className="chat-page">
      <Logo />
      <ChatWidget enabled variant="page" />
    </div>
  )
}

export default Chat
