import { useEffect } from "react";
import { useParams } from "react-router-dom";

import config from "../../../server/config.js";

const Redirect = () => {
  const { campaign_id } = useParams();

  useEffect(() => {
    window.location.replace(`${config.apiV2URL}/campaign/id/${campaign_id}`);
  }, []);

  return null;
};

export default Redirect;
