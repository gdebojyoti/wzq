'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { io, Socket } from 'socket.io-client'

import { setGameData, updateScreen, setError, addTurn } from '../store/slices/gameSlice'

import { checkAndSetUserId } from './actions'
import { saveGameInfoLocally } from '../components/screens/actions'

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

      const { id } = data
      saveGameInfoLocally(id)
    })

    socketInstance.on('GAME_STARTED', (data) => {
      console.log('starting game', data)
      dispatch(updateScreen('ONGOING'))

      const { id } = data
      saveGameInfoLocally(id)
    })

    socketInstance.on('SYNC_GAME_DETAILS', (data) => {
      console.log('synced with server', data)
      dispatch(setGameData(data))

      const { status } = data
      dispatch(updateScreen(status))
    })

    socketInstance.on('TURN_TAKEN', (data) => {
      console.log('turn complete', data)
      dispatch(addTurn(data))
    })

    socketInstance.on('ERROR', (data) => {
      console.warn('error occurred', data)
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
