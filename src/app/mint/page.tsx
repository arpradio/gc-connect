import Link from "next/link";
import Image from "next/image";

export default function Page() {
  return (
    <main className="h-full w-fit max-w-screen flex items-center justify-center mx-auto p-2 sm:p-4 md:p-6 bg-[#0f172a]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>
      <div className="text-center mb-3 h-fit flex flex-col">
        <h1 className="text-3xl font-bold text-[#228fa7] mt-4 text-shadow">
          Music Token Minting
        </h1>
        <h2 className="text-xl font-mono text-white">Be Your Own Minter!</h2>
        <p className="text-white/80 italic text-xs">
          A collection of CIP60-compliant music token minting scripts.
        </p>

        <h1 className="text-center mt-6 text-gray-100 font-mono font-bold">
          Choose a Mint Form
        </h1>
        <div className="flex justify-evenly text-lg m-4 font-bold text-amber-300">
          <Link href="/mint/single">
            <div className="hover:text-blue-600" title="A single song">Single</div>
          </Link>
          <Link href="/mint/multiple">
            <div className="hover:text-blue-600" title="Multiple songs of different artists">Multiple</div>
          </Link>
          <Link href="/mint/album">
            <div className="hover:text-blue-600" title="Multiple songs of the same artist">Album/EP</div>
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="text-xs text-gray-300">Powered by</h2>
          <a href="https://gamechanger.finance/" target="_blank">
            <Image className="m-auto mt-2 border-gray-400 border-[1px]" src="/gc.png" width={400} height={400} alt="GameChanger" />
          </a>
        </div>
      </div>

    </main>
  );
}
