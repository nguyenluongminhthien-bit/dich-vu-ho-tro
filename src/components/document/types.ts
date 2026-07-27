export interface DocumentTableProps {
  loading: boolean;
  paginatedDocs: any[];
  filteredDocsCount: number;
  donViMap: Record<string, string>;
  isViewerHanChe: boolean;
  canEditOrDeleteDocument: (item: any) => boolean;
  handleQuickUpdateStatus: (item: any, newStatus: string) => void;
  openModal: (mode: 'create' | 'update', item?: any) => void;
  handleDeleteClick: (id: string) => void;
  setViewData: (item: any) => void;
  setIsViewModalOpen: (open: boolean) => void;
}
