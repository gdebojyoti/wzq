import React from 'react'

import Landing from './components/screens/Landing'

const Page = () => {
  const screen = 'LANDING'

  let ScreenComponent = Landing
  
  return <main className='h-screen bg-gray-900 text-gray-50'>
    <div className='w-full max-w-md h-full mx-auto bg-gray-800'>
      <ScreenComponent />
    </div>
  </main>
}

export default Page