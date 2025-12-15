export default class Timer {
  constructor(updateRateInMs = 100) {
    this.updateRateInMs = updateRateInMs;
    this.interval = 0;
    this.time = 0;
  }

  start = (publish, durationLimitInMs, final) => {
    this.clear();

    this.interval = setInterval(() => {
      this.time += this.updateRateInMs;
      publish?.(this.time);

      if (durationLimitInMs && this.time > durationLimitInMs) {
        final?.(this.time);
        this.clear();
      }
    }, this.updateRateInMs);
  };

  stop = () => {
    clearInterval(this.interval);
  };

  clear = () => {
    clearInterval(this.interval);
    this.time = 0;
  };
}

export const timer = new Timer();
