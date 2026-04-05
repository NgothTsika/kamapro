import { useState } from "react";

export interface DeleteItem {
  id: string;
  name: string;
  [key: string]: any;
}

export function useDeleteDialog<T extends DeleteItem>() {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: T | null;
  }>({
    open: false,
    item: null,
  });

  const openDeleteDialog = (item: T) => {
    setDeleteDialog({ open: true, item });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, item: null });
  };

  const resetDeleteDialog = () => {
    setDeleteDialog({ open: false, item: null });
  };

  return {
    deleteDialog,
    setDeleteDialog,
    openDeleteDialog,
    closeDeleteDialog,
    resetDeleteDialog,
  };
}
