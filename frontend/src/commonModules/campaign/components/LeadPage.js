import { useEffect } from "react";
import { useState } from "react";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import DynamicTextArea from "../../../commonComponents/DynamicTextArea/DynamicTextArea.js";
import Header from "../../../commonComponents/Header/Header.js";
import InputBox from "../../../commonComponents/InputBox/InputBox.js";
import Label from "../../../commonComponents/Label/Label.js";
import { useFadeInImage } from "../../../hooks/useFadeInImage.js";
import { server } from "../../../index.js";
import styles from "./LeadPage.module.scss";

const LeadPage = () => {
  const [lead, setLead] = useState({});
  const [isBusy, setIsBusy] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const logo = params.get("logo");
  const isNamePresent = params.get("name") === "true";
  const isEmailPresent = params.get("email") === "true";
  const isPhonePresent = params.get("phone") === "true";
  const isTitlePresent = params.get("title") === "true";
  const isCommentPresent = params.get("comment");
  const destination = params.get("destination");
  const campaign_id = params.get("campaign_id");
  const visit_id = params.get("visit_id");
  const isValid = campaign_id && visit_id;

  useEffect(() => {
    if (!isValid && destination) window.location.href = destination;
  }, [campaign_id, visit_id]);

  const userLogo = useFadeInImage({
    extraContainerClasses: styles["logo-container"],
    src: logo,
    alt: "logo for this campaign",
  });

  const handleClick = async () => {
    try {
      setIsBusy(true);

      await server.requestFromApiv2(`/campaign/lead`, {
        method: "PUT",
        mode: "cors",
        data: { campaign_id, visit_id, fieldsToSet: lead },
      });
    } finally {
      if (destination) window.location.href = destination;
      if (!destination) setIsBusy(false);
    }
  };

  if (!isValid) return null;

  return (
    <div className={styles["main-container"]}>
      {userLogo}
      <Header title={"Share a Few Details"}>
        <Label text="We’d love to learn more about you" />
      </Header>

      <div className={styles["form"]}>
        {isNamePresent && (
          <InputBox label="Name:" value={lead?.name ?? ""} setValue={(value) => setLead({ ...lead, name: value })} />
        )}
        {isEmailPresent && <InputBox label="Email:" setValue={(value) => setLead({ ...lead, email: value })} />}
        {isPhonePresent && <InputBox label="Phone:" setValue={(value) => setLead({ ...lead, phone: value })} />}
        {isTitlePresent && <InputBox label="Job Title:" setValue={(value) => setLead({ ...lead, title: value })} />}
        {isCommentPresent && (
          <DynamicTextArea
            label="Additional Comments:"
            placeholder="Add any additional context here (e.g., we met at the Vegas trade show)"
            extraClasses={styles["text-area"]}
            onTempTextChanged={(value) => setLead({ ...lead, comment: value })}
          />
        )}
      </div>

      <DecoratedButton
        buttonText={isBusy ? "Opening..." : "Visit Website"}
        icon="arrow_forward"
        theme={BUTTON_THEMES.COLORED}
        extraClasses={styles["button"]}
        onClick={handleClick}
        isBusy={isBusy}
      />
    </div>
  );
};

export default LeadPage;
