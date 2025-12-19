import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import { getIds } from "../../../campaign/utils.js";
import config from "../../../server/config.js";

const Redirect = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;

    redirected.current = true;
    const [user_id, campaign_id] = getIds(id);
    window.location.replace(`${config.apiV2URL}/campaign/${user_id}/${campaign_id ?? user_id}`);
  }, []);

  return null;
};

export default Redirect;
