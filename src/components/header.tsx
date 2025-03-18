'use client';

import React, { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveEpochNo } from '@meshsdk/core';
import { usePathname } from 'next/navigation';
import WalletConnectButton from '@/components/walletButton';

type NavLink = {
  readonly href: string;
  readonly label: string;
};

const navLinks: ReadonlyArray<NavLink> = [
  { href: '/', label: 'Home' },
  { href: '/wallet', label: 'Wallet'},
];

const Header: FC = (): React.ReactElement => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [epoch, setEpoch] = useState<number | null>(null);
  const [isNetworkConnected, setIsNetworkConnected] = useState<boolean>(false);
const logo = process.env.NEXT_PUBLIC_LOGO_SRC as string | "/gc.png"
  const toggleMenu = (): void => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchEpoch = async (): Promise<void> => {
      try {
        const currentEpoch = resolveEpochNo('mainnet') as number;
        setEpoch(currentEpoch);
        setIsNetworkConnected(!!currentEpoch);
      } catch (error) {
        setIsNetworkConnected(false);
      }
    };
    
    fetchEpoch();
  }, []);

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
        scrolled ? 'bg-neutral-800 backdrop-blur-md shadow-lg' : 'bg-neutral-800'
      } border-b border-zinc-700`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <Image 
              className="h-[5rem]  border-neutral-500 border-[1px] w-auto" 
              height={100} 
              width={100} 
              src={logo}
              alt="Logo" 
              priority
            />
          </Link>

          <nav className="hidden md:block">
            <ul className="flex space-x-8 bg-black/20 py-2 px-6 rounded border border-zinc-600/50 shadow-inner shadow-amber-900/10">
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
              variant="default" 
              size="sm"
              className="border-nuetral-600 bg-black/30 hover:bg-neutral-800 hover:text-amber-400 transition-all duration-300 shadow-sm shadow-amber-500/20"
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

      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-sky-950/98 backdrop-blur-md border-t border-neutral-700`}>
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
          
          <div className="mt-4 py-3 px-4 text-sm font-mono text-white bg-black/20 rounded-lg border-t border-b border-zinc-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs">Network Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${isNetworkConnected ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                {isNetworkConnected ? 'Up' : 'Down'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span>Current Epoch:</span>
              <span className="text-amber-300 bg-amber-900/20 px-2 py-0.5 rounded-full text-xs">{epoch ?? '--'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;