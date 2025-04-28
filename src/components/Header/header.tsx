'use client';

import React, { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import WalletConnectButton from '@/components/Header/walletButton';

type NavLink = {
  readonly href: string;
  readonly label: string;
};

const navLinks: ReadonlyArray<NavLink> = [
  { href: '/', label: 'Home' },
  { href: '/user', label: 'User' },
  { href: '/other', label: 'Other' },
  { href: '/wallet', label: 'Wallet'}
];

const Header: FC = (): React.ReactElement => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
 

  const toggleMenu = (): void => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return (): void => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all border-[1px] border-neutral-300/50 rounded duration-300 ${
        scrolled ? 'bg-sky-950/95 backdrop-blur-md shadow-lg' : 'bg-zinc-800'
      } border-b border-zinc-700`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <Image 
              className='w-48 h-auto  '
              height={100} 
              width={100} 
              src="/arpradio.webp" 
              alt="Arp Radio" 
              priority
            />
          </Link>

          <nav className="hidden md:block">
            <ul className="flex space-x-8 bg-black/20 py-2 px-6 rounded-full border border-zinc-600/50 shadow-inner shadow-amber-900/10">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className={`text-base font-medium transition-colors duration-200 hover:text-amber-400 relative ${
                      pathname === link.href 
                        ? 'text-amber-400 font-bold' 
                        : 'text-zinc-300'
                    }`}
                  >
                    {link.label}
                    {pathname === link.href && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400 rounded-full"></span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="hidden md:flex flex-col items-end gap-2">
         
 
            <WalletConnectButton 
              variant="outline" 
              size="sm"
              className="border-zinc-600 bg-black/30 hover:bg-zinc-800 hover:text-amber-400 transition-all duration-300 shadow-sm shadow-amber-500/20"
            />
          </div>

          <button 
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-zinc-300 hover:text-amber-400 hover:bg-black/20 focus:outline-none"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            <svg 
              className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
            <svg 
              className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-sky-950/98 backdrop-blur-md border-t border-zinc-700`}>
        <div className="px-4 pt-2 pb-4 space-y-1 sm:px-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`block py-3 px-4 rounded-md text-base font-medium transition-all duration-200 ${
                pathname === link.href 
                  ? 'bg-black/30 text-amber-400 border-l-4 border-amber-400' 
                  : 'text-zinc-300 hover:bg-black/20 hover:text-amber-300 hover:pl-6'
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="pt-4 pb-2 px-4">
            <WalletConnectButton 
              variant="outline"
              className="w-full border-zinc-600 bg-black/30 hover:bg-zinc-800 hover:text-amber-400 transition-all duration-300"
            />
          </div>
          
       
        </div>
      </div>

    </header>
  );
};

export default Header;