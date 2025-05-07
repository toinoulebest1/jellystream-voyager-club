
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className={cn("animate-spin rounded-full border-4 border-solid border-netflix-red border-t-transparent h-12 w-12", className)}></div>
    </div>
  );
};

export default LoadingSpinner;
