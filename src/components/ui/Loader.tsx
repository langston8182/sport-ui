// Loader moderne avec animations pastels

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function Loader({ size = 'md', fullScreen = false }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const loader = (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full border-4 border-pastel-blue-200 animate-spin`}></div>
      <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-pastel-blue-500 animate-spin`}></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} bg-gradient-to-r from-pastel-blue-400 to-pastel-purple-400 rounded-full animate-bounce-gentle`}></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white/95 to-pastel-blue-50/90 backdrop-blur-sm z-50 fade-in">
        {loader}
        <p className="mt-4 text-pastel-neutral-600 font-medium">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 fade-in">
      {loader}
      <p className="mt-3 text-pastel-neutral-500 text-sm">Chargement...</p>
    </div>
  );
}