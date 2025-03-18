

"use client"

import React from "react";
import Image from "next/image";

export default function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();
  const logo = process.env.LOGO_SRC as string
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-neutral-800 backdrop-blur-md border-t border-neutral-500 transition-all duration-300 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-full flex flex-col relative">
        <div className="flex items-center justify-between h-20 w-full">
          <div className="flex items-center space-x-2 sm:space-x-3 w-1/3 sm:w-1/4 min-w-0">
          <div className="flex items-center justify-between h-20 w-full">
<div className="flex items-center space-x-2 sm:space-x-3 w-1/3 sm:w-1/4 min-w-0">
  <div className="relative rounded-md overflow-hidden flex-shrink-0">
    <Image
      src={logo}
      alt="Logo art"
      className="object-cover  border-neutral-500 border-[1px]"
      height={150}
      width={150}
      priority
    />
  </div>
</div>
</div>
          </div>
          <div className="text-gray-400 text-sm text-right">
            <p>Built leveraging GameChanger wallet</p>
            <div className="flex justify-end items-center">
              <p>© {currentYear} {process.env.COMPANY_NAME}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}