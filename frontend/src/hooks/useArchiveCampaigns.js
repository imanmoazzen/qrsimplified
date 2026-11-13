import { useRef, useState } from "react";
import { useDispatch } from "react-redux";

import { archiveCampaigns } from "../commonModules/campaign/utils.js";
import { campaignsArchived } from "../commonModules/campaign/store/uiReducer.js";
import { server } from "../index.js";

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
