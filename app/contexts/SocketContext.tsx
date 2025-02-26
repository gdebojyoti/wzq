'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { io, Socket } from 'socket.io-client'

import { setGameData, updateScreen, setError } from '../store/slices/gameSlice'

import { checkAndSetUserId } from './actions'

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

    checkAndSetUserId(dispatch)

    const socketInstance = io('http://localhost:3001/')

    setSocket(socketInstance)

    socketInstance.on('GAME_CREATED', (data) => {
      dispatch(setGameData(data))
      dispatch(updateScreen('LOBBY'))
    })

    socketInstance.on('GAME_STARTED', (data) => {
      console.log('starting game', data)
      dispatch(updateScreen('GAME'))
    })

    socketInstance.on('ERROR', (data) => {
      dispatch(setError(data))
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
