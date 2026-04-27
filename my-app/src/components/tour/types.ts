import type { TourId } from '@/lib/tour/ids';

export type TourStep = {
  /**
   * CSS selector for the element to spotlight. The page must include
   * `data-tour="..."` on the element. Use null for an intro/outro step
   * that's centered on the screen with no target.
   */
  target: string | null;
  title: string;
  body: string;
  /**
   * Where the dialog appears relative to the target. 'auto' picks based
   * on available space. Default 'auto'.
   */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center';
};

export type TourConfig = {
  id: TourId;
  steps: TourStep[];
};
