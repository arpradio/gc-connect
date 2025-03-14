import React, { type FC, type ReactNode } from 'react';
import { Music4, Album, Library, Layers, Headphones, Code, Zap, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';


type IconComponent = FC<{ size?: number; className?: string }>;

interface CardProps {
  href: string;
  icon: IconComponent;
  iconColor: string;
  iconHoverColor: string;
  title: string;
  description: string;
}

interface EcosystemPartner {
  readonly name: string;
  readonly href: string;
  readonly imageSrc: string;
  readonly imageAlt: string;
}

interface FeatureItemProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const MusicPartners: ReadonlyArray<EcosystemPartner> = [
  {
    name: "NEWM",
    href: "https://newm.io",
    imageSrc: "/newm.png",
    imageAlt: "NEWM logo"
  },
  {
    name: "DeMU",
    href: "https://demu.pro",
    imageSrc: "/demu.avif",
    imageAlt: "DEMU logo"
  },
  {
    name: "Jukeboys NFTS",
    href: "https://x.com/JukeBoysNFTs",
    imageSrc: "/juke.png",
    imageAlt: "JukeBoys NFTs"
  },
  {
    name: "SOUNDRIG",
    href: "https://soundrig.io/",
    imageSrc: "/soundrig.png",
    imageAlt: "SoundRig logo"
  }
];

const EcosystemPartners: ReadonlyArray<EcosystemPartner> = [
  {
    name: "GameChanger",
    href: "https://gamechanger.finance",
    imageSrc: "/gc.png",
    imageAlt: "GameGhanger"
  },

];

const Card: FC<CardProps> = ({
  href,
  icon: Icon,
  iconColor,
  iconHoverColor,
  title,
  description,
}) => (
  <Link href={href}>
    <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300 hover:translate-y-[-4px] group shadow-lg hover:shadow-xl hover:shadow-purple-900/20">
      <div className="flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
        <Icon
          size={48}
          className={`${iconColor} group-hover:${iconHoverColor} transition-colors`}
        />
      </div>
      <h2 className="text-2xl font-bold text-white text-center mb-4">{title}</h2>
      <p className="text-gray-300 text-center">{description}</p>
    </div>
  </Link>
);

const FeatureItem: FC<FeatureItemProps> = ({ icon, title, description }) => (
  <div className="flex p-4 hover:bg-white/5 rounded-lg transition-colors">
    <div className="mr-4 mt-1">{icon}</div>
    <div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  </div>
);

const Home: FC = (): React.ReactElement => {
  const cards: ReadonlyArray<CardProps> = [
    {
      href: '/mint/single',
      icon: Music4,
      iconColor: 'text-blue-400',
      iconHoverColor: 'text-blue-300',
      title: 'Single Track',
      description: 'Mint single track music on Cardano',
    },
    {
      href: '/mint/multiple',
      icon: Layers,
      iconColor: 'text-amber-400',
      iconHoverColor: 'text-amber-300',
      title: 'Multiple Tracks',
      description: 'Create a token with multiple tracks in one collection',
    },
    {
      href: '/mint/album',
      icon: Album,
      iconColor: 'text-purple-400',
      iconHoverColor: 'text-purple-300',
      title: 'Album/EP',
      description: 'Mint complete albums as a cohesive NFT collection',
    },
  ];

  const features: ReadonlyArray<FeatureItemProps> = [
    {
      icon: <Zap size={24} className="text-blue-400" />,
      title: "True Ownership",
      description: "Mint your music as NFTs on Cardano's sustainable blockchain for verifiable ownership"
    },
    {
      icon: <Globe size={24} className="text-purple-400" />,
      title: "Direct Connection",
      description: "Connect directly with fans without intermediaries, building lasting relationships"
    },
    {
      icon: <Code size={24} className="text-amber-400" />,
      title: "CIP-60 Standard",
      description: "Leveraging Cardano's official music token standard for maximum interoperability"
    },
    {
      icon: <Headphones size={24} className="text-green-400" />,
      title: "Interactive Player",
      description: "Stream music directly from the blockchain with our advanced player technology"
    },
  ];

  return (
    <main className="min-h-screen bg-black py-16 px-4 flex flex-col items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.15),transparent_70%)]"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[linear-gradient(to_right,#0000_49.5%,#334155_49.5%,#334155_50.5%,#0000_50.5%)]" style={{ backgroundSize: '8vmin 8vmin' }}></div>
          <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_bottom,#0000_49.5%,#334155_49.5%,#334155_50.5%,#0000_50.5%)]" style={{ backgroundSize: '8vmin 8vmin' }}></div>
        </div>

        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px] animate-pulse opacity-20" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500 rounded-full blur-[100px] animate-pulse opacity-20" style={{ animationDuration: '12s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-amber-500 rounded-full blur-[100px] animate-pulse opacity-20" style={{ animationDuration: '10s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto  z-10">

        <div className="text-center mb-16">
          <div className=" justify-center items-center mb-4">
            <Image
              className="mx-auto my-4 w-24"
              height={300}
              width={300}
              src="/radio.svg"
              alt="Arp Radio"
              priority
            />
            <span className="text-xl text-gray-300 mx-auto mt-4">       <div className="relative">
              <Headphones size={48} className="text-white w-fit mx-auto" />
              <div>Cardano&apos;s interactive music player revolutionizing artist ownership</div>
              <div className="absolute w-12 mx-auto inset-0 blur-lg bg-blue-500 opacity-40"> </div>

            </div>
            </span></div>
          <div className="mt-3 flex justify-center space-x-1">
            <span className="px-3 py-1 bg-blue-900/40 text-blue-300 text-xs rounded-full border border-blue-700/50">Blockchain</span>
            <span className="px-3 py-1 bg-purple-900/40 text-purple-300 text-xs rounded-full border border-purple-700/50">NFT</span>
            <span className="px-3 py-1 bg-amber-900/40 text-amber-300 text-xs rounded-full border border-amber-700/50">Music</span>
          </div>
        </div>

        <div className="mt-16 mb-6 p-6 bg-gray-900/70 backdrop-blur-md rounded-xl border border-white/10">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Why Arp Radio?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <FeatureItem
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
        <h2 className="text-3xl text-center mb-4 font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400">
          Offerings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <Card
              key={index}
              href={card.href}
              icon={card.icon}
              iconColor={card.iconColor}
              iconHoverColor={card.iconHoverColor}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        <Link href="/assets">
          <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300 hover:translate-y-[-4px] group shadow-lg hover:shadow-xl hover:shadow-green-900/20">
            <div className="flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
              <Library
                size={48}
                className="text-green-400 group-hover:text-green-300 transition-colors"
              />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Token Library
            </h2>
            <p className="text-gray-300 text-center">
              Browse the Cardano Blockchain for existing CIP-60 music tokens
            </p>
          </div>
        </Link>

        <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300 hover:translate-y-[-4px] group shadow-lg hover:shadow-xl hover:shadow-green-900/20">
          <div className="flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
            <Globe
              size={48}
              className="text-green-400 group-hover:text-green-300 transition-colors"
            />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Cardano Music Ecosystem
          </h2>
          <p className="text-gray-300 text-center">
            Discover other Music Projects on Cardano!
          </p>
          <div className="flex">

          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-6">
            {MusicPartners.map((partner) => (
              <div key={partner.name} className="w-fit text-center">
                <a href={partner.href} target="_blank" rel="noopener noreferrer">
                  <Image
                    className="mx-auto my-4 h-24 w-auto"
                    height={300}
                    width={300}
                    src={partner.imageSrc}
                    alt={partner.imageAlt}
                    priority
                  />
                  <label className="mx-auto text-neutral-300 font-thin">{partner.name}</label>
                </a>
              </div>
            ))}
          </div>
          <hr className="m-6" />
          <div className="text-center text-neutral-300">
            <h1 className="text-xl" >Ecosystem Partners</h1>
            <div className="flex flex-wrap justify-center gap-8 mt-6">
              {EcosystemPartners.map((partner) => (
                <div key={partner.name} className="w-fit text-center">
                  <a href={partner.href} target="_blank" rel="noopener noreferrer">
                    <Image
                      className="mx-auto my-4 h-24 w-auto"
                      height={300}
                      width={300}
                      src={partner.imageSrc}
                      alt={partner.imageAlt}
                      priority
                    />
                    <label className="mx-auto text-neutral-300 font-thin">{partner.name}</label>
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>Built leveraging CIP-60 standards for music NFTs on Cardano</p>
          <div className="mt-4 flex justify-between items-center">
            <p>© 2025 The Psyence Lab LLC</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;