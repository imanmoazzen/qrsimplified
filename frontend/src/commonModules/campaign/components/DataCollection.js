import { useEffect, useState } from "react";

import InputBox from "../../../commonComponents/InputBox/InputBox.js";
import SimpleSwitch from "../../../commonComponents/SimpleSwitch/SimpleSwitch.js";
import styles from "./DataCollection.module.scss";

const DataCollection = ({ lead, setLead, onUpdate, extraClasses }) => {
  const [noDataCollection, setNoDataCollection] = useState(false);
  const { name = false, email = false, phone = false, title = false, comment = false } = lead ?? {};

  useEffect(() => {
    setNoDataCollection(lead ? !Object.values(lead).some(Boolean) : true);
  }, [lead]);

  const flip = () => {
    const newState = !noDataCollection;
    setNoDataCollection(newState);
    const newLead = newState ? null : { name: true, email: true, comment: true };
    setLead(newLead);
    onUpdate?.(newLead);
  };

  const update = (fieldToUpdate) => {
    const newLead = { ...lead, ...fieldToUpdate };
    setLead(newLead);
    onUpdate?.(newLead);
  };

  return (
    <div className={`${styles["main-container"]} ${!noDataCollection && styles["active"]} ${extraClasses}`}>
      <div className={styles["switch-container"]}>
        <span>Collect info before redirect?</span>
        <SimpleSwitch leftLabel="No" rightLabel="Yes" onFlip={flip} isKnobOnLeft={noDataCollection} />
      </div>

      {!noDataCollection && (
        <div className={styles["details-container"]}>
          <div className={styles["chechboxes-container"]}>
            <InputBox
              type="checkbox"
              label="Name"
              value={name}
              setValue={(value) => update({ name: value })}
              extraClasses={styles["input-checkbox"]}
            />
            <InputBox
              type="checkbox"
              label="Email"
              value={email}
              setValue={(value) => update({ email: value })}
              extraClasses={styles["input-checkbox"]}
            />
            <InputBox
              type="checkbox"
              label="Phone"
              value={phone}
              setValue={(value) => update({ phone: value })}
              extraClasses={styles["input-checkbox"]}
            />
            <InputBox
              type="checkbox"
              label="Job Title"
              value={title}
              setValue={(value) => update({ title: value })}
              extraClasses={styles["input-checkbox"]}
            />
            <InputBox
              type="checkbox"
              label="Comments"
              value={comment}
              setValue={(value) => update({ comment: value })}
              extraClasses={styles["input-checkbox"]}
            />
          </div>
          <span className={styles["tip"]}>Collect only what you need to reduce visitor friction</span>
        </div>
      )}
    </div>
  );
};

export default DataCollection;
