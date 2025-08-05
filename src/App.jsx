import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Trash2, RotateCcw, MessageSquare, Clock, Plus } from 'lucide-react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const messagesEndRef = useRef(null)

  // Example questions for quick start
  const exampleQuestions = [
    "What is the weather in London?",
    "Calculate 15 * 8 + 3",
    "What is markdown?",
    "What's the weather in Tokyo and can you explain markdown formatting while calculating 25 * 4?"
  ]

  // Generate a unique session ID on component mount
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startNewChat = () => {
    setMessages([])
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  }

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage
    if (!textToSend.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('https://ai-agent-api-pqoa.onrender.com/agent/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          session_id: sessionId
        })
      })

      const data = await response.json()

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.data.response,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString(),
          plugins: data.data.plugins_called && data.data.plugins_called.length > 0 
            ? data.data.plugins_called 
            : ['vector search']
        }
        setMessages(prev => [...prev, botMessage])
        
        // Add to chat history if this is the first message in the session
        if (messages.length === 0) {
          const historyEntry = {
            id: sessionId,
            title: textToSend.substring(0, 50) + (textToSend.length > 50 ? '...' : ''),
            timestamp: new Date().toLocaleString(),
            messageCount: 2
          }
          setChatHistory(prev => [historyEntry, ...prev])
        } else {
          // Update existing history entry
          setChatHistory(prev => prev.map(entry => 
            entry.id === sessionId 
              ? { ...entry, messageCount: entry.messageCount + 2 }
              : entry
          ))
        }
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <h1>🧪 AI Agent API Testing Interface</h1>
            <p className="api-url">Testing: https://ai-agent-api-pqoa.onrender.com</p>
          </div>
          <div className="header-actions">
            <button onClick={clearChat} className="clear-btn" title="Clear chat">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Chat History Sidebar */}
        <div className="chat-history-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">
              <MessageSquare size={20} />
              <h3>Chat History</h3>
            </div>
            <button onClick={startNewChat} className="new-chat-btn" title="New Chat">
              <Plus size={18} />
            </button>
          </div>
          <div className="history-list">
            {chatHistory.length === 0 ? (
              <div className="no-history">
                <p>No chat history yet</p>
                <p>Start a conversation to see it here</p>
              </div>
            ) : (
              chatHistory.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-title">{entry.title}</div>
                  <div className="history-meta">
                    <Clock size={12} />
                    <span>{entry.timestamp}</span>
                    <span className="message-count">{entry.messageCount} messages</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-container">
          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <Bot size={48} />
                <h2>Welcome to AI Agent Chat!</h2>
                <p>I can help you with:</p>
                <ul>
                  <li>📊 Mathematical calculations (math plugin)</li>
                  <li>🌤️ Weather information (weather plugin)</li>
                  <li>💬 General knowledge questions (vector search)</li>
                  <li>🧠 Remembering our conversation</li>
                </ul>
                <p><strong>Note:</strong> When no specific plugins are used, I default to vector search for knowledge queries.</p>
                <p>Try asking me something!</p>
                
                <div className="example-questions">
                  <h3>Quick Start Questions:</h3>
                  <div className="question-grid">
                    {exampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(question)}
                        className="example-question"
                        disabled={isLoading}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-avatar">
                  {message.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  {message.plugins && message.plugins.length > 0 && (
                    <div className="message-plugins">
                      <span>Used plugins: {message.plugins.join(', ')}</span>
                    </div>
                  )}
                  <div className="message-timestamp">{message.timestamp}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">
                  <Bot size={20} />
                </div>
                <div className="message-content">
                  <div className="loading-indicator">
                    <RotateCcw size={16} className="spinning" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send)"
                disabled={isLoading}
                rows={1}
              />
              <button 
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="send-btn"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
