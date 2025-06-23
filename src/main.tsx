import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppWrapper } from './components/common/PageMeta.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <AppWrapper>
      <App />
    </AppWrapper>
  </GoogleOAuthProvider>
)
