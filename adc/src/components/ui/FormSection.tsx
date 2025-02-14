import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isOptional?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  isOptional = false,
  defaultExpanded = true,
  className = ''
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            {title}
            {isOptional && (
              <span className="ml-2 text-sm text-gray-500">(Optional)</span>
            )}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-6 bg-white">{children}</div>
      </motion.div>
    </div>
  );
}