import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Disc, Play, Download, Share, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';


export interface WalletAssetCardProps {
  asset: any;
  onClick: () => void;
}

const WalletAssetCard: React.FC<> = ({ asset, onClick }) => {

  
  const truncateId = (id: string): string => 
    `${id.slice(0, 8)}...${id.slice(-8)}`;
  
  
  return (
    <Card key={asset.assetId} className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-purple-500/50 transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-40 w-full md:w-40 bg-black">
          {imageSrc ? (
            <Image 
              src={imageSrc}
              alt={metadata.name}
              fill
              className="object-cover"
              unoptimized={imageSrc.startsWith('data:')}
              sizes="(max-width: 768px) 100vw, 160px"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-slate-700">
              <Disc className="h-16 w-16 text-slate-500" />
            </div>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute bottom-2 right-2 bg-black/60 hover:bg-purple-800 text-white rounded-full"
            onClick={onClick}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 flex-1">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="bg-purple-900/40 text-purple-300 border-purple-500/40">
              {asset.quantity > 1 ? `${asset.quantity}x` : 'Unique'}
            </Badge>
          </div>
          
         
          

          
          <div className="flex flex-wrap gap-2">
    
            
           
            <Link 
              href={`https://cardanoscan.io/token/${asset.policyId}.${asset.assetName}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                size="sm" 
                variant="outline"
                className="bg-black/20 border-slate-700 hover:bg-black/40 text-zinc-300"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Explorer
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <CardFooter className="bg-black/30 border-t border-slate-700 p-3 text-xs">
        <div className="text-zinc-500">
          Policy ID: <span className="font-mono text-zinc-400">{truncateId(asset.policyId)}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WalletAssetCard;