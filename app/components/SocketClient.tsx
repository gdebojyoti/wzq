'use client'

import { useEffect } from "react"
import { io } from "socket.io-client"

const SocketClient = () => {
  useEffect(() => {
    console.log("connecting to socket")
    const socket = io('http://localhost:3001/')

    socket.emit('HOST_GAME', {
      name: 'Deb',
      gridSize: 16
    })
  }, [])

  return null
}

export default SocketClient