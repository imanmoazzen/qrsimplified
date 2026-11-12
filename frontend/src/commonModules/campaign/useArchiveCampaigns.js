import { useRef, useState } from "react";
import { useDispatch } from "react-redux";

import { server } from "../../index.js";
import { archiveCampaigns } from "./archiveCampaigns.js";
import { campaignsArchived } from "./store/uiReducer.js";

export default function useArchiveCampaigns() {
  const dispatch = useDispatch();
  const [isArchiving, setIsArchiving] = useState(false);
  const pending = useRef(false);

  const archive = async (ids) => {
    if (pending.current) return null;
    pending.current = true;
    setIsArchiving(true);
    try {
      const result = await archiveCampaigns(ids, server.requestFromApiv2);
      if (result.archivedIds.length) dispatch(campaignsArchived(result.archivedIds));
      return result;
    } finally {
      pending.current = false;
      setIsArchiving(false);
    }
  };
  return { archive, isArchiving };
}
