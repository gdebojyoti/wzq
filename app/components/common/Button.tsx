const Button = ({ children, type, className: overrideClassName = '' }) => {
  let className = 'w-40 h-10 rounded-full ' + overrideClassName

  switch (type) {
    case 'primary': {
      className += ' bg-[#9B59B6]'
      break
    }
    case 'secondary': {
      className += ' text-[#9B59B6] border border-[#9B59B6]'
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