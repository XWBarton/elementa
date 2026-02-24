import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import 'antd/dist/reset.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            colorBgLayout: '#f0f5ff',
            fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
            borderRadius: 6,
            colorBorder: '#d0e0ff',
          },
          components: {
            Layout: {
              siderBg: '#ffffff',
              headerBg: '#ffffff',
              bodyBg: '#f0f5ff',
            },
            Menu: {
              itemSelectedBg: '#e6f0ff',
              itemSelectedColor: '#1677ff',
              itemHoverBg: '#f0f5ff',
            },
            Button: {
              primaryColor: '#ffffff',
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
