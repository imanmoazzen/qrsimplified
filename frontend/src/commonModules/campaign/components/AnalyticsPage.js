import ReactCountryFlag from "react-country-flag";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import { ILLUSTRATIONS } from "../../../commonComponents/Illustrations/Illustrations.js";
import Label from "../../../commonComponents/Label/Label.js";
import { campaignModule } from "../../../index.js";
import { REGION_FILTERS, TIME_FILTERS, regionFilterChanged, timeFilterChanged } from "../store/uiReducer.js";
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

  const cloneData = [...data];
  cloneData.sort((a, b) => (b[timeKey] ?? 0) - (a[timeKey] ?? 0));

  const downloadCSV = () => {
    const filename = `${campaign.name}-leads.csv`;
    const leads = campaign?.leads;
    if (!leads?.length) return;

    const ORDER = ["name", "email", "phone", "title", "comment"];
    const headers = ORDER.filter((key) => leads.some((l) => l[key] != null));
    const rows = leads.map((obj) => headers.map((h) => `"${String(obj[h] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

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
        {cloneData.length === 0 && (
          <div className={styles["empty-container"]}>
            <img src={ILLUSTRATIONS.CAMPAIGN} alt="no data to show" />
            <Label text="No data available yet." />
          </div>
        )}
        {cloneData.length > 0 && (
          <div className={`${styles["row"]} ${styles["title"]}`}>
            <span>{regionFilter}</span>
            <span>Visits</span>
          </div>
        )}
        {cloneData.map((item, index) => {
          return (
            <div key={index} className={styles["row"]}>
              <div className={styles["region"]}>
                {item?.country?.length === 2 && <ReactCountryFlag countryCode={item?.country} svg />}
                <span>{item.label}</span>
              </div>

              <span>{item[timeKey]}</span>
            </div>
          );
        })}
      </div>

      {campaign?.lead && (
        <div className={styles["leads-container"]}>
          <span className={styles["info"]}>{campaign?.leads?.length ?? 0} leads are collected</span>
          <DecoratedButton buttonText="Download Leads" icon="download" onClick={downloadCSV} />
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
