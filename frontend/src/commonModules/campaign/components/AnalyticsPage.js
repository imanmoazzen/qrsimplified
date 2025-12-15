import ReactCountryFlag from "react-country-flag";
import { useDispatch, useSelector } from "react-redux";

import Header from "../../../commonComponents/Header/Header.js";
import { ILLUSTRATIONS } from "../../../commonComponents/Illustrations/Illustrations.js";
import Label from "../../../commonComponents/Label/Label.js";
import { campaignModule } from "../../../index.js";
import { REGION_FILTERS, TIME_FILTERS, regionFilterChanged, timeFilterChanged } from "../store/uiReducer.js";
import { getCountryName } from "../utils.js";
import styles from "./AnalyticsPage.module.scss";
import Filter from "./Filter.js";

const AnalyticsPage = () => {
  const dispatch = useDispatch();
  const campaign = useSelector(campaignModule.getActiveCampaign);
  const timeFilter = useSelector(campaignModule.getTimeFilter);
  const regionFilter = useSelector(campaignModule.getRegionFilter);

  const analytics = campaign?.analytics ?? {};
  const countries = analytics?.countries ?? [];
  const cities = analytics?.cities ?? [];
  const data = regionFilter === REGION_FILTERS.COUNTRY ? countries : cities;

  let timeKey;
  if (timeFilter === TIME_FILTERS.TODAY) timeKey = "today";
  if (timeFilter === TIME_FILTERS.LAST_7_DAYS) timeKey = "last7";
  if (timeFilter === TIME_FILTERS.LAST_30_DAYS) timeKey = "last30";
  if (timeFilter === TIME_FILTERS.ALL) timeKey = "all";

  return (
    <div className={styles["main-container"]}>
      <Header title="QR Code Analytics" info="Track how your QR code is performing" />

      <div className={styles["filters"]}>
        <Filter
          icon="globe"
          title="Filter by Region"
          items={REGION_FILTERS}
          activeItem={regionFilter}
          onChange={(value) => dispatch(regionFilterChanged(value))}
        />
        <Filter
          icon="calendar_today"
          title="Filter by Date"
          items={TIME_FILTERS}
          activeItem={timeFilter}
          onChange={(value) => dispatch(timeFilterChanged(value))}
        />
      </div>

      <div className={styles["analytics"]}>
        {data.length === 0 && (
          <div className={styles["empty-container"]}>
            <img src={ILLUSTRATIONS.CAMPAIGN} alt="no data to show" />
            <Label text="No data available yet." />
          </div>
        )}
        {data.length > 0 && (
          <div className={`${styles["row"]} ${styles["title"]}`}>
            <span>{regionFilter}</span>
            <span>Visits</span>
          </div>
        )}
        {data.map((item, index) => {
          const countryCode = countries[index]["country"];
          const country = getCountryName(countryCode);
          const city = cities[index]["city"];
          const text = regionFilter === REGION_FILTERS.COUNTRY ? country : `${city}, ${country}`;

          return (
            <div key={index} className={styles["row"]}>
              <Region countryCode={countryCode} text={text} />
              <span>{item[timeKey]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsPage;

const Region = ({ countryCode, text }) => {
  return (
    <div className={styles["region"]}>
      <ReactCountryFlag countryCode={countryCode} svg />
      <span>{text}</span>
    </div>
  );
};
