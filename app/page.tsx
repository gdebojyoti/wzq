'use client'

import React from 'react'
import { Provider } from 'react-redux'

import ScreenComponent from './components/screens/ScreenComponent'
import SocketProvider from './contexts/SocketContext'
import store from './store'

const Page = () => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <main className='h-screen bg-[#222] text-white'>
          <div className='w-full max-w-md h-full mx-auto bg-[#333]'>
            <ScreenComponent />
          </div>
        </main>
      </SocketProvider>
    </Provider>
  )
}

export default Page
