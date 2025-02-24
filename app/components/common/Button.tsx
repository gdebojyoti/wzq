const Button = ({ children, type, onClick, className: overrideClassName = '' }) => {
  let className = 'w-40 h-10 rounded-full cursor-pointer ' + overrideClassName

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
    <button className={className} onClick={onClick}>
      {children}
    </button>
  )
}

export default Button