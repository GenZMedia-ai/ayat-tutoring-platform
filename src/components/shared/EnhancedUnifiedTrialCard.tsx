
import React, { useState } from 'react';
import { SmartStudentCard } from './SmartStudentCard';
import { StudentProfileModal } from './StudentProfileModal';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';

interface EnhancedUnifiedTrialCardProps {
  item: MixedStudentItem;
  onEdit?: (item: MixedStudentItem) => void;
  onStatusChange?: (item: MixedStudentItem) => void;
  onContact?: (item: MixedStudentItem) => void;
  onCreatePaymentLink?: (item: MixedStudentItem) => void;
  onRefresh?: () => void;
  showActions?: boolean;
}

export const EnhancedUnifiedTrialCard: React.FC<EnhancedUnifiedTrialCardProps> = ({
  item,
  onEdit,
  onStatusChange,
  onContact,
  onCreatePaymentLink,
  onRefresh,
  showActions = true
}) => {
  const [showProfile, setShowProfile] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open profile if not clicking on action buttons
    if (!(e.target as HTMLElement).closest('button')) {
      setShowProfile(true);
    }
  };

  return (
    <>
      <div onClick={handleCardClick} className="cursor-pointer">
        <SmartStudentCard
          student={item.data}
          type={item.type}
          onEdit={() => onEdit?.(item)}
          onStatusChange={() => onStatusChange?.(item)}
          onContact={() => onContact?.(item)}
          showActions={showActions}
        />
      </div>

      <StudentProfileModal
        student={item.data}
        open={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </>
  );
};
