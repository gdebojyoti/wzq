const Button = ({ children, type, className: overrideClassName = '' }) => {
  let className = 'w-40 h-10 rounded-full ' + overrideClassName

  switch (type) {
    case 'primary': {
      className += ' bg-purple-600'
      break
    }
    case 'secondary': {
      className += ' text-purple-600 border border-purple-600'
      break
    }
  }

  return (
    <button className={className}>
      {children}
    </button>
  )
}

export default Button