import ExpandableContainer from "../../../../commonComponents/ExpandableContainer/ExpandableContainer.js";
import styles from "./FAQs.module.scss";
import Feature from "./Feature.js";
import { BRAND, CHANGE, CONTACT, DEMO, PAYMENENT, PRINT, QUALITY, ROBUST, TRIAL } from "./info.js";

export const FAQs = ({ extraClasses, isInitiallyOpen }) => {
  return (
    <div className={`${styles["main-container"]} ${extraClasses}`}>
      <ExpandableContainer
        title="Frequently Asked Questions"
        extraClasses={styles["parent-expandable"]}
        isInitiallyOpen={isInitiallyOpen}
      >
        <ExpandableContainer
          title="Is the payment for the QR codes monthly?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={PAYMENENT} />
        </ExpandableContainer>

        <ExpandableContainer
          title="Can I buy one QR code and use it forever, with unlimited updates?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={CHANGE} />
        </ExpandableContainer>

        <ExpandableContainer
          title="What is a branded QR code?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={BRAND} />
        </ExpandableContainer>

        <ExpandableContainer
          title="Doesn’t my logo in the center make the QR code unreadable?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={ROBUST} />
        </ExpandableContainer>

        <ExpandableContainer
          title="Do you offer print services?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={PRINT} />
        </ExpandableContainer>

        <ExpandableContainer
          title="Is the print quality good if I download the QR code?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={QUALITY} />
        </ExpandableContainer>

        <ExpandableContainer
          title="Can I try the software before I pay?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={TRIAL} />
        </ExpandableContainer>

        <ExpandableContainer
          title="Do I need to schedule a demo with your team to get started?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={DEMO} />
        </ExpandableContainer>

        <ExpandableContainer
          title="I have a question about my invoice—what’s the best way to reach your team?"
          extraClasses={styles["expandable"]}
          isPlusMinusStyle={true}
        >
          <Answers items={CONTACT} />
        </ExpandableContainer>
      </ExpandableContainer>
    </div>
  );
};

const Answers = ({ items = [] }) => {
  return (
    <section>
      {items.map(
        ({ title, text, icon, isHidden }) => !isHidden && <Feature key={title} title={title} info={text} icon={icon} />
      )}
    </section>
  );
};
