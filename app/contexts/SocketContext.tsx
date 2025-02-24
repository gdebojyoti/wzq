'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SocketContext = createContext < Socket > (null)

export const useSocket = () => {
  return useContext(SocketContext)
}

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState < Socket > (null)

  useEffect(() => {
    console.log('connecting to socket')
    const socketInstance = io('http://localhost:3001/')

    setSocket(socketInstance)

    // TODO: temporary; delete this
    socketInstance.on('message', (arg) => {
      console.log('msg from socket server:', arg) // world
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
