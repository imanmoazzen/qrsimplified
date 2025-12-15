import styles from "./ProfilePicture.module.scss";

const ProfilePicture = ({ imgSrc, extraClasses }) => {
  return (
    <div className={`${styles["crop-container"]} ${extraClasses}`}>
      <img
        className={styles["profile"]}
        src={imgSrc}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        alt="user profile"
      />
    </div>
  );
};

export default ProfilePicture;
