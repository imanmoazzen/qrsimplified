import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

import config from "../../../server/config.js";

const Redirect = () => {
  const { campaign_id } = useParams();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;
    window.location.replace(`${config.apiV2URL}/campaign/id/${campaign_id}`);
  }, []);

  return null;
};

export default Redirect;
