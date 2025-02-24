'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { io, Socket } from 'socket.io-client'

import { setGameData, updateGameScreen } from '../store/slices/gameSlice'

const SocketContext = createContext < Socket > (null)

export const useSocket = () => {
  return useContext(SocketContext)
}

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState < Socket > (null)

  const dispatch = useDispatch()

  useEffect(() => {
    if (!dispatch) {
      return
    }

    const socketInstance = io('http://localhost:3001/')

    setSocket(socketInstance)

    // TODO: temporary; delete this
    socketInstance.on('message', (arg) => {
      console.log('msg from socket server:', arg) // world
    })

    socketInstance.on('GAME_CREATED', (data) => {
      dispatch(setGameData(data))
      dispatch(updateGameScreen('LOBBY'))
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [dispatch])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
