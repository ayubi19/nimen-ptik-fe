'use client'

// Next Imports
import Image from 'next/image'

const Logo = () => {
  return (
    <div className='flex items-center min-bs-[24px]'>
      <Image
        src='/images/logo.svg'
        alt='Nimen PTIK'
        width={100}
        height={44}
        priority
        style={{ objectFit: 'contain' }}
      />
    </div>
  )
}

export default Logo
