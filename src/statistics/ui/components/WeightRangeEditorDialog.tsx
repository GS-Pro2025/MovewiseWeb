import React from 'react';
import { Scale, X, Plus, Undo, Save, Trash2 } from 'lucide-react';
import { WeightRange } from '../../domain/HistoricalJobWeightModels';

interface WeightRangeEditorDialogProps {
  isOpen: boolean;
  tempRanges: WeightRange[];
  onClose: () => void;
  onSave: () => void;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
  onRangeChange: (index: number, field: 'min' | 'max', value: number) => void;
  onResetToDefaults: () => void;
  isMobile?: boolean;
}

const WeightRangeEditorDialog: React.FC<WeightRangeEditorDialogProps> = ({
  isOpen,
  tempRanges,
  onClose,
  onSave,
  onAddRange,
  onRemoveRange,
  onRangeChange,
  onResetToDefaults,
  isMobile = false
}) => {
  if (!isOpen) return null;

  const Button: React.FC<{
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
  }> = ({ 
    variant = 'outline', 
    size = 'md', 
    children, 
    onClick, 
    disabled, 
    className = '',
    fullWidth = false
  }) => {
    const baseClasses = `font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${fullWidth ? 'w-full' : ''}`;
    
    const variantClasses = {
      primary: `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      secondary: `bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      danger: `bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      outline: `border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 focus:ring-blue-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
    };

    const sizeClasses = {
      sm: isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm',
      md: isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm',
      lg: isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3 text-base'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  const Card: React.FC<{
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
  }> = ({ children, className = '', onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-lg border border-slate-200 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 p-4"
      onClick={onClose}
    >
      <Card
        className={`w-full ${isMobile ? 'max-w-md' : 'max-w-3xl'} ${isMobile ? 'p-4' : 'p-8'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Scale className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-blue-600`} />
            <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800`}>
              Edit Weight Ranges
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border-2 border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ranges List */}
        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
          {tempRanges.map((range, index) => (
            <div 
              key={index} 
              className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4 p-4 rounded-lg border-2 border-slate-200 bg-slate-50`}
            >
              <span className="px-3 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white">
                #{index + 1}
              </span>
              
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-3 flex-1`}>
                <div className={`flex ${isMobile ? 'justify-between' : ''} items-center gap-3`}>
                  <label className="font-semibold text-slate-700">Min:</label>
                  <input
                    type="number"
                    value={range.min}
                    onChange={(e) => onRangeChange(index, 'min', Number(e.target.value))}
                    className={`${isMobile ? 'w-20' : 'w-32'} px-3 py-2 border-2 border-slate-300 rounded-lg font-medium focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                </div>
                
                <div className={`flex ${isMobile ? 'justify-between' : ''} items-center gap-3`}>
                  <label className="font-semibold text-slate-700">Max:</label>
                  <input
                    type="number"
                    value={range.max}
                    onChange={(e) => onRangeChange(index, 'max', Number(e.target.value))}
                    className={`${isMobile ? 'w-20' : 'w-32'} px-3 py-2 border-2 border-slate-300 rounded-lg font-medium focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                </div>
                
                <span className="font-medium text-slate-600">lbs</span>
              </div>
              
              <Button
                variant="danger"
                size="sm"
                onClick={() => onRemoveRange(index)}
                fullWidth={isMobile}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-3`}>
          <div className={`flex ${isMobile ? 'flex-col' : ''} gap-3`}>
            <Button onClick={onAddRange} fullWidth={isMobile}>
              <Plus className="h-4 w-4" />
              Add Range
            </Button>
            <Button onClick={onResetToDefaults} fullWidth={isMobile}>
              <Undo className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col' : ''} gap-3`}>
            <Button onClick={onClose} fullWidth={isMobile}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave} fullWidth={isMobile}>
              <Save className="h-4 w-4" />
              Apply Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WeightRangeEditorDialog;