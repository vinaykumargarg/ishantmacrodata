import React from 'react';
import BookmapLiquidationTerminalView from './BookmapLiquidationTerminalView';

interface OrderBookHeatmapViewProps {
  onNavigate?: (tabId: string) => void;
}

export const OrderBookHeatmapView: React.FC<OrderBookHeatmapViewProps> = () => {
  return <BookmapLiquidationTerminalView />;
};

export default OrderBookHeatmapView;
