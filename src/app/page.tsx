import React, { type FC } from 'react';
import { Zap } from 'lucide-react';
import Image from 'next/image';

const logo  = process.env.NEXT_PUBLIC_LOGO_SRC as string ;

const Home: FC = (): React.ReactElement => {

  return (
    <main className="min-h-screen bg-black py-16 px-4 flex flex-col items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-blue-400" style={{ backgroundSize: '8vmin 8vmin' }}></div>
          <div className="absolute inset-0 h-full w-full bg-zinc-600" style={{ backgroundSize: '8vmin 8vmin' }}></div>
        </div> 
      </div>

      <div className="max-w-6xl mx-auto  z-10">

        <div className="text-center mb-16">
          <div className=" justify-center items-center h-fit mb-4">
           
            <Image
              className="mx-auto my-4  border-neutral-500 border-[1px]"
              height={300}
              width={300}
              src={logo}
              alt="Logo"
              priority
            />

            <span className="text-xl text-gray-300 mx-auto mt-4">       <div className="relative">
              <Zap size={48} className="text-white text-center w-fit mx-auto" />
              <h1>{process.env.NEXT_PUBLIC_COMPANY_NAME}</h1>
              <h2>Cardano application leveraging GameChanger wallet!</h2>
              <div className="absolute  mx-auto inset-0 blur-md bg-neutral-500 rounded-full opacity-30 "> </div>
<p className='h-full text-[1rem] p-12'>A cool paragraph about {process.env.NEXT_PUBLIC_COMPANY_NAME}!  Isn&apos;t this super cool, and not a total waste of time?!!!  We hope you agree!</p>
            </div>
            </span></div>
 
        </div>
      </div>
    </main>
  );
};

export default Home;