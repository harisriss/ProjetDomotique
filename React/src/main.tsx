import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import Dashboard from "./components/pages/Dashboard.tsx";

const theme = createTheme({
  primaryColor: 'dark',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, sans-serif',
  components: {
    Button: {
      defaultProps: {
        fw: 500,
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
        shadow: 'sm',
        radius: 'md',
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Dashboard />
      </MantineProvider>
    </React.StrictMode>,
)