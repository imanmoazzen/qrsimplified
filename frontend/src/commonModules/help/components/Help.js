import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import Header from "../../../commonComponents/Header/Header.js";
import Modal from "../../../commonComponents/Modal/Modal.js";
import { auth } from "../../../index.js";
import { GUIDES } from "../guides/guides.js";
import styles from "./Help.module.scss";
import HelpCard from "./HelpCard.js";

const Help = () => {
  const isAnonymous = useSelector(auth.isAnonymousSelector);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [activeHelpId, setActiveHelpId] = useState(null);

  const video = useMemo(() => {
    return GUIDES.find((help) => help.id === activeHelpId)?.video;
  }, [activeHelpId]);

  const poster = useMemo(() => {
    return GUIDES.find((help) => help.id === activeHelpId)?.poster;
  }, [activeHelpId]);

  useEffect(() => {
    if (activeHelpId) setIsVideoActive(true);
  }, [activeHelpId]);

  return (
    <div className={styles["main-container"]}>
      <Header
        title="Help Center"
        info="Learn Scriptover in no time with interactive guides"
        extraClasses={styles["header"]}
      />
      <div className={styles["guide-cards-container"]}>
        {GUIDES.map((help, index) => {
          if (isAnonymous && help.isSigninRequired) return;
          return <HelpCard help={help} setActiveHelpId={setActiveHelpId} key={index} />;
        })}
      </div>

      <Modal active={isVideoActive} setActive={setIsVideoActive} onCancel={() => setActiveHelpId(null)}>
        <video src={video} poster={poster} controls width="100%" className={styles["video"]} />
      </Modal>
    </div>
  );
};

export default Help;
