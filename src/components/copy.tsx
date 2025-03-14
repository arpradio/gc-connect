import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  content: string | object;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ content, className = '' }): React.ReactElement => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (): void => {
    try {
      const textToCopy: string = typeof content === 'string' 
        ? content 
        : JSON.stringify(content, null, 2);
      const textArea: HTMLTextAreaElement = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful: boolean = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('Failed to copy content');
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center gap-2 
        px-3 py-1.5 rounded-lg
        transition-all duration-200
        ${copied 
          ? 'bg-green-700/80 text-white' 
          : 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 hover:text-white'
        }
        shadow-lg hover:shadow-xl
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        border border-gray-700/70
        ${className}
      `}
      type="button"
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          <span className="text-xs font-medium">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span className="text-xs font-medium">Copy</span>
        </>
      )}
    </button>
  );
};

export default CopyButton;